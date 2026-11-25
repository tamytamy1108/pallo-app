import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { GrowInput } from '@/components/ui/grow-input';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { haptic, sfx } from '@/lib/feedback';
import { SPEECH_PROBLEM_TEXT, useSpeech } from '@/lib/speech';
import { stopSpeaking } from '@/lib/tts';

import { Body, Foot, useRunner } from '../frame';
import { AnsCards, ExtraView, FollowBubble, Marked, ModelCard, SplitView, TopPart, UpgradeCard } from '../parts';
import { Ring, RING_PURPLE, useCountdown } from '../ring';
import { aiFix, MIN_SENT, nrm, pickOne, sentN, splitAnswer, upgradeOf, words, type Split } from '../text';
import type { SayExtra, SayTask } from '../types';
import { CardHead, CmpBox, EndMsg, EndNote, FootRow, GoBtn, MicKey, ModeTabs, Msg, NoSpeakToggle, SkipBtn, Spk, Stars, SUB, UsedList, sayEn } from '../ui';
import { PickBlock } from './pick';

type Mode = 'voice' | 'write';
type Ph = 'spin' | 'ready' | 'prep' | 'go' | 'rec' | 'res';
type Res = { v: string; sec: number | null; checks: { l: string; on: boolean }[]; nOn: number; ok: boolean; split: Split | null; missing: string[]; late: boolean; extra?: SayExtra };
type St = { mode: Mode; ph: Ph; topic?: { en: string; ko: string }; append?: { base: string; missing: string[] }; tries: number; draft: string; late: boolean; goT: boolean; res?: Res; follow: boolean };

/** 프리토킹 레벨은 3문장 이상 (짧은 · 정답형 · 30초 미만은 빼고) — 프로토타입 needSent */
const needSent = (t: SayTask) => (!(t.exact || t.oneLine || (t.limit && t.limit < 30)) ? MIN_SENT : 0);

/** 꼬리 질문으로 바꾼 문제 (프로토타입 TKV.say 맨 위 Object.assign) */
const asFollow = (t: SayTask): SayTask =>
  t.follow
    ? {
        ...t,
        ask: { en: t.follow[0], ko: t.follow[1] },
        kick: `${t.kick} · 팔로의 꼬리 질문`,
        checks: [],
        need: 0,
        split: undefined,
        marks: undefined,
        card: undefined,
        model: t.follow[2],
        modelLabel: '이렇게 답할 수도 있어요',
        prompt: '1~2문장으로 짧게 이어 말해요',
        ph: 'Because ___.',
        minWords: 3,
        oneLine: true,
        follow: undefined,
        upgrade: false,
        save: undefined,
        okMsg: '좋아요! 대화가 자연스럽게 이어졌어요',
        roulette: undefined,
      }
    : t;

/**
 * 시간 제한 말하기 (프로토타입 TKV.say).
 * 준비 시간 → 말 시작 제한 → 말하는 시간 → 체크 항목 · 칸 나누기 · 콤보 · 모범 답.
 * 말하기가 어려워요: 시계를 모두 끄고 쓰기로 (쓰기로 바꾸기 어려운 문제는 alt 고르기로).
 */
export function SayBlock({ task }: { task: SayTask }) {
  const rt = useRunner();
  if (rt.noSpeak && task.alt) return <PickBlock task={task.alt} from={task} />;
  return <SayInner task={task} />;
}

function SayInner({ task }: { task: SayTask }) {
  const rt = useRunner();
  const { soundOff } = rt;
  const fresh = (keep: Partial<St> = {}): St => {
    const mode = keep.mode ?? (rt.noSpeak ? 'write' : 'voice');
    const topic = keep.topic;
    const ph: Ph = task.roulette && !topic && !keep.follow ? 'spin' : task.prep && mode === 'voice' && !keep.follow ? 'ready' : 'go';
    return { mode, ph, tries: 0, draft: '', late: false, goT: false, follow: false, ...keep };
  };
  const [st, setSt] = useState<St>(() => fresh());
  const t = st.follow ? asFollow(task) : task;
  const voice = st.mode === 'voice';
  const sIn = t.startIn ? t.startIn + (soundOff && t.listen ? 3 : 0) : 0;
  const cd = useCountdown();
  const goT = useRef(false);
  const [heard, setHeard] = useState('');
  const [spinText, setSpinText] = useState('?');
  const t0 = useRef(0);
  // 듣기 · 시계 콜백은 화면이 다시 그려지기 전에 불려요 → 지금 상태를 ref 로도 봐요
  const stRef = useRef(st);
  useEffect(() => {
    stRef.current = st;
  });

  useEffect(() => {
    rt.setKick(st.follow ? t.kick : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.follow]);
  useEffect(() => () => stopSpeaking(), []);

  // ---- 채점 (프로토타입 sayEval) ----
  const evaluate = (raw: string, sec: number | null) => {
    const cur = stRef.current;
    cd.stop();
    const v = cur.append ? `${cur.append.base} ${raw}` : raw;
    const tx = nrm(v);
    const checks = (t.checks ?? []).map(([l, f]) => ({ l, on: typeof f === 'function' ? !!f(tx) : f.test(tx) }));
    const nOn = checks.filter((c) => c.on).length;
    const need = t.need ?? checks.length;
    const split = t.split ? splitAnswer(tx, t.split.keys, t.split.ex) : null;
    const missing = split ? [...split.missing] : [];
    const ns = needSent(t);
    const sn = sentN(v);
    if (ns && sn < ns && !(split && split.size >= ns)) missing.push(`문장 ${ns - sn}개를 더 말해요 · 지금 ${sn}문장`);
    const ok = nOn >= need && words(v) >= (t.minWords ?? 0) && !missing.length;
    rt.mark(ok);
    if (t.combo) rt.setCombo(ok && !cur.late ? rt.combo + 1 : 0);
    rt.log({ k: t.kick, v, ok, late: cur.late, deb: t.deb });
    const out = t.save?.(v, { checksOn: nOn });
    if (out?.next) rt.replaceRest(out.next);
    if (out?.extra?.kind === 'sharp') {
      const en = out.extra.en;
      setTimeout(() => sayEn(en, soundOff, 0.95), 400);
    }
    sfx(ok ? 'correct' : 'tap');
    haptic(ok ? 'success' : 'tap');
    setSt((s) => ({ ...s, ph: 'res', append: undefined, tries: s.tries + 1, res: { v, sec, checks, nOn, ok, split, missing, late: s.late, extra: out?.extra } }));
  };

  const speech = useSpeech({
    onText: (text) => setHeard(text),
    onEnd: (text) => {
      if (stRef.current.ph !== 'rec') return;
      cd.stop();
      if (!text.trim()) {
        setSt((s) => ({ ...s, ph: 'go' }));
        showToast('말한 내용이 없어요 · 다시 눌러 말해 보세요');
        return;
      }
      evaluate(text.trim(), Math.max(1, Math.round((Date.now() - t0.current) / 1000)));
    },
  });

  // ---- 시계: 말 시작까지 (화면이 열리면 바로 · 듣고 바로 말하기는 다 읽어 준 뒤) ----
  useEffect(() => {
    if (st.ph !== 'go' || !voice || goT.current) return;
    if (sIn && !st.late) {
      goT.current = true;
      const first = () => {
        if (stRef.current.ph !== 'go') return;
        cd.start(sIn, () => {
          setSt((s) => ({ ...s, late: true }));
          sfx('wrong');
          haptic('warning');
        });
      };
      if (t.listen && !soundOff) sayEn(t.listen, false, 0.92, first);
      else first();
      return;
    }
    if (!t.startIn && t.listen && !soundOff) {
      const tm = setTimeout(() => {
        goT.current = true;
        sayEn(t.listen ?? '', false, 0.92);
      }, 300);
      return () => clearTimeout(tm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.ph, st.mode, st.follow]);

  /** 지금 보여 줄 원형 시계 (프로토타입 ringHTML 고르는 순서 그대로) */
  const ring: { total: number; label: string; color?: string } | null =
    st.ph === 'ready' || st.ph === 'prep'
      ? task.prep
        ? { total: task.prep, label: '준비 시간', color: RING_PURPLE }
        : null
      : st.ph === 'rec' && t.limit
        ? { total: t.limit, label: '말하는 시간' }
        : sIn
          ? { total: sIn, label: st.late ? '시간 초과 · 그래도 말해 봐요' : soundOff && t.listen ? '읽고 말 시작까지' : '말 시작까지' }
          : t.limit
            ? { total: t.limit, label: '말하는 시간' }
            : null;

  /** 같은 문제를 처음부터 (keep 은 이어 가는 것: 답하는 방식 · 빠진 칸 · 꼬리 질문 …) */
  const reset = (keep: Partial<St>) => {
    speech.stop();
    cd.stop();
    cd.reset();
    goT.current = !!keep.goT;
    setHeard('');
    setSt(fresh(keep));
  };

  const startPrep = () => {
    const prep = task.prep ?? 15;
    setSt((s) => ({ ...s, ph: 'prep' }));
    cd.start(prep, () => {
      setSt((s) => ({ ...s, ph: 'go' }));
      cd.reset();
      sfx('tap');
    });
  };
  const skipPrep = () => {
    cd.stop();
    cd.reset();
    setSt((s) => ({ ...s, ph: 'go' }));
  };

  const pressMic = () => {
    if (st.ph === 'rec') {
      speech.stop();
      return;
    }
    if (!speech.available) {
      showToast(SPEECH_PROBLEM_TEXT.unavailable);
      return;
    }
    stopSpeaking();
    cd.stop();
    t0.current = Date.now();
    setHeard('');
    setSt((s) => ({ ...s, ph: 'rec' }));
    haptic('tap');
    void speech.start();
    if (t.limit) {
      // 말하는 동안은 째깍 소리를 내지 않아요 (마이크에 들어가지 않게)
      cd.start(t.limit, () => speech.stop(), { quiet: true });
    }
  };

  // 개발용(웹): 콘솔에서 __palloSay('I think ...') 로 '이렇게 말했다'를 흉내 내요. 출시 빌드엔 안 들어가요
  useEffect(() => {
    if (!__DEV__ || Platform.OS !== 'web') return;
    Reflect.set(globalThis, '__palloSay', (text: string) => {
      const cur = stRef.current;
      if (cur.ph === 'res' || cur.ph === 'spin' || cur.ph === 'ready') return;
      if (cur.mode === 'write') setSt((s) => ({ ...s, draft: text }));
      else evaluate(text, Math.max(1, Math.round((Date.now() - (t0.current || Date.now())) / 1000)) || 4);
    });
    return () => void Reflect.deleteProperty(globalThis, '__palloSay');
  });

  // 즉흥 룰렛: 처음 보는 토픽을 뽑아요
  const spin = () => {
    if (!task.roulette) return;
    const list = task.roulette;
    let n = 0;
    setSpinText(pickOne(list).en);
    const iv = setInterval(() => {
      n += 1;
      sfx('tap');
      setSpinText(pickOne(list).en);
      if (n > 9) {
        clearInterval(iv);
        const topic = pickOne(list);
        sfx('correct');
        setSt((s) => ({ ...s, topic, ph: s.mode === 'voice' ? 'ready' : 'go' }));
        if (stRef.current.mode === 'voice') setTimeout(() => sayEn(topic.en, soundOff, 0.95), 200);
      }
    }, 120);
  };

  const switchMode = (mode: Mode) => reset({ mode, topic: st.topic, append: st.append, tries: st.tries, follow: st.follow, ...(st.append ? { ph: 'go' as const, goT: true } : {}) });
  const toggleNs = () => {
    speech.stop();
    cd.stop();
    rt.toggleNoSpeak();
  };

  const top = <TopPart head={t.head} ask={t.roulette && st.topic ? { en: st.topic.en, ko: st.topic.ko } : t.ask} card={t.card} soundOff={soundOff} />;
  const modes = t.noWrite ? null : (
    <ModeTabs<Mode>
      list={[
        ['voice', '말하기'],
        ['write', '쓰기'],
      ]}
      cur={st.mode}
      onPick={switchMode}
    />
  );
  const ns = <NoSpeakToggle on={rt.noSpeak} onPress={toggleNs} />;
  // 말하기 · 쓰기 탭이 있으면 '말하기가 어려워요'는 따로 두지 않아요 (프로토타입 v503 · AI 대화 화면과 같게)
  const nsIfNoTabs = modes ? null : ns;

  // ---- 결과 ----
  if (st.ph === 'res' && st.res) return <SayResult t={t} st={st} res={st.res} top={top} sIn={sIn} onAgain={reset} />;

  // ---- 룰렛 ----
  if (st.ph === 'spin')
    return (
      <>
        <Body>
          <TopPart head={t.head} soundOff={soundOff} />
          <View style={styles.spin} accessibilityLiveRegion="polite">
            <PText style={styles.spinT}>{spinText}</PText>
          </View>
          <Msg text="룰렛이 처음 보는 토픽을 골라요 · 15초 준비 → 1분 스피치" />
        </Body>
        <Foot>
          {ns}
          <GoBtn label="룰렛 돌리기" onPress={spin} disabled={spinText !== '?'} />
        </Foot>
      </>
    );

  // ---- 글로 쓰기 (시간 없음) ----
  if (!voice)
    return (
      <>
        <Body>
          {top}
          {st.append ? <CmpBox label="먼저 말한 내용" text={st.append.base} /> : null}
          <Msg
            text={
              st.append
                ? `**${st.append.missing.join(' · ')}**만 이어서 써요`
                : `${t.prompt || '영어로 내 생각을 써요'}${needSent(t) ? ` · ${MIN_SENT}문장 이상` : ''}${rt.noSpeak ? ' · 시간 제한 없이 풀어요' : ''}`
            }
          />
          <GrowInput
            value={st.draft}
            onChangeText={(draft) => setSt((s) => ({ ...s, draft }))}
            multiline
            placeholder={t.ph || 'I think ___ because ___. For example, ___.'}
            placeholderTextColor="#B9B2A3"
            autoCapitalize="sentences"
            style={StyleSheet.flatten([styles.ta, { minHeight: (t.limit ?? 0) > 30 ? 130 : 90 }])}
            accessibilityLabel="영어로 쓰기"
          />
        </Body>
        <Foot>
          {nsIfNoTabs}
          {modes}
          <FootRow>
            <GoBtn label="확인" disabled={!st.draft.trim()} onPress={() => evaluate(st.draft.trim(), null)} />
          </FootRow>
        </Foot>
      </>
    );

  // ---- 말하기 ----
  const tip =
    st.ph === 'ready' || st.ph === 'prep'
      ? t.prepTip || '무엇을 말할지 머릿속으로 정리해요 · 주장 → 이유 → 예시'
      : st.append
        ? `**${st.append.missing.join(' · ')}**만 이어서 말해요`
        : [t.prompt || '', needSent(t) ? `${MIN_SENT}문장 이상` : ''].filter(Boolean).join(' · ');
  return (
    <>
      <Body>
        {top}
        {st.append ? <CmpBox label="먼저 말한 내용" text={st.append.base} /> : null}
        {ring ? <Ring left={cd.left ?? ring.total} total={ring.total} label={ring.label} color={ring.color} /> : null}
        <Msg text={tip} />
        {st.ph === 'rec' || heard ? (
          <PText style={styles.said} color={heard ? Colors.ink : SUB}>
            {heard || '듣고 있어요…'}
          </PText>
        ) : null}
        {speech.problem && speech.problem !== 'unavailable' ? <Msg text={SPEECH_PROBLEM_TEXT[speech.problem]} /> : null}
      </Body>
      <Foot>
        {nsIfNoTabs}
        {modes}
        {st.ph === 'ready' ? (
          <FootRow>
            <GoBtn label={`준비 시작 · ${task.prep}초`} onPress={startPrep} />
          </FootRow>
        ) : st.ph === 'prep' ? (
          <FootRow>
            <GoBtn label="바로 말하기" onPress={skipPrep} />
          </FootRow>
        ) : (
          <MicKey label={t.limit ? '말하기 시작' : '눌러서 말하기'} live="다 말했어요" on={st.ph === 'rec'} combo={rt.combo ? `콤보 x${rt.combo}` : ''} onPress={pressMic} />
        )}
      </Foot>
    </>
  );
}

/** 결과 (프로토타입 sayResult · 정답형은 sayExactRetry) */
function SayResult({ t, st, res, top, sIn, onAgain }: { t: SayTask; st: St; res: Res; top: ReactNode; sIn: number; onAgain: (keep: Partial<St>) => void }) {
  const rt = useRunner();
  const { soundOff, source } = rt;
  const [upg] = useState(() => (t.upgrade ? upgradeOf(res.v) : null));
  const exact = t.exact && !res.ok && t.model;
  const again = st.tries < 2;
  const cardsSaid = useRef(false);
  useEffect(() => {
    if (!exact || again || cardsSaid.current || !t.model) return;
    cardsSaid.current = true;
    const n = t.model.split(/\s+/).length;
    const tm = setTimeout(() => sayEn(t.model ?? '', soundOff), n * 110 + 450);
    return () => clearTimeout(tm);
  }, [exact, again, t.model, soundOff]);

  // 정답이 하나인 말하기: 틀리면 힌트 → 또 틀리면 정답 카드
  if (exact && t.model) {
    const ws = t.model.split(/\s+/);
    return (
      <>
        <Body toEnd={!again}>
          {top}
          <View style={styles.card}>
            <CardHead label={res.sec ? `내가 한 말 · ${res.sec}초` : '내 답'} />
            <PText style={styles.mine}>{res.v}</PText>
          </View>
          {again ? (
            <PText style={styles.msg} color={SUB}>
              <PText style={styles.msgB} color="#C2416B">
                조금 달라요
              </PText>
              {' · 힌트 '}
              <PText style={styles.msg}>{ws.slice(0, Math.min(3, Math.ceil(ws.length / 3))).join(' ')} …</PText>
              {' 로 시작해요'}
            </PText>
          ) : (
            <>
              <AnsCards sentence={t.model} soundOff={soundOff} />
              <Msg text="카드 순서대로 한 번 소리 내어 읽어 봐요" />
            </>
          )}
        </Body>
        <Foot>
          {again ? (
            <>
              <EndNote good={false}>
                <PText style={styles.retryEn} color="#C2416B">
                  Not quite!
                </PText>
                <PText style={styles.retryKo} color={SUB}>
                  한 번 더 말해 봐요 · 기회가 한 번 남았어요
                </PText>
              </EndNote>
              <FootRow>
                <SkipBtn label="넘어가기" onPress={rt.next} />
                <GoBtn label="한 번 더" onPress={() => onAgain({ mode: st.mode, tries: st.tries, goT: true, late: false, ph: 'go' })} />
              </FootRow>
            </>
          ) : (
            <FootRow>
              <GoBtn label={rt.goLabel} onPress={rt.next} />
            </FootRow>
          )}
        </Foot>
      </>
    );
  }

  const miss = res.missing;
  const n = res.ok ? (res.late ? 2 : 3) : res.nOn > 0 || (res.split && res.split.got) ? 1 : 0;
  const re = miss.length > 0 && st.tries < 3;
  const fix = aiFix(res.v, []);
  const tail = ` · 단어 ${words(res.v)}개${t.combo && rt.combo ? ` · 콤보 x${rt.combo}` : ''}`;
  let bold: string | undefined;
  let rest: string;
  if (res.late) {
    bold = `${sIn || t.startIn}초를 넘겼어요`;
    rest = ` · ${t.combo ? '콤보가 끊겼어요' : '다음엔 더 빨리'}${tail}`;
  } else if (res.ok) rest = (t.okMsg || '좋아요! 기준을 다 채웠어요') + tail;
  else if (miss.length) {
    const more = miss.find((x) => /^문장 \d/.test(x));
    const sl = miss.filter((x) => !/^문장 \d/.test(x));
    if (sl.length) {
      bold = `${sl.join(' · ')} 문장이 빠졌어요`;
      rest = `빠진 걸 넣어 다시 답해 봐요${tail}`;
    } else {
      bold = (more ?? '').split(' · ')[0];
      rest = ((more ?? '').split(' · ')[1] || '') + tail;
    }
  } else rest = (t.noMsg || '기준을 다 채우지 못했어요 · 한 번 더 해 볼까요?') + tail;

  return (
    <>
      <Body toEnd={res.v}>
        {top}
        <View style={styles.card}>
          <CardHead label={res.sec ? `내가 한 말 · ${res.sec}초` : '내 답'}>
            <Spk text={res.v} soundOff={soundOff} label="내 말 듣기" />
          </CardHead>
          <Marked text={res.v} marks={t.marks} />
          {/* 오타 · 문법을 고쳐 보여 줘요 (AI 대화와 같은 규칙 · 실제 앱은 AI) */}
          {fix.changed ? (
            <View style={styles.fix}>
              <PText style={styles.fixK} color="#2F6B2A">
                {`AI 교정 · ${fix.why.join(' / ') || '문장 다듬기'}`}
              </PText>
              <PText style={styles.fixB}>{fix.text}</PText>
            </View>
          ) : null}
        </View>
        {res.split ? <SplitView split={res.split} /> : null}
        {res.checks.length ? <UsedList items={res.checks} /> : null}
        <Stars n={n} />
        {upg && !(miss.length && st.tries < 3) ? <UpgradeCard from={upg.from} to={upg.to} ko={upg.ko} soundOff={soundOff} source={source} /> : null}
        {t.follow && res.ok ? <FollowBubble en={t.follow[0]} ko={t.follow[1]} /> : null}
        {t.model ? <ModelCard label={t.modelLabel || '이렇게 말할 수도 있어요'} en={t.model} ko={t.modelKo} soundOff={soundOff} source={source} /> : null}
        {res.extra ? <ExtraView extra={res.extra} soundOff={soundOff} /> : null}
      </Body>
      <Foot>
        <EndNote good={res.ok && !res.late}>
          <EndMsg title={bold} rest={rest} good={res.ok && !res.late} />
        </EndNote>
        <FootRow>
          {re ? (
            <>
              <SkipBtn label="그냥 넘어가기" onPress={rt.next} />
              <GoBtn label="다시 답변하기" onPress={() => onAgain({ mode: st.mode, tries: st.tries, topic: st.topic, ph: 'go', goT: true })} />
            </>
          ) : t.follow && res.ok ? (
            <>
              <SkipBtn label={rt.goLabel} onPress={rt.next} />
              <GoBtn
                label="꼬리 질문 답하기"
                onPress={() => {
                  onAgain({ mode: st.mode, follow: true, ph: 'go' });
                  setTimeout(() => sayEn(t.follow?.[0] ?? '', soundOff, 0.95), 250);
                }}
              />
            </>
          ) : (
            <>
              <SkipBtn label="다시 하기" onPress={() => onAgain({ mode: st.mode, topic: st.topic, tries: st.tries, follow: st.follow })} />
              <GoBtn label={rt.goLabel} onPress={rt.next} />
            </>
          )}
        </FootRow>
      </Foot>
    </>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  mine: { fontFamily: Font.body800, fontSize: 16, lineHeight: 24.8 },
  fix: { marginTop: 8, paddingVertical: 9, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#EAF6E7', gap: 2 },
  fixK: { fontFamily: Font.body900, fontSize: 11.5, lineHeight: 16 },
  fixB: { fontFamily: Font.body800, fontSize: 15, lineHeight: 22 },
  msg: { fontFamily: Font.body800, fontSize: 13, lineHeight: 20.15, textAlign: 'center' },
  msgB: { fontFamily: Font.body900, fontSize: 13, lineHeight: 20.15 },
  retryEn: { fontFamily: Font.display, fontSize: 22, lineHeight: 26.4, letterSpacing: -0.4 },
  retryKo: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18, marginTop: 2 },
  said: { fontFamily: Font.body700, fontSize: 15, lineHeight: 22, textAlign: 'center', paddingHorizontal: 8 },
  ta: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 16, backgroundColor: Colors.cream, paddingLeft: 14, paddingRight: 54, paddingVertical: 12, fontFamily: Font.body500, fontSize: 15, lineHeight: 22.5, color: Colors.ink, textAlignVertical: 'top' },
  spin: { minHeight: 110, padding: 16, borderWidth: 2.5, borderColor: Colors.ink, borderRadius: 22, backgroundColor: Colors.yellow, boxShadow: `4px 4px 0px ${Colors.ink}`, alignItems: 'center', justifyContent: 'center' },
  spinT: { fontFamily: Font.body900, fontSize: 19, lineHeight: 26.6, textAlign: 'center' },
});
