import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { GrowInput } from '@/components/ui/grow-input';
import { Pressable } from '@/components/ui/pressable';
import { WordCard } from '@/components/lesson/word-card';
import { Appear } from '@/components/ui/appear';
import { PText } from '@/components/ui/text';
import { showToast, showWarnToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { haptic, sfx } from '@/lib/feedback';
import { SPEECH_PROBLEM_TEXT, useSpeech } from '@/lib/speech';
import { matchSpeech, shuffled, wordKey } from '@/lib/words';
import { readLines, stopSpeaking } from '@/lib/tts';

import { Body, Foot, useRunner } from '../frame';
import { ModelCard, TopPart } from '../parts';
import { words as countWords, wordRe } from '../text';
import type { BlindTask, ChooseTask, DuoTask, ExplainTask, ReadTask, ScoreTask } from '../types';
import { CardHead, Check, FootRow, GoBtn, IMG, MicKey, Msg, NoSpeakToggle, PINK_INK, Rich, SkipBtn, Spk, SUB, sayEn } from '../ui';

/** 설명 카드 (프로토타입 TKV.explain): 규칙 · 혀 위치 · 단어 차이 · 활동 규칙 · SITUATION */
export function ExplainBlock({ task: t }: { task: ExplainTask }) {
  const rt = useRunner();
  useEffect(() => {
    if (!t.listen) return;
    const tm = setTimeout(() => sayEn(t.listen ?? '', rt.soundOff, 0.92), 300);
    return () => {
      clearTimeout(tm);
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      <Body>
        <TopPart head={t.head} soundOff={rt.soundOff} />
        <View style={styles.exp}>
          <PText style={styles.expK} color={Colors.purple}>
            {t.k}
          </PText>
          <PText style={styles.expB}>{t.title}</PText>
          {t.body ? (
            <PText style={styles.expP}>
              <Rich text={t.body} />
            </PText>
          ) : null}
          {(t.ex ?? []).map(([en, ko], i) => (
            <View key={i} style={styles.exRow}>
              <View style={styles.flex}>
                <PText style={styles.exEn}>{en}</PText>
                {ko ? (
                  <PText style={styles.exKo} color={SUB}>
                    {ko}
                  </PText>
                ) : null}
              </View>
              <Spk text={en} soundOff={rt.soundOff} />
            </View>
          ))}
        </View>
        {t.note ? <Msg text={t.note} /> : null}
      </Body>
      <Foot>
        <FootRow>
          <GoBtn label={t.go || '알겠어요'} onPress={rt.next} />
        </FootRow>
      </Foot>
    </>
  );
}

/** 질문 N개 중 몇 개 골라서 하기 (프로토타입 TKV.choose) */
export function ChooseBlock({ task: t }: { task: ChooseTask }) {
  const rt = useRunner();
  const [on, setOn] = useState<number[]>([]);
  const tap = (i: number) => {
    if (on.includes(i)) setOn(on.filter((x) => x !== i));
    else if (on.length < t.n) setOn([...on, i]);
    else {
      showToast(`${t.n}개까지 고를 수 있어요`);
      return;
    }
    sfx('tap');
    haptic('select');
  };
  const full = on.length === t.n;
  return (
    <>
      <Body>
        <TopPart head={t.head} soundOff={rt.soundOff} />
        <Msg text={`${t.msg || `질문 ${t.items.length}개 중 ${t.n}개를 골라요`} · ${on.length}/${t.n}`} />
        <View style={styles.opts}>
          {t.items.map((q, i) => {
            const sel = on.includes(i);
            return (
              <Pressable key={i} onPress={() => tap(i)} accessibilityRole="checkbox" accessibilityState={{ checked: sel }} accessibilityLabel={q.en}>
                {({ pressed }) => (
                  <View style={StyleSheet.flatten([styles.opt, sel && styles.optOn, pressed && styles.pressed])}>
                    <PText style={styles.qn} color={SUB}>{`Q${i + 1}`}</PText>
                    <PText style={styles.qEn}>{q.en}</PText>
                    <PText style={styles.qKo} color={SUB}>
                      {q.ko}
                    </PText>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </Body>
      <Foot>
        <FootRow>
          <GoBtn
            label={full ? `이 ${t.n}개로 시작` : `${t.n}개를 골라요`}
            disabled={!full}
            onPress={() => {
              rt.insert(t.make(on.slice().sort((a, b) => a - b)));
              rt.next();
            }}
          />
        </FootRow>
      </Foot>
    </>
  );
}

/** 디베이트 점수 (프로토타입 TKV.score): 논리 · 근거 · 표현 · 유창성 각 5점 + MVP 문장, 20점 → 5점 환산 */
export function ScoreBlock({ task: t }: { task: ScoreTask }) {
  const rt = useRunner();
  const [r] = useState(() => {
    const L = rt.logs().filter((x) => x.deb);
    const all = L.map((x) => x.v).join(' ');
    const cnt = (re: RegExp) => (all.match(re) || []).length;
    const keyRe = t.keys.map((k) => wordRe(k));
    const keyN = keyRe.filter((re) => re.test(all)).length;
    const clamp = (n: number) => Math.max(1, Math.min(5, Math.round(n)));
    const sc: [string, number][] = [
      ['논리', clamp(1 + cnt(/\b(because|so|therefore|that's why|if|then|which means)\b/gi) * 0.8)],
      ['근거', clamp(1 + cnt(/\b(for example|for instance|in fact|research|studies|data|percent|\d+)\b/gi) * 1.2)],
      ['표현', clamp(1 + keyN * 1.3)],
      ['유창성', clamp(L.length ? (L.filter((x) => !x.late && countWords(x.v) >= 8).length / L.length) * 5 : 1)],
    ];
    const sents = all.split(/(?<=[.!?])\s+/).filter((x) => countWords(x) >= 5);
    const mvp = sents
      .map((x) => ({ x, n: keyRe.filter((re) => re.test(x)).length * 3 + (/(because|for example)/i.test(x) ? 2 : 0) + Math.min(countWords(x), 20) / 10 }))
      .sort((a, b) => b.n - a.n)[0];
    const tot = sc.reduce((n, [, v]) => n + v, 0);
    return { sc, mvp: mvp?.x, tot, rounds: L.length, keyN };
  });
  useEffect(() => {
    rt.setScore(Math.round(r.tot / 4), 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      <Body>
        <View style={styles.res}>
          <Appear kind="reactHop">
            <Image source={r.tot >= 14 ? IMG.yellow : IMG.tilted} style={styles.resImg} contentFit="contain" />
          </Appear>
          <PText style={styles.resB}>{`${r.tot} / 20`}</PText>
          <Msg text={`DEBATE 결과 · 라운드 ${r.rounds}개`} />
        </View>
        <View style={styles.bars}>
          {r.sc.map(([l, v]) => (
            <View key={l} style={styles.barRow}>
              <PText style={styles.barL}>{l}</PText>
              <View style={styles.barI}>
                {/* 프로토타입 .tk-bars em: 분홍 → 보라 */}
                <LinearGradient colors={[Colors.rosePink, Colors.purple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.flatten([styles.barE, { width: `${v * 20}%` }])} />
              </View>
              <PText style={styles.barB}>{v}</PText>
            </View>
          ))}
        </View>
        {r.mvp ? <ModelCard label="MVP 문장 · 오늘 가장 설득력 있던 말" en={r.mvp} soundOff={rt.soundOff} source={`${rt.source} · DEBATE MVP 문장`} /> : null}
        <Msg text={r.keyN ? `KEY 표현 ${r.keyN}개를 썼어요` : 'KEY 표현을 한 번도 안 썼어요 · 다음 라운드엔 하나 넣어요'} />
      </Body>
      <Foot>
        <FootRow>
          <GoBtn label={rt.goLabel} onPress={rt.next} />
        </FootRow>
      </Foot>
    </>
  );
}

/** 글 가리고 듣기 (프로토타입 TKV.blind · 2번까지). 말하기가 어려워요 · 소리 끄기면 글을 보며 읽어요 */
export function BlindBlock({ task: t }: { task: BlindTask }) {
  const rt = useRunner();
  const max = t.max ?? 2;
  const [plays, setPlays] = useState(0);
  const [now, setNow] = useState<number | null>(null);
  // 듣는 중이면 멈추는 함수
  const cancel = useRef<(() => void) | null>(null);
  const open = rt.noSpeak || rt.soundOff;
  const playing = now != null;
  useEffect(() => () => cancel.current?.(), []);
  // 소리 끄기 · 말하기가 어려워요로 글이 열리면 듣던 것도 멈춰요
  useEffect(() => {
    if (open) cancel.current?.();
  }, [open]);
  const play = () => {
    setPlays((p) => p + 1);
    cancel.current = readLines(
      t.lines.map(([en]) => en),
      {
        rate: 0.95,
        onLine: setNow,
        onFinish: () => {
          cancel.current = null;
          setNow(null);
        },
      },
    );
  };
  const can = plays >= 1 || open;
  return (
    <>
      <Body>
        <TopPart head={t.head} soundOff={rt.soundOff} />
        <View style={styles.card}>
          <CardHead label={open ? '글 보며 읽어요' : `글을 가린 채 들어요 · ${plays}/${max}번`}>
            {playing ? (
              <PText style={styles.onair} color={PINK_INK}>
                재생 중
              </PText>
            ) : null}
          </CardHead>
          <PText style={StyleSheet.flatten([styles.blind, !open && styles.blur])}>
            {t.lines.map(([en], i) => (
              <PText key={i} onPress={open ? () => sayEn(en, rt.soundOff, 0.92) : undefined} style={StyleSheet.flatten([styles.blind, !open && styles.blur, now === i && styles.now])}>
                {en}{' '}
              </PText>
            ))}
          </PText>
        </View>
        <Msg text={open ? '뜻이 궁금한 줄은 눌러서 들어요' : '어떤 일이 있었는지 · 생각이 어떻게 바뀌었는지 들어요 · 다 듣고 30초 요약'} />
      </Body>
      <Foot>
        <NoSpeakToggle on={rt.noSpeak} onPress={rt.toggleNoSpeak} />
        <FootRow>
          {!open ? <SkipBtn label={playing ? '듣는 중' : plays ? '한 번 더 듣기' : '듣기 시작'} onPress={() => plays < max && !playing && play()} /> : null}
          <GoBtn
            label={can ? (t.go ?? '30초 요약하기') : '한 번 들으면 다음'}
            disabled={!can || playing}
            onPress={() => {
              cancel.current?.();
              rt.next();
            }}
          />
        </FootRow>
      </Foot>
    </>
  );
}

/** AI 짝과 주고받기 (프로토타입 TKV.duo · 대본이 정해진 대화 — 실제 앱은 AI 응답) */
export function DuoBlock({ task: t }: { task: DuoTask }) {
  const rt = useRunner();
  const [log, setLog] = useState<{ me?: boolean; en: string; ko?: string }[]>(() => [{ en: t.lines[0][0], ko: t.lines[0][1] }]);
  const [i, setI] = useState(0);
  const [fin, setFin] = useState(false);
  const [draft, setDraft] = useState('');
  useEffect(() => {
    const tm = setTimeout(() => sayEn(t.lines[0][0], rt.soundOff, 0.95), 300);
    return () => clearTimeout(tm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const send = () => {
    const v = draft.trim();
    if (!v) {
      showWarnToast('영어로 한마디 해 주세요');
      return;
    }
    const nx = t.lines[i + 1];
    const add: typeof log = [{ me: true, en: v }];
    let end = !nx;
    if (nx) {
      add.push({ en: nx[0], ko: nx[1] });
      setTimeout(() => sayEn(nx[0], rt.soundOff, 0.95), 250);
      if (nx[2]) end = true;
    }
    setLog((l) => [...l, ...add]);
    setDraft('');
    setI(i + 1);
    sfx(end ? 'correct' : 'tap');
    if (end) setFin(true);
  };
  const mine = log.filter((m) => m.me).map((m) => m.en);
  return (
    <>
      <Body toEnd={log.length}>
        <TopPart head={t.head} soundOff={rt.soundOff} />
        <View style={styles.chat}>
          {log.map((m, k) =>
            m.me ? (
              <View key={k} style={styles.meRow}>
                <View style={styles.meB}>
                  <PText style={styles.msgT}>{m.en}</PText>
                </View>
              </View>
            ) : (
              <View key={k} style={styles.aiRow}>
                <View style={StyleSheet.flatten([styles.av, { backgroundColor: t.c }])}>
                  <PText style={styles.avT} color={Colors.white}>
                    {t.who[0]}
                  </PText>
                </View>
                <View style={styles.flex}>
                  <PText style={styles.who} color={SUB}>
                    {t.who}
                  </PText>
                  <View style={styles.aiB}>
                    <PText style={styles.msgT}>{m.en}</PText>
                    {m.ko ? (
                      <PText style={styles.exKo} color={SUB}>
                        {m.ko}
                      </PText>
                    ) : null}
                  </View>
                </View>
              </View>
            ),
          )}
        </View>
        {fin && t.result ? (
          <View style={styles.team}>
            <PText style={styles.teamK} color={SUB}>
              {t.result.title}
            </PText>
            {t.result.items(mine).map((x, k) => (
              <View key={k} style={styles.teamRow}>
                <View style={styles.teamI}>
                  <Check size={12} />
                </View>
                <PText style={styles.teamT}>{x}</PText>
              </View>
            ))}
          </View>
        ) : null}
        {!fin ? (
          <GrowInput value={draft} onChangeText={setDraft} multiline placeholder={t.ph || '영어로 답해요 · 마이크를 눌러 말해도 돼요'} placeholderTextColor="#B9B2A3" style={styles.ta} accessibilityLabel="영어로 답하기" />
        ) : null}
      </Body>
      <Foot>
        {fin ? (
          <FootRow>
            <GoBtn label={rt.goLabel} onPress={rt.next} />
          </FootRow>
        ) : (
          <>
            <NoSpeakToggle on={rt.noSpeak} onPress={rt.toggleNoSpeak} />
            <FootRow>
              <GoBtn label="보내기" onPress={send} />
            </FootRow>
          </>
        )}
      </Foot>
    </>
  );
}

/**
 * 다듬은 글 다시 읽기 (프로토타입 journal ② · TKV.shadow): 섞인 단어 카드를 말하거나 눌러서 순서대로 이어요.
 * 답 문장은 다 잇기 전에는 읽어 주지 않아요.
 */
export function ReadBlock({ task: t }: { task: ReadTask }) {
  const rt = useRunner();
  const ws = t.en.split(/\s+/).filter(Boolean);
  const N = ws.length;
  const [mix] = useState(() => shuffled(N));
  const [used, setUsed] = useState<number[]>([]);
  const [shake, setShake] = useState<{ i: number; n: number } | null>(null);
  const [miss, setMiss] = useState(0);
  const usedRef = useRef<number[]>([]);
  const done = used.length >= N;
  const link = (next: number[]) => {
    usedRef.current = next;
    setUsed(next);
  };
  const cardFor = (k: number, taken: number[]) => mix.find((i) => !taken.includes(i) && wordKey(ws[i]) === wordKey(ws[k]));
  const speech = useSpeech({
    onProblem: (p) => showToast(SPEECH_PROBLEM_TEXT[p]),
    onText: (text) => {
      const r = matchSpeech(text, ws);
      const now = usedRef.current;
      if (r.count <= now.length) return;
      const picks = [...now];
      for (let k = now.length; k < r.count; k++) {
        const c = cardFor(k, picks);
        if (c != null) picks.push(c);
      }
      link(picks);
    },
  });
  useEffect(() => {
    if (!done) return;
    speech.stop();
    rt.mark(miss < 3);
    sfx('correct');
    const tm = setTimeout(() => sayEn(t.en, rt.soundOff, 0.92), 250);
    return () => clearTimeout(tm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);
  // 개발용(웹): __palloSay('...') 로 말한 것처럼
  useEffect(() => {
    if (!__DEV__ || Platform.OS !== 'web') return;
    Reflect.set(globalThis, '__palloSay', (text: string) => {
      const r = matchSpeech(text, ws);
      const picks: number[] = [];
      for (let k = 0; k < r.count; k++) {
        const c = cardFor(k, picks);
        if (c != null) picks.push(c);
      }
      if (picks.length > usedRef.current.length) link(picks);
    });
    return () => void Reflect.deleteProperty(globalThis, '__palloSay');
  });
  const tap = (i: number) => {
    if (wordKey(ws[i]) !== wordKey(ws[usedRef.current.length])) {
      setShake((s) => ({ i, n: (s?.n ?? 0) + 1 }));
      setMiss((m) => m + 1);
      sfx('wrong');
      return;
    }
    sfx('card');
    link([...usedRef.current, i]);
  };
  const hint = miss >= 3 && !done ? cardFor(used.length, used) : undefined;
  return (
    <>
      <Body toEnd={done || undefined}>
        <PText style={styles.readKo} color={SUB}>
          {t.ko}
        </PText>
        <View style={styles.chain}>
          {used.map((i, k) => (
            <WordCard key={k} word={ws[i]} state="linked" />
          ))}
        </View>
        {!done ? <View style={styles.rule} /> : null}
        {!done ? (
          <View style={styles.pool}>
            {mix
              .filter((i) => !used.includes(i))
              .map((i) => (
                <WordCard key={i} word={ws[i]} state={hint === i ? 'hint' : 'pool'} shake={shake?.i === i ? shake.n : 0} onPress={() => tap(i)} />
              ))}
          </View>
        ) : (
          <ModelCard label={t.label} en={t.en} soundOff={rt.soundOff} source={rt.source} />
        )}
      </Body>
      <Foot>
        {done ? (
          <FootRow>
            <GoBtn label={rt.goLabel} onPress={rt.next} />
          </FootRow>
        ) : (
          <MicKey label="눌러서 말하기" live="다 말했어요" on={speech.listening} onPress={() => (speech.listening ? speech.stop() : void speech.start(ws))} />
        )}
      </Foot>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  card: { gap: 10 },
  exp: { gap: 6 },
  expK: { fontFamily: Font.display, fontSize: 10.5, lineHeight: 14 },
  expB: { fontFamily: Font.body900, fontSize: 19, lineHeight: 25.6, letterSpacing: -0.3 },
  expP: { fontFamily: Font.body700, fontSize: 14, lineHeight: 22.4 },
  exRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  exEn: { fontFamily: Font.body800, fontSize: 15, lineHeight: 21 },
  exKo: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18 },
  opts: { gap: 10 },
  opt: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, boxShadow: `0px 4px 0px ${Colors.ink}`, gap: 2, marginBottom: 4 },
  optOn: { backgroundColor: Colors.yellow },
  pressed: { transform: [{ translateY: 3 }], boxShadow: `0px 1px 0px ${Colors.ink}` },
  qn: { fontFamily: Font.display, fontSize: 10, lineHeight: 14 },
  qEn: { fontFamily: Font.body800, fontSize: 15, lineHeight: 21.75 },
  qKo: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 17.5 },
  res: { alignItems: 'center', gap: 8 },
  resImg: { width: 120, height: 104 },
  resB: { fontFamily: Font.display, fontSize: 30, lineHeight: 36 },
  bars: { paddingVertical: 14, paddingHorizontal: 16, gap: 10, borderWidth: 2, borderColor: Colors.ink, borderRadius: 22, backgroundColor: Colors.white, boxShadow: `4px 4px 0px ${Colors.ink}` },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barL: { width: 52, fontFamily: Font.body800, fontSize: 13, lineHeight: 18 },
  barI: { flex: 1, height: 12, borderRadius: 6, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, overflow: 'hidden' },
  barE: { height: '100%' },
  barB: { width: 22, textAlign: 'right', fontFamily: Font.display, fontSize: 15, lineHeight: 20 },
  onair: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17 },
  blind: { fontFamily: Font.body700, fontSize: 15, lineHeight: 25.5 },
  blur: { color: 'transparent', textShadowColor: 'rgba(30,26,43,0.55)', textShadowRadius: 8, textShadowOffset: { width: 0, height: 0 } },
  now: { backgroundColor: '#FFF1A8' },
  chat: { gap: 10 },
  meRow: { alignItems: 'flex-end' },
  meB: { maxWidth: '82%', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow },
  aiRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  av: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avT: { fontFamily: Font.body900, fontSize: 15, lineHeight: 20 },
  who: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16, marginBottom: 2 },
  aiB: { alignSelf: 'flex-start', maxWidth: '96%', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, gap: 2 },
  msgT: { fontFamily: Font.body700, fontSize: 14.5, lineHeight: 21 },
  team: { paddingVertical: 14, paddingHorizontal: 16, gap: 8, borderWidth: 2, borderColor: Colors.ink, borderRadius: 22, backgroundColor: Colors.white },
  teamK: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17 },
  teamRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  teamI: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow, alignItems: 'center', justifyContent: 'center' },
  teamT: { flex: 1, fontFamily: Font.body800, fontSize: 14, lineHeight: 20 },
  ta: { minHeight: 70, borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, backgroundColor: Colors.white, padding: 12, fontFamily: Font.body600, fontSize: 15, lineHeight: 22, color: Colors.ink, textAlignVertical: 'top' },
  readKo: { fontFamily: Font.body800, fontSize: 15, lineHeight: 22 },
  chain: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, minHeight: 46 },
  rule: { height: 2, backgroundColor: '#D9D1BF' },
  pool: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
});
