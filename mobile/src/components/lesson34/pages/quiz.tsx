import { Image } from 'expo-image';
import * as Tts from 'expo-speech';
import { useEffect, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { css, cubicBezier, useReducedMotion } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { GrowInput } from '@/components/ui/grow-input';
import { MicIcon } from '@/components/lesson/icons';
import { Appear } from '@/components/ui/appear';
import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { BAD_REACTIONS, GOOD_REACTIONS } from '@/data/lessons';
import type { SpeakItem } from '@/data/lessons34';
import { KeyboardScrollView } from '@/components/ui/form-scroll';
import { haptic, sfx } from '@/lib/feedback';
import { useSpeech } from '@/lib/speech';
import { useLearnPrefs } from '@/state/learn-prefs';

import type { StepCtx } from '../finish';
import { gradeWords, pickOne, shuffle } from '../text';
import { PopStars, useCountUp } from '../blocks/match-result-fx';
import { CardHead, Check, EndMsg, EndNote, FootRow, GoBtn, IMG, MarkBtn, ModeTabs, PINK_INK, Spk, SUB, XMark } from '../ui';
import { PCard, PFoot } from './common';
import type { PageApi } from './study-shell';

type Mode = 'card' | 'voice' | 'write';
type Res = { g: ReturnType<typeof gradeWords>; ans: string; rx: [string, string] };
/** 문제 하나의 기록 (결과 화면 목록) — first: 힌트 없이 한 번에 · ok: 결국 맞힘 */
type Rec = { k: number; first: boolean; hint: boolean; ok: boolean };
const N_Q = 8;

/**
 * 복습 스피킹 퀴즈 (프로토타입 STEP_VIEW.speak · Lv.3 은 키워드 예문 + 지문 표현 문장 8개).
 * 한국어 보고 영어로 — 단어 카드(말하기가 어려워요 기본) · 말하기 · 직접 쓰기. 단어별 채점, 빠진 단어는 분홍 칸.
 * 힌트: 카드 · 말하기 2단계, 쓰기 3단계 (패턴 → 시작 부분 → 단어 조각). 힌트를 쓰면 맞혀도 정답 수에 안 들어가요.
 */
export function SpeakQuiz({ ctx, items, api }: { ctx: StepCtx; items: SpeakItem[]; api: PageApi }) {
  const { noSpeak } = useLearnPrefs();
  const [order] = useState(() => shuffle(items.map((_, i) => i)).slice(0, N_Q));
  // 단어 카드: 문제마다 정답 단어 + 다른 문장의 헷갈리는 단어 3개
  const [banks] = useState(() => order.map((k) => makeBank(items[k].en, items)));
  // 쓰기 힌트 ③ 단어 조각 (문제마다 한 번만 섞어요)
  const [pieces] = useState(() => order.map((k) => shuffle(items[k].en.split(/\s+/))));
  const [log, setLog] = useState<Rec[]>([]);
  const [i, setI] = useState(0);
  const [right, setRight] = useState(0);
  const [mode, setMode] = useState<Mode>(noSpeak ? 'card' : 'voice');
  const [hint, setHint] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [tries, setTries] = useState(0);
  const [res, setRes] = useState<Res | null>(null);
  const [draft, setDraft] = useState('');
  const [line, setLine] = useState<number[]>([]);
  const speech = useSpeech({ onText: (text) => setDraft(text), onEnd: (text) => text.trim() && check(text.trim()) });
  useEffect(() => () => void Tts.stop(), []);

  const it = items[order[Math.min(i, order.length - 1)]];
  const ws = it.en.split(/\s+/);
  const again = !!(res && !res.g.perfect && tries < 2);
  const shown = res && !again;
  const hMax = mode === 'write' ? 3 : 2;
  const bank = banks[Math.min(i, order.length - 1)];
  const text = mode === 'card' ? line.map((k) => bank[k]).join(' ') : draft;

  function check(ans: string) {
    if (!ans) {
      showToast(mode === 'card' ? '단어 카드를 눌러 문장을 만들어요' : mode === 'voice' ? '마이크를 누르고 말해 보세요' : '영어로 답을 적어 주세요');
      return;
    }
    speech.stop();
    const g = gradeWords(ans, it.en);
    const good = g.perfect;
    if (!tries && good && !hintUsed) setRight((r) => r + 1);
    setRes({ g, ans, rx: pickOne(good ? GOOD_REACTIONS : BAD_REACTIONS) });
    const n = tries + 1;
    setTries(n);
    if (good || n >= 2) setLog((l) => [...l.slice(0, i), { k: order[i], first: !tries && good && !hintUsed, hint: hintUsed, ok: good }]);
    if (!good) {
      setDraft('');
      setLine([]);
    }
    sfx(good ? 'correct' : 'wrong');
    haptic(good ? 'success' : 'error');
    if (good) Tts.speak(it.en, { language: 'en-US', rate: 0.92 });
    else if (n >= 2 && !api.soundOff) setTimeout(() => Tts.speak(it.en, { language: 'en-US', rate: 0.92 }), 900);
  }
  const next = () => {
    Tts.stop();
    setI(i + 1);
    setRes(null);
    setTries(0);
    setHint(0);
    setHintUsed(false);
    setDraft('');
    setLine([]);
  };

  if (i >= order.length) return <QuizResult items={items} log={log} right={right} api={api} source={ctx.source} />;

  const hintBtn = (
    <Pressable
      onPress={() => {
        setHintUsed(true);
        setHint(Math.min(hMax, hint + 1));
        sfx('tap');
      }}
      disabled={hint >= hMax}
      accessibilityRole="button"
      accessibilityLabel={`힌트 ${hint}/${hMax}`}
      accessibilityState={{ selected: hint > 0, disabled: hint >= hMax }}
      hitSlop={6}
      style={({ pressed }) => [st.hp, hint > 0 && st.hpOn, hint >= hMax && st.hpOff, pressed && st.hpDown]}>
      <BulbIc />
      <PText style={st.hpT}>{hint ? `힌트 ${hint}/${hMax}` : '힌트'}</PText>
    </Pressable>
  );

  return (
    <>
      <KeyboardScrollView style={st.flex} contentContainerStyle={st.body} showsVerticalScrollIndicator={false} room={36}>
        <View style={st.top}>
          <View style={st.bar}>
            <View style={StyleSheet.flatten([st.fill, { width: `${((i + (res ? 1 : 0)) / order.length) * 100}%` }])} />
          </View>
          <PText style={st.count}>{`${i + 1}/${order.length}`}</PText>
        </View>
        <PCard style={st.qc}>
          <CardHead label="한국어를 보고 영어로 말해요">{shown ? null : hintBtn}</CardHead>
          <PText style={st.prompt}>{it.ko}</PText>
          <View style={st.slots}>
            {ws.map((w, k) => {
              const ok = res?.g.ok[k];
              const open = shown || (again && ok);
              return open ? (
                <PText key={k} style={StyleSheet.flatten([st.slotW, !ok && st.slotMiss])} color={ok ? '#1D6B3B' : PINK_INK}>
                  {w}
                </PText>
              ) : (
                <View key={k} style={StyleSheet.flatten([st.slot, again && !ok && st.slotPink, { width: Math.max(26, Math.min(90, w.length * 9)) }])} />
              );
            })}
          </View>
          {hint > 0 && !shown ? (
            <View style={st.hint}>
              <PText style={st.hintT}>
                {'① 힌트 · '}
                <PText style={st.hintB}>{it.hint}</PText>
              </PText>
              {hint >= 2 ? (
                <PText style={st.hintT}>
                  {'② 시작 · '}
                  <PText style={st.hintB}>{`${ws.slice(0, Math.max(1, Math.ceil(ws.length / 3))).join(' ')} …`}</PText>
                </PText>
              ) : null}
              {hint >= 3 && mode === 'write' ? (
                <>
                  <PText style={st.hintT}>③ 단어 조각 · 눌러서 입력</PText>
                  <View style={st.chips}>
                    {pieces[Math.min(i, order.length - 1)].map((w, k) => (
                      <Pressable key={k} onPress={() => setDraft((d) => `${d.trim() ? `${d.trim()} ` : ''}${w}`)} accessibilityRole="button" style={st.chip}>
                        <PText style={st.chipT}>{w}</PText>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : null}
            </View>
          ) : null}
        </PCard>
        {shown && res ? (
          <>
            {!res.g.perfect ? (
              <PText style={st.mine} color={SUB}>
                {'내 답 · '}
                <PText style={StyleSheet.flatten([st.mine, st.bold])}>{res.ans}</PText>
              </PText>
            ) : null}
            <View style={st.sent}>
              <View style={st.flex}>
                <PText style={st.sentB}>{it.en}</PText>
                <PText style={st.sentS} color={SUB}>
                  {it.ko}
                </PText>
              </View>
              <Spk text={it.en} soundOff={api.soundOff} />
              <MarkBtn en={it.en} ko={it.ko} source={ctx.source} />
            </View>
          </>
        ) : (
          <>
            {mode === 'card' ? (
              <>
                <View style={st.wline}>
                  {line.map((k, j) => (
                    <Pressable key={`${k}-${j}`} onPress={() => setLine(line.filter((x) => x !== k))} accessibilityRole="button" style={StyleSheet.flatten([st.wc, st.wcIn])}>
                      <PText style={st.wcT}>{bank[k]}</PText>
                    </Pressable>
                  ))}
                </View>
                <View style={st.pool}>
                  {bank.map((w, k) =>
                    line.includes(k) ? null : (
                      <Pressable
                        key={k}
                        onPress={() => {
                          sfx('card');
                          setLine([...line, k]);
                        }}
                        accessibilityRole="button"
                        style={st.wc}>
                        <PText style={st.wcT}>{w}</PText>
                      </Pressable>
                    ),
                  )}
                </View>
              </>
            ) : mode === 'voice' ? (
              <>
                <PText style={st.said} color={draft ? Colors.ink : SUB}>
                  {draft || (speech.listening ? '듣고 있어요…' : '')}
                </PText>
                <Pressable onPress={() => (speech.listening ? speech.stop() : void speech.start(ws))} accessibilityRole="button" accessibilityLabel="말하기" style={StyleSheet.flatten([st.big, speech.listening && st.bigOn])}>
                  <MicIcon size={30} color={Colors.white} />
                </Pressable>
              </>
            ) : (
              <GrowInput value={draft} onChangeText={setDraft} multiline placeholder="영어로 적거나 마이크로 말해 보세요" placeholderTextColor="#B9B2A3" style={st.ta} accessibilityLabel="영어로 쓰기" />
            )}
          </>
        )}
      </KeyboardScrollView>
      <PFoot>
        {shown && res ? (
          <>
            <EndNote good={res.g.perfect}>
              <EndMsg rest={`${res.rx[0]} ${res.rx[1]}`} good={res.g.perfect} />
            </EndNote>
            <FootRow>
              <GoBtn label={i < order.length - 1 ? '다음 문제' : '결과 보기'} onPress={next} />
            </FootRow>
          </>
        ) : (
          <>
            {again ? (
              <EndNote good={false}>
                <EndMsg rest="Not quite! 분홍 칸만 다시 해 봐요 · 마지막 기회예요" />
              </EndNote>
            ) : null}
            <ModeTabs<Mode>
              list={[
                ['card', '단어 카드'],
                ['voice', '말하기'],
                ['write', '쓰기'],
              ]}
              cur={mode}
              onPick={(k) => {
                speech.stop();
                setMode(k);
                setDraft('');
                setLine([]);
                setHint(Math.min(hint, k === 'write' ? 3 : 2));
              }}
            />
            <FootRow>
              <GoBtn label="확인" onPress={() => check(text.trim())} />
            </FootRow>
          </>
        )}
      </PFoot>
    </>
  );
}

/** 결과 화면: 팔로 · 한 번에 맞힌 수 · 별 · 숫자 칸 3개 · 문장 목록 (다시 듣기 · 저장) */
function QuizResult({ items, log, right, api, source }: { items: SpeakItem[]; log: Rec[]; right: number; api: PageApi; source: string }) {
  const total = log.length;
  const nHint = log.filter((r) => r.hint).length;
  const nMiss = log.filter((r) => !r.ok).length;
  const rate = total ? right / total : 0;
  const stars = rate >= 0.85 ? 3 : rate >= 0.5 ? 2 : right > 0 ? 1 : 0;
  const msg = right === total ? '완벽해요! 힌트 없이 다 맞혔어요' : stars >= 2 ? '좋아요! 놓친 문장만 다시 들어 봐요' : '괜찮아요! 문장을 듣고 따라 말해 봐요';
  const still = useReducedMotion();
  const count = useCountUp(right, 300, 700);
  return (
    <>
      <ScrollView style={st.flex} contentContainerStyle={st.body} showsVerticalScrollIndicator={false}>
        <View style={st.res}>
          {/* 톡 튀어나온 뒤 숨쉬듯 통통 · 가끔 한 번 크게 뛰어요 */}
          <Appear kind="reactHop">
            <Animated.View style={[st.resChar, !still && (stars >= 2 ? idleHappy : idleSad)]}>
              <Image source={stars >= 2 ? IMG.yellow : IMG.tilted} style={st.resImg} contentFit="contain" />
            </Animated.View>
          </Appear>
          <PText style={st.resN} accessibilityLabel={`${total}문장 중 ${right}문장`}>
            {count}
            <PText style={st.resOf} color={SUB}>{` / ${total}`}</PText>
          </PText>
          <PText style={st.resL} color={SUB}>
            한 번에 맞힌 문장
          </PText>
          <PopStars n={stars} delay={450} />
          <View style={st.rs}>
            <ResTile tone={st.t1} icon={<Check size={16} />} value={right} label="한 번에 맞힘" delay={900} />
            <ResTile tone={st.t2} icon={<BulbIc />} value={nHint} label="힌트 쓴 문장" delay={1020} />
            <ResTile tone={st.t3} icon={<XMark size={16} color={PINK_INK} />} value={nMiss} label="놓친 문장" delay={1140} />
          </View>
        </View>
        <Appear kind="tkRise" delay={1250}>
          <PCard style={st.list}>
            {log.map((r, j) => {
              const it = items[r.k];
              return (
                <Appear key={j} kind="rise" delay={1330 + j * 70} style={StyleSheet.flatten([st.row, j > 0 && st.rowLine])}>
                  <View
                    style={StyleSheet.flatten([st.mk, r.first ? st.mkFirst : !r.ok ? st.mkMiss : st.mkHint])}
                    accessibilityLabel={r.first ? '한 번에 맞힘' : !r.ok ? '놓침' : r.hint ? '힌트 씀' : '두 번째에 맞힘'}>
                    {r.first ? <Check size={12} /> : !r.ok ? <XMark size={11} color={PINK_INK} /> : r.hint ? <BulbIc size={14} /> : <PText style={st.hpT}>2</PText>}
                  </View>
                  <View style={st.flex}>
                    <PText style={st.rowEn}>{it.en}</PText>
                    <PText style={st.rowKo} color={SUB}>
                      {it.ko}
                    </PText>
                  </View>
                  <Spk text={it.en} soundOff={api.soundOff} />
                  <MarkBtn en={it.en} ko={it.ko} source={source} />
                </Appear>
              );
            })}
          </PCard>
        </Appear>
      </ScrollView>
      <PFoot>
        <EndNote good={stars >= 2}>
          <EndMsg rest={msg} good={stars >= 2} />
        </EndNote>
        <FootRow>
          <GoBtn label="완료하기" onPress={() => api.finish({ right, total })} />
        </FootRow>
      </PFoot>
    </>
  );
}

/** 결과 숫자 칸 (짝 맞추기 결과 .tk-rs 와 같은 모양) · 아래에서 솟아오르고 숫자는 0부터 올라가요 */
function ResTile({ tone, icon, value, label, delay }: { tone: object; icon: ReactNode; value: number; label: string; delay: number }) {
  const n = useCountUp(value, delay + 200, 650);
  return (
    <Appear kind="tkRise" delay={delay} style={st.rtWrap}>
      <View style={StyleSheet.flatten([st.rt, tone])}>
        <View style={st.ic}>{icon}</View>
        <PText style={st.rtB}>{n}</PText>
        <PText style={st.rtS} color={SUB}>
          {label}
        </PText>
      </View>
    </Appear>
  );
}

/* 결과 캐릭터 제자리 움직임: 숨쉬듯 두 번 통통 → 웅크렸다 크게 한 번 뛰고 착지 (바닥 기준) */
const HOP = cubicBezier(0.3, 1.5, 0.5, 1);
const bobHop = css.keyframes({
  '0%, 30%, 60%': { transform: [{ translateY: 0 }, { scaleX: 1 }, { scaleY: 1 }], animationTimingFunction: 'ease-in-out' },
  '15%, 45%': { transform: [{ translateY: -3 }, { scaleX: 0.98 }, { scaleY: 1.03 }], animationTimingFunction: 'ease-in-out' },
  '72%': { transform: [{ translateY: 2 }, { scaleX: 1.12 }, { scaleY: 0.88 }], animationTimingFunction: cubicBezier(0.2, 0.8, 0.3, 1) },
  '82%': { transform: [{ translateY: -16 }, { scaleX: 0.92 }, { scaleY: 1.1 }], animationTimingFunction: cubicBezier(0.6, 0, 0.9, 0.5) },
  '91%': { transform: [{ translateY: 1 }, { scaleX: 1.14 }, { scaleY: 0.86 }], animationTimingFunction: HOP },
  '100%': { transform: [{ translateY: 0 }, { scaleX: 1 }, { scaleY: 1 }] },
});
/** 기운 캐릭터는 느릿느릿 · 작게만 */
const bobSlow = css.keyframes({
  '0%, 100%': { transform: [{ translateY: 0 }, { scaleX: 1 }, { scaleY: 1 }] },
  '50%': { transform: [{ translateY: -2 }, { scaleX: 1.03 }, { scaleY: 0.97 }] },
});
const idle = (name: typeof bobHop, ms: number) => ({
  animationName: name,
  animationDuration: `${ms}ms`,
  animationDelay: '900ms',
  animationIterationCount: 'infinite' as const,
  animationTimingFunction: 'linear' as const,
});
const idleHappy = idle(bobHop, 4200);
const idleSad = idle(bobSlow, 2800);

const BulbIc = ({ size = 16 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={Colors.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z" />
  </Svg>
);

/** 단어 카드 한 벌 (정답 단어 + 헷갈리는 단어 3개 · 프로토타입 makeWB) */
function makeBank(en: string, items: SpeakItem[]) {
  const ws = en.split(/\s+/);
  const others = shuffle(items.flatMap((x) => x.en.split(/\s+/)).filter((w) => !ws.includes(w))).slice(0, 3);
  return shuffle([...ws, ...others]);
}

const st = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  bold: { fontFamily: Font.body900 },
  body: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 20, gap: 12 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bar: { flex: 1, height: 16, borderRadius: 8, borderWidth: 2, borderColor: Colors.ink, backgroundColor: '#F1EBDC', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: Colors.yellow },
  count: { fontFamily: Font.display, fontSize: 13, lineHeight: 17 },
  qc: { paddingTop: 12, paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  prompt: { fontFamily: Font.body900, fontSize: 20, lineHeight: 28 },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  slot: { height: 26, borderRadius: 7, borderWidth: 2, borderStyle: 'dashed', borderColor: '#C9C1AF' },
  slotPink: { borderColor: PINK_INK, backgroundColor: '#FBE1E8' },
  slotW: { fontFamily: Font.body800, fontSize: 16, lineHeight: 26 },
  slotMiss: { backgroundColor: '#FBE1E8', borderRadius: 6, paddingHorizontal: 4 },
  mine: { fontFamily: Font.body700, fontSize: 13.5, lineHeight: 20 },
  sent: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, backgroundColor: Colors.white, boxShadow: `3px 3px 0px ${Colors.ink}` },
  sentB: { fontFamily: Font.body900, fontSize: 16, lineHeight: 23 },
  sentS: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18 },
  hint: { padding: 12, borderRadius: 14, backgroundColor: '#FFF6BF', gap: 3 },
  hintT: { fontFamily: Font.body700, fontSize: 13, lineHeight: 19 },
  hintB: { fontFamily: Font.body900, fontSize: 13, lineHeight: 19 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 12, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  chipT: { fontFamily: Font.body800, fontSize: 13, lineHeight: 18 },
  wline: { minHeight: 52, flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingBottom: 10, borderBottomWidth: 2, borderStyle: 'dashed', borderColor: '#D9D1BF' },
  pool: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  wc: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, boxShadow: `0px 3px 0px ${Colors.ink}` },
  wcIn: { backgroundColor: '#E6DEFA' },
  wcT: { fontFamily: Font.body800, fontSize: 15, lineHeight: 20 },
  said: { minHeight: 44, fontFamily: Font.body700, fontSize: 16, lineHeight: 23, textAlign: 'center' },
  big: { alignSelf: 'center', width: 88, height: 88, borderRadius: 44, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.purple, alignItems: 'center', justifyContent: 'center', boxShadow: `0px 4px 0px ${Colors.ink}` },
  bigOn: { backgroundColor: Colors.rosePink },
  ta: { minHeight: 70, borderWidth: 2, borderColor: Colors.ink, borderRadius: 16, backgroundColor: Colors.cream, padding: 12, fontFamily: Font.body500, fontSize: 15, lineHeight: 22.5, color: Colors.ink, textAlignVertical: 'top' },
  hp: { height: 32, paddingLeft: 8, paddingRight: 12, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, flexDirection: 'row', alignItems: 'center', gap: 4, boxShadow: `0px 3px 0px ${Colors.ink}` },
  hpOn: { backgroundColor: Colors.yellow },
  hpOff: { opacity: 0.55 },
  hpDown: { transform: [{ translateY: 2 }], boxShadow: `0px 1px 0px ${Colors.ink}` },
  hpT: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 17 },
  // 결과 화면
  res: { alignItems: 'center', gap: 8, paddingTop: 18 },
  resChar: { transformOrigin: 'center bottom' },
  resImg: { width: 130, height: 112 },
  resN: { fontFamily: Font.display, fontSize: 44, lineHeight: 50, letterSpacing: -1, fontVariant: ['tabular-nums'] },
  resOf: { fontFamily: Font.display, fontSize: 22, lineHeight: 50 },
  resL: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 18, marginTop: -4 },
  rs: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 10 },
  rtWrap: { flex: 1 },
  rt: { alignItems: 'center', gap: 4, paddingTop: 14, paddingBottom: 12, paddingHorizontal: 6, borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, boxShadow: `3px 3px 0px ${Colors.ink}` },
  t1: { backgroundColor: Colors.yellow, transform: [{ rotate: '-2deg' }] },
  t2: { backgroundColor: Colors.skyMist },
  t3: { backgroundColor: '#FBE1E8' },
  ic: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  rtB: { fontFamily: Font.display, fontSize: 19, lineHeight: 23, fontVariant: ['tabular-nums'] },
  rtS: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16 },
  list: { paddingVertical: 6, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  rowLine: { borderTopWidth: 2, borderStyle: 'dashed', borderColor: '#E6DFCF' },
  mk: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  mkFirst: { backgroundColor: Colors.yellow },
  mkHint: { backgroundColor: Colors.skyMist },
  mkMiss: { backgroundColor: '#FBE1E8' },
  rowEn: { fontFamily: Font.body900, fontSize: 14.5, lineHeight: 20 },
  rowKo: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17 },
});
