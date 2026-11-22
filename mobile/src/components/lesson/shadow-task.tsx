import { Image } from 'expo-image';
import * as Tts from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';

import { BookmarkIcon, CardsIcon, MicIcon, SpeakerIcon } from '@/components/lesson/icons';
import { Peek } from '@/components/lesson/peek';
import { WordCard } from '@/components/lesson/word-card';
import { Appear } from '@/components/ui/appear';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { BAD_REACTIONS, GOOD_REACTIONS, type ShadowTask as Task } from '@/data/lessons';
import { SPEECH_PROBLEM_TEXT, useSpeech } from '@/lib/speech';
import { matchSpeech, shuffled, wordKey } from '@/lib/words';

const PURPLE = Colors.purple;
const PINK = Colors.rosePink;
const GLOW_STEP = 170;
const WRONG_INK = '#C2416B'; // 틀린 카드와 같은 빨강 (프로토타입 오답 색) // 말한 카드가 하나씩 빛나는 간격 (ms)

type Mode = 'card' | 'voice';

/**
 * 따라 말하기 문제 (프로토타입 TKV.shadow).
 * 한국어 뜻을 보고, 섞인 단어 카드를 순서대로 이어 문장을 만들어요.
 * - 말하기: 말한 단어 카드가 차례로 빛나고 줄에 이어져요. 중간에 막히면 남은 카드부터 이어서 말해요.
 * - 단어 카드(말하기 어려울 때): 다음 단어 카드를 눌러 이어요. 3번 틀리면 정답 카드가 반짝여요.
 * - 소리 끄기: 듣기 버튼이 사라지고 정답을 읽어 주지 않아요.
 */
export function ShadowTask({ task, soundOff, onNext, nextLabel }: { task: Task; soundOff: boolean; onNext: () => void; nextLabel: string }) {
  const insets = useSafeAreaInsets();
  const words = task.en.split(/\s+/);
  const N = words.length;
  const focus = focusFlags(task.en, task.focus);

  const [mix] = useState(() => shuffled(N));
  const [used, setUsedState] = useState<number[]>([]);
  // 말하는 동안 결과가 빠르게 여러 번 와요. 화면 그리기를 기다리지 않게 지금 값을 ref 에도 둬요
  const usedRef = useRef<number[]>([]);
  const setUsed = (next: number[]) => {
    usedRef.current = next;
    setUsedState(next);
  };
  const [heard, setHeard] = useState('');
  /** 들린 말에서 틀리게 말한 낱말들의 순번 → 빨갛게 */
  const [wrongToks, setWrongToks] = useState<number[]>([]);
  // 틀린 횟수 (이 문제 전체) · 보라 팔로 빼꼼: 처음 틀릴 때와 3번째마다 (프로토타입과 같아요)
  const misses = useRef(0);
  const [peek, setPeek] = useState<{ n: number; line: [string, string] } | null>(null);
  const [footH, setFootH] = useState(0);
  const oops = () => {
    misses.current += 1;
    const m = misses.current;
    if (m === 1 || m % 3 === 0) setPeek((p) => ({ n: (p?.n ?? 0) + 1, line: BAD_REACTIONS[Math.floor(Math.random() * BAD_REACTIONS.length)] }));
  };
  const latest = useRef('');
  const [said, setSaid] = useState<number[]>([]);
  const [voiced, setVoiced] = useState(0);
  const [missHere, setMissHere] = useState(0);
  const [shake, setShake] = useState<{ i: number; n: number } | null>(null);
  const [tries, setTries] = useState(0);
  const [saved, setSaved] = useState(false);
  const [reaction] = useState(() => GOOD_REACTIONS[Math.floor(Math.random() * GOOD_REACTIONS.length)]);
  const linked = used.length;
  const done = linked >= N;
  const busy = useRef(false);
  const base = useRef(0);

  // 지난 채점 때 들린 낱말 수 — 새 말이 더 들렸을 때만 다시 채점해요 (같은 말로 두 번 혼내지 않게, 다시 말하면 한 번 더 셈)
  const judgedLen = useRef(0);
  const lastWrong = useRef(-1);
  // 말하다 멈추면 거기서 '한 번'이 끝나요. 다음 말은 지금 줄 끝부터 새로 맞춰요 (빠진 낱말만 다시 말해도 되게)
  const segStart = useRef(0);
  const pendingTo = useRef(0); // 빛나는 중인 카드까지 포함한 줄 끝
  const seg = (t: string) => t.trim().split(/\s+/).filter(Boolean).slice(segStart.current).join(' ');
  const nextSegment = (t: string) => {
    segStart.current = t.trim().split(/\s+/).filter(Boolean).length;
    base.current = Math.max(usedRef.current.length, pendingTo.current);
    judgedLen.current = 0;
  };
  const speech = useSpeech({
    onText: (text, alts = []) => linkFromSpeech(bestOf(text, alts)),
    // 듣기는 계속하되, 말하다 잠깐 멈추면 그때까지를 한 번으로 보고 채점해요
    onPause: (text) => {
      if (usedRef.current.length >= N) return;
      setTries((t) => Math.max(t, 1));
      judgeVoice(text);
      nextSegment(text);
    },
    onEnd: (text) => {
      if (usedRef.current.length >= N) return;
      setTries((t) => t + 1);
      judgeVoice(text);
    },
  });
  const [mode, setMode] = useState<Mode>(speech.available ? 'voice' : 'card');

  // 다 이으면 문장을 한 번 읽어 줘요 (소리 끄기면 안 읽어요)
  useEffect(() => {
    if (!done) return;
    speech.stop();
    if (soundOff) return;
    const t = setTimeout(() => Tts.speak(task.en, { language: 'en-US', rate: 0.92 }), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  useEffect(() => () => void Tts.stop(), []);

  /** 폰이 준 후보 중 카드를 가장 많이 잇는 것 (같으면 첫 번째) */
  const bestOf = (text: string, alts: string[]) => {
    const score = (t: string) => matchSpeech(seg(t), words.slice(base.current)).count;
    return alts.reduce((best, a) => (score(a) > score(best) ? a : best), text);
  };

  /** 같은 칸에서 말로 2번 넘게 틀리면, 다음엔 그 자리에서 한 말을 인정해요 (발음이 다르게 들려도 — latte → nothing) */
  // 틀린 횟수는 '칸'마다 세요 (다른 칸이 이어져도 지금 칸의 횟수는 그대로)
  const miss = useRef({ slot: -1, n: 0 });
  const addMiss = (slot: number) => {
    miss.current = miss.current.slot === slot ? { slot, n: miss.current.n + 1 } : { slot, n: 1 };
    setMissHere(miss.current.n);
  };
  const clearMissBefore = (linkedNow: number) => {
    if (miss.current.slot < linkedNow) {
      miss.current = { slot: -1, n: 0 };
      setMissHere(0);
    }
  };
  const forgiveAt = (linkedNow: number) => (miss.current.slot === linkedNow && miss.current.n >= 2 ? linkedNow - base.current : undefined);

  /** 다음 칸에 맞는 카드 하나 (같은 단어가 두 번 나와도 아무 카드나) */
  const cardFor = (k: number, taken: number[]) => mix.find((i) => !taken.includes(i) && wordKey(words[i]) === wordKey(words[k]));

  function linkFromSpeech(text: string) {
    latest.current = text;
    setHeard(text);
    if (busy.current) return; // 빛나는 중이면 끝난 뒤 최신 말로 다시 봐요
    const now = usedRef.current;
    const r = matchSpeech(seg(text), words.slice(base.current), { forgive: forgiveAt(now.length) });
    // 틀린 말 뒤에 말이 더 이어졌으면 바로 틀림 표시 (말이 끝날 때까지 기다리지 않아요)
    if (r.wrongAt != null && r.wrongAt < r.tokens.length - 1) judgeVoice(text);
    // 앞에서부터 순서대로 맞춘 데까지만 이어요 (틀린 곳 뒤는 맞는 낱말이어도 오답)
    const n = Math.max(base.current + r.count, now.length);
    if (n <= now.length) return;
    glowAndLink(n, text);
  }

  /** 지금 줄 끝부터 n 칸까지: 카드가 차례로 노랗게 빛난 뒤 줄로 이어져요 */
  function glowAndLink(n: number, text?: string) {
    const now = usedRef.current;
    const picks: number[] = [];
    for (let k = now.length; k < n; k++) {
      const i = cardFor(k, [...now, ...picks]);
      if (i != null) picks.push(i);
    }
    busy.current = true;
    pendingTo.current = n;
    picks.forEach((i, j) => setTimeout(() => setSaid((s) => [...s, i]), j * GLOW_STEP));
    setTimeout(
      () => {
        busy.current = false;
        setSaid([]);
        setUsed([...usedRef.current, ...picks.filter((i) => !usedRef.current.includes(i))]);
        if (text != null) setVoiced((v) => Math.max(v, n));
        clearMissBefore(usedRef.current.length);
        if (text != null && latest.current !== text) linkFromSpeech(latest.current);
      },
      picks.length * GLOW_STEP + 360,
    );
  }

  /**
   * 말이 끝났을 때 채점: 다 못 이었는데 다른 말을 했으면 틀린 거예요.
   * 그 말이 카드에 있으면 그 카드에 오답 표시. 같은 칸에서 3번 틀리면 정답 카드가 반짝여요.
   */
  function judgeVoice(text: string) {
    if (!text.trim()) return;
    const r = matchSpeech(seg(text), words.slice(base.current), { forgive: forgiveAt(usedRef.current.length) });
    if (base.current + r.count >= N) return;
    if (r.wrongAt == null || r.tokens.length <= judgedLen.current) return; // 말이 중간에서 끝났거나, 새로 한 말이 없어요
    judgedLen.current = r.tokens.length;
    // 틀리게 말한 낱말은 모두 빨갛게 (말이 이어지며 늘어날 수 있어요)
    const add = r.wrong.map((k) => segStart.current + k);
    setWrongToks((w) => [...new Set([...w, ...add])]);
    // 같은 '한 번' 안에서 틀린 곳이 그대로면 한 번만 셉니다
    const first = segStart.current + r.wrongAt;
    if (first === lastWrong.current) return;
    lastWrong.current = first;
    addMiss(base.current + r.count);
    oops();
    const key = wordKey(r.tokens[r.wrongAt]);
    const now = usedRef.current;
    const card = mix.find((i) => !now.includes(i) && wordKey(words[i]) === key);
    if (card != null) setShake((s) => ({ i: card, n: (s?.n ?? 0) + 1 }));
  }

  function tapCard(i: number) {
    if (wordKey(words[i]) !== wordKey(words[usedRef.current.length])) {
      setShake((s) => ({ i, n: (s?.n ?? 0) + 1 }));
      addMiss(usedRef.current.length);
      oops();
      return;
    }
    setUsed([...usedRef.current, i]);
    clearMissBefore(usedRef.current.length);
  }

  // 흔들린 카드의 빨간 테두리는 잠깐만
  useEffect(() => {
    if (!shake) return;
    const t = setTimeout(() => setShake(null), 900);
    return () => clearTimeout(t);
  }, [shake]);

  // 개발용(웹): 콘솔에서 __palloSay('I would like to have') 로 '이렇게 말하고 잠깐 멈췄다'를 흉내 내요. 출시 빌드엔 안 들어가요
  //   여러 번 부르면 말이 이어 붙어요 (한 번 누르고 계속 말하는 것과 같아요)
  const devText = useRef('');
  useEffect(() => {
    if (!__DEV__ || Platform.OS !== 'web') return;
    Reflect.set(globalThis, '__palloSay', (t: string) => {
      devText.current = `${devText.current} ${t}`.trim();
      const full = devText.current;
      setHeard(full);
      linkFromSpeech(full);
      setTries((x) => x + 1);
      judgeVoice(full);
      nextSegment(full);
    });
    return () => void Reflect.deleteProperty(globalThis, '__palloSay');
  });

  const hintCard = missHere >= 3 && !done ? cardFor(linked, used) : undefined;
  const pool = mix.filter((i) => !used.includes(i));
  const startVoice = () => {
    if (speech.listening) {
      speech.stop();
      return;
    }
    base.current = usedRef.current.length;
    latest.current = '';
    judgedLen.current = 0;
    segStart.current = 0;
    setHeard('');
    setWrongToks([]);
    Tts.stop(); // 읽어 주는 소리를 마이크가 듣지 않게
    speech.start(words.map((w) => w.replace(/[.,!?]/g, '')).concat(task.en));
  };

  return (
    <View style={styles.flex}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <PatternHead head={task.head} />
        <PText style={styles.ko}>{task.ko}</PText>

        <Chain words={words} used={used} focus={focus} done={done} />
        {!done && <View style={styles.rule} />}

        {!done && (
          <View style={styles.pool}>
            {pool.map((i) => (
              <Appear key={i} kind="popIn">
                <WordCard word={words[i]} state={said.includes(i) ? 'said' : hintCard === i ? 'hint' : 'pool'} shake={shake?.i === i ? shake.n : 0} onPress={() => tapCard(i)} />
              </Appear>
            ))}
          </View>
        )}

        {/* 들린 말: 말하기 모드에서만, 듣는 중이거나 방금 들린 게 있을 때 */}
        {!done && mode === 'voice' && (speech.listening || heard !== '') && (
          <PText style={styles.heard} color={Colors.inkSub} numberOfLines={2}>
            {heard ? '들린 말 · ' : '듣고 있어요 · 영어로 말해요'}
            {/* 틀리게 말한 낱말은 빨갛게 (오래 말하면 뒤쪽 12낱말만) */}
            {heard !== '' &&
              tailTokens(heard).map(({ t, i, cut }) => (
                <PText key={i} style={StyleSheet.flatten([styles.heard, wrongToks.includes(i) && styles.heardWrong])} color={wrongToks.includes(i) ? WRONG_INK : Colors.inkSub}>
                  {cut ? '… ' : i > 0 ? ' ' : ''}
                  {t}
                </PText>
              ))}
          </PText>
        )}

        {!done && tries > 0 && linked > 0 && (
          <PText style={styles.msg} color={PURPLE}>
            말로 {linked}개 이었어요 · {mode === 'voice' ? '이어서 말해요' : '남은 카드를 눌러요'}
          </PText>
        )}

        {done && (
          <Appear kind="tkRise" style={styles.sent}>
            <View style={styles.flex}>
              <PText style={styles.sentEn}>{task.en}</PText>
              <PText style={styles.sentKo}>{task.ko}</PText>
            </View>
            {!soundOff && (
              <Pressable
                onPress={() => Tts.speak(task.en, { language: 'en-US', rate: 0.92 })}
                accessibilityRole="button"
                accessibilityLabel="문장 듣기"
                style={StyleSheet.flatten([styles.round, styles.listen])}>
                <SpeakerIcon size={17} />
              </Pressable>
            )}
            <Pressable
              onPress={() => setSaved((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel="표현 저장"
              accessibilityState={{ selected: saved }}
              style={StyleSheet.flatten([styles.round, saved && styles.saved])}>
              <BookmarkIcon filled={saved} />
            </Pressable>
          </Appear>
        )}
      </ScrollView>

      {/* 아래 고정: 모드 탭 · 말하기 버튼 / 다 이으면 반응 · 다음 */}
      {!done && <Peek n={peek?.n ?? 0} line={peek?.line ?? null} bottom={footH + 12} />}
      <View style={StyleSheet.flatten([styles.foot, { paddingBottom: 16 + insets.bottom }])} onLayout={(e) => setFootH(e.nativeEvent.layout.height)}>
        {done ? (
          <>
            <View style={styles.react}>
              <Appear kind="reactHop">
                <Image source={require('@/assets/characters/c-upright-yellow.png')} style={styles.reactChar} contentFit="contain" />
              </Appear>
              <View style={styles.flex}>
                <Appear kind="reactWord" delay={100} style={styles.reactWordOrigin}>
                  <PText style={styles.reactTitle} color={PURPLE}>
                    {reaction[0]}
                  </PText>
                </Appear>
                <PText style={styles.reactSub} color={Colors.inkSub}>
                  {reaction[1]} · {voiced >= N ? '말로 문장을 다 이었어요' : voiced ? `말로 ${voiced}장 · 문장을 다 이었어요` : '문장을 다 이었어요'}
                </PText>
              </View>
            </View>
            <BigButton label={nextLabel} color={Colors.yellow} onPress={onNext} />
          </>
        ) : (
          <>
            {mode === 'voice' && speech.problem && (
              <PText style={styles.problem} color={Colors.inkSub}>
                {SPEECH_PROBLEM_TEXT[speech.problem]}
              </PText>
            )}
            {mode === 'card' && !speech.available && (
              <PText style={styles.problem} color={Colors.inkSub}>
                {SPEECH_PROBLEM_TEXT.unavailable}
              </PText>
            )}
            <ModeTabs
              mode={mode}
              onChange={(m) => {
                speech.stop();
                setMode(m);
              }}
            />
            {mode === 'voice' && <MicButton listening={speech.listening} label={tries ? '이어서 말하기' : '말해서 맞추기'} disabled={!speech.available} onPress={startVoice} />}
          </>
        )}
      </View>
    </View>
  );
}

/** 오래 말하면 들린 말이 길어져요 — 뒤쪽 12낱말만 */
const tailTokens = (t: string) => {
  const w = t.trim().split(/\s+/);
  const from = Math.max(0, w.length - 12);
  return w.slice(from).map((x, k) => ({ t: x, i: from + k, cut: k === 0 && from > 0 }));
};

/** 문장에서 패턴 부분에 걸친 단어들 (보라 밑줄) */
function focusFlags(en: string, re: RegExp) {
  const m = en.replace(/[’]/g, "'").match(re);
  const toks = [...en.matchAll(/\S+/g)];
  if (!m || m.index == null) return toks.map(() => false);
  const [a, b] = [m.index, m.index + m[0].length];
  return toks.map((t) => (t.index ?? 0) < b && (t.index ?? 0) + t[0].length > a);
}

/** 위 머리: 패턴(노란 형광) + 뜻, 아래 점선 */
function PatternHead({ head }: { head: Task['head'] }) {
  const rest = head.pattern.slice(head.short.length);
  return (
    <View accessibilityLabel={`${head.kicker}. ${head.pattern}, ${head.meaning}`}>
      <View style={styles.headRow}>
        <View>
          <View style={styles.marker} />
          <PText variant="title" style={styles.headText}>
            {head.short}
          </PText>
        </View>
        <PText variant="title" style={styles.headText}>
          {rest}
        </PText>
      </View>
      <PText style={styles.meaning} color={Colors.inkSub}>
        {head.meaning}.
      </PText>
      <Svg height={2} width="100%" style={styles.dash}>
        <Line x1={0} y1={1} x2="100%" y2={1} stroke="#D6CEBF" strokeWidth={2} strokeDasharray="6 5" />
      </Svg>
    </View>
  );
}

/** 이어진 카드 줄 + 다음 빈칸. 같은 줄에 붙은 카드 사이엔 잉크 연결선 */
function Chain({ words, used, focus, done }: { words: string[]; used: number[]; focus: boolean[]; done: boolean }) {
  const [rows, setRows] = useState<Record<number, number>>({});
  const onRow = (k: number) => (e: LayoutChangeEvent) => {
    const y = Math.round(e.nativeEvent.layout.y);
    setRows((r) => (r[k] === y ? r : { ...r, [k]: y }));
  };
  return (
    <View style={styles.chain}>
      {used.map((_, k) => (
        <Appear key={k} kind="linkUp" onLayout={onRow(k)} style={styles.chainItem}>
          {k > 0 && rows[k] != null && rows[k] === rows[k - 1] && <View style={styles.link} />}
          {/* 다 이으면 줄 전체가 파도처럼 (2번째마다 .05초 · 3번째마다 .1초 늦게) */}
          <WordCard word={words[k]} state="linked" focus={focus[k]} wave={done ? ((k + 1) % 3 === 0 ? 100 : (k + 1) % 2 === 0 ? 50 : 0) : undefined} />
        </Appear>
      ))}
      {!done && <View style={styles.slot} />}
    </View>
  );
}

function ModeTabs({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const tabs: [Mode, string][] = [
    ['card', '단어 카드'],
    ['voice', '말하기'],
  ];
  return (
    <View style={styles.tabs} accessibilityRole="tablist">
      {tabs.map(([m, label]) => {
        const on = m === mode;
        return (
          <Pressable key={m} onPress={() => onChange(m)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={StyleSheet.flatten([styles.tab, on && styles.tabOn])}>
            {m === 'card' ? <CardsIcon size={17} color={on ? Colors.ink : Colors.inkSub} /> : <MicIcon size={17} color={on ? Colors.ink : Colors.inkSub} />}
            <PText style={styles.tabText} color={on ? Colors.ink : Colors.inkSub}>
              {label}
            </PText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** 말하기 버튼: 보라 → 듣는 중엔 분홍 + 소리 막대 */
function MicButton({ listening, label, disabled, onPress }: { listening: boolean; label: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={listening ? '듣는 중, 누르면 멈춰요' : label} accessibilityState={{ disabled }}>
      {({ pressed }) => (
        <View style={StyleSheet.flatten([styles.big, { backgroundColor: disabled ? '#B9B2A3' : listening ? PINK : PURPLE }, (pressed || listening) && styles.bigDown])}>
          <MicIcon size={22} color={Colors.white} />
          <PText style={styles.bigText} color={Colors.white}>
            {listening ? '듣는 중' : label}
          </PText>
          {listening && <Wave />}
        </View>
      )}
    </Pressable>
  );
}

function Wave() {
  return (
    <View style={styles.wave}>
      {[0, 1, 2, 3, 4].map((k) => (
        <WaveBar key={k} delay={k * 120} />
      ))}
    </View>
  );
}

function WaveBar({ delay }: { delay: number }) {
  const h = useSharedValue(6);
  useEffect(() => {
    const t = setTimeout(() => h.set(withRepeat(withTiming(20, { duration: 350 }), -1, true)), delay);
    return () => clearTimeout(t);
  }, [h, delay]);
  const s = useAnimatedStyle(() => ({ height: h.get() }));
  return <Animated.View style={[styles.waveBar, s]} />;
}

function BigButton({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      {({ pressed }) => (
        <View style={StyleSheet.flatten([styles.big, styles.bigCenter, { backgroundColor: color }, pressed && styles.bigDown])}>
          <PText style={styles.bigText}>{label}</PText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  body: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 24 },
  headRow: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap' },
  marker: { position: 'absolute', left: -2, right: -2, bottom: 1, height: 11, backgroundColor: Colors.yellow },
  headText: { fontSize: 23, lineHeight: 30 },
  meaning: { marginTop: 2, fontFamily: Font.body800, fontSize: 13.5, lineHeight: 19 },
  dash: { marginTop: 14 },
  ko: { marginTop: 14, fontFamily: Font.body900, fontSize: 19, lineHeight: 27 },
  chain: { marginTop: 24, flexDirection: 'row', flexWrap: 'wrap', gap: 10, minHeight: 47 },
  chainItem: { flexDirection: 'row', alignItems: 'center' },
  link: { position: 'absolute', left: -12, width: 14, height: 3, marginTop: 1.5, backgroundColor: Colors.ink },
  slot: { width: 50, height: 44, marginTop: 3, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: '#B9B2A3' },
  rule: { marginTop: 12, height: 2.5, backgroundColor: Colors.ink, borderRadius: 2 },
  pool: { marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  heardWrong: { fontFamily: Font.body900 },
  heard: { marginTop: 14, textAlign: 'center', fontFamily: Font.body700, fontSize: 13, lineHeight: 19 },
  msg: { marginTop: 16, textAlign: 'center', fontFamily: Font.display, fontSize: 12, lineHeight: 16 },
  sent: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 12,
    borderWidth: 2,
    borderColor: Colors.ink,
    borderRadius: 16,
    backgroundColor: Colors.white,
  },
  sentEn: { fontFamily: Font.display, fontSize: 14.5, lineHeight: 20, letterSpacing: -0.2 },
  sentKo: { marginTop: 3, fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  round: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, borderBottomWidth: 4, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  listen: { backgroundColor: '#BFE4EC' },
  saved: { backgroundColor: Colors.yellow },
  foot: { paddingHorizontal: 20, paddingTop: 10, gap: 12, backgroundColor: Colors.cream },
  problem: { textAlign: 'center', fontFamily: Font.body800, fontSize: 12.5, lineHeight: 17 },
  tabs: { flexDirection: 'row', gap: 6, padding: 4, borderRadius: 16, backgroundColor: '#EFE9DC' },
  tab: { flex: 1, height: 40, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  tabOn: { backgroundColor: Colors.white, borderBottomWidth: 2, borderColor: '#D8CFBE' },
  tabText: { fontFamily: Font.body900, fontSize: 13.5, lineHeight: 18 },
  big: {
    height: 56,
    borderRadius: 28,
    borderWidth: 2.5,
    borderColor: Colors.ink,
    borderBottomWidth: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 18,
  },
  bigCenter: { justifyContent: 'center' },
  bigDown: { borderBottomWidth: 2.5, marginTop: 3.5 },
  bigText: { fontFamily: Font.body900, fontSize: 17, lineHeight: 22 },
  wave: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 22 },
  waveBar: { width: 3, borderRadius: 2, backgroundColor: Colors.white },
  react: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  reactWordOrigin: { alignSelf: 'flex-start' },
  reactChar: { width: 92, height: 70, marginBottom: -4 },
  reactTitle: { fontFamily: Font.display, fontSize: 25, lineHeight: 30, letterSpacing: -0.4 },
  reactSub: { marginTop: 2, fontFamily: Font.body700, fontSize: 13, lineHeight: 19 },
});
