import { Image } from 'expo-image';
import * as Tts from 'expo-speech';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Pressable } from '@/components/ui/pressable';
import { FeedbackBand } from '@/components/lesson/feedback-band';
import { MicIcon } from '@/components/lesson/icons';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { BAD_REACTIONS, GOOD_REACTIONS } from '@/data/lessons';
import type { SpeakItem } from '@/data/lessons34';
import { haptic, sfx } from '@/lib/feedback';
import { useSpeech } from '@/lib/speech';
import { useLearnPrefs } from '@/state/learn-prefs';

import type { StepCtx } from '../finish';
import { gradeWords, pickOne, shuffle } from '../text';
import { GoBtn, IMG, MarkBtn, ModeTabs, PINK_INK, Spk, SUB } from '../ui';
import { PCard, PFoot } from './common';
import type { PageApi } from './study-shell';

type Mode = 'card' | 'voice' | 'write';
type Res = { g: ReturnType<typeof gradeWords>; ans: string; rx: [string, string] };
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

  if (i >= order.length)
    return (
      <>
        <ScrollView style={st.flex} contentContainerStyle={st.body}>
          <PCard style={st.score}>
            <Image source={IMG.yellow} style={st.scoreImg} contentFit="contain" />
            <PText style={st.kick2} color={SUB}>
              힌트 없이 한 번에 맞힌 문장
            </PText>
            <PText style={st.scoreB}>
              {right}
              <PText style={st.scoreOf} color={SUB}>{` / ${order.length}`}</PText>
            </PText>
          </PCard>
        </ScrollView>
        <PFoot>
          <GoBtn label="완료하기" onPress={() => api.finish({ right, total: order.length })} />
        </PFoot>
      </>
    );

  return (
    <>
      <ScrollView style={st.flex} contentContainerStyle={st.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={st.top}>
          <View style={st.bar}>
            <View style={StyleSheet.flatten([st.fill, { width: `${((i + (res ? 1 : 0)) / order.length) * 100}%` }])} />
          </View>
          <PText style={st.count}>{`${i + 1}/${order.length}`}</PText>
        </View>
        <PText style={st.kick2} color={SUB}>
          한국어를 보고 영어로 말해요
        </PText>
        <PCard style={st.qc}>
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
            {hint ? (
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
                      {shuffle(ws).map((w, k) => (
                        <Pressable key={k} onPress={() => setDraft((d) => `${d.trim() ? `${d.trim()} ` : ''}${w}`)} accessibilityRole="button" style={st.chip}>
                          <PText style={st.chipT}>{w}</PText>
                        </Pressable>
                      ))}
                    </View>
                  </>
                ) : null}
              </View>
            ) : null}
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
              <TextInput value={draft} onChangeText={setDraft} multiline placeholder="영어로 적거나 마이크로 말해 보세요" placeholderTextColor="#B9B2A3" style={st.ta} accessibilityLabel="영어로 쓰기" />
            )}
          </>
        )}
      </ScrollView>
      <PFoot>
        {shown && res ? (
          <>
            <FeedbackBand kind={res.g.perfect ? 'good' : 'bad'} en={res.rx[0]} ko={res.rx[1]} soundOff={api.soundOff} />
            <GoBtn label={i < order.length - 1 ? '다음 문제' : '결과 보기'} onPress={next} />
          </>
        ) : (
          <>
            {again ? <FeedbackBand kind="retry" en="Not quite!" ko="분홍 칸만 다시 해 봐요 · 마지막 기회예요!" soundOff={api.soundOff} /> : null}
            <View style={st.hrow}>
              <Pressable
                onPress={() => {
                  setHintUsed(true);
                  setHint(Math.min(hMax, hint + 1));
                  sfx('tap');
                }}
                disabled={hint >= hMax}
                accessibilityRole="button"
                accessibilityLabel={`힌트 ${hint}/${hMax}`}
                style={StyleSheet.flatten([st.bulb, hint > 0 && st.bulbOn, hint >= hMax && st.bulbOff])}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={Colors.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z" />
                </Svg>
                {hint ? <PText style={st.bulbN}>{hint}</PText> : null}
              </Pressable>
            </View>
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
            <GoBtn label="확인" onPress={() => check(text.trim())} />
          </>
        )}
      </PFoot>
    </>
  );
}

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
  kick2: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17 },
  qc: { padding: 16, gap: 12 },
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
  hrow: { flexDirection: 'row', justifyContent: 'flex-end' },
  bulb: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  bulbOn: { backgroundColor: Colors.yellow },
  bulbOff: { opacity: 0.5 },
  bulbN: { position: 'absolute', right: -4, top: -4, fontFamily: Font.display, fontSize: 10, lineHeight: 14 },
  score: { alignItems: 'center', gap: 6, padding: 20 },
  scoreImg: { width: 120, height: 104 },
  scoreB: { fontFamily: Font.display, fontSize: 36, lineHeight: 42 },
  scoreOf: { fontFamily: Font.display, fontSize: 16, lineHeight: 22 },
});
