import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Pressable } from '@/components/ui/pressable';
import { FadeUp, GhostButton, TaskMsg, YellowButton } from '@/components/lesson/lesson-ui';
import { ClockIcon, XIcon } from '@/components/lesson/icons';
import { TaskLayout, useTask } from '@/components/lesson/task-layout';
import { showToast } from '@/components/ui/toast';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import type { MatchTask as Task } from '@/data/lessons';
import { haptic, sfx } from '@/lib/feedback';
import { shuffled } from '@/lib/words';
import { getBest, setBest } from '@/state/progress';

/**
 * 짝 맞추기 타임어택 (프로토타입 TKV.match): 표현 ↔ 뜻, 30초 · 연속으로 맞히면 콤보 · 최고 기록.
 * 맞은 짝은 노랑으로 내려앉고, 틀린 짝은 분홍 점선. 결과: n / 전체 · 별 · 걸린 시간 · 최고 콤보 · 틀린 짝.
 */
export function MatchTask({ task, recordKey }: { task: Task; recordKey: string }) {
  const { mark, next, again, isLast } = useTask();
  const P = task.pairs;
  const N = P.length;
  const time = task.time || 30;
  const [Lo] = useState(() => shuffled(N));
  const [Ro] = useState(() => shuffled(N));
  const [done, setDone] = useState<Record<number, true>>({});
  const [sel, setSel] = useState<number | null>(null);
  const [bad, setBad] = useState<{ l: number; r: number } | null>(null);
  const [left, setLeft] = useState(time);
  const [end, setEnd] = useState<null | { sec: number; nDone: number; best: number; miss: number }>(null);
  const combo = useRef(0);
  const [comboN, setComboN] = useState(0);
  const best = useRef(0);
  const miss = useRef(0);
  const t0 = useRef(0);
  useEffect(() => {
    t0.current = now();
  }, []);
  const nDone = Object.keys(done).length;

  // 1초마다 시계 · 0이 되면 끝
  useEffect(() => {
    if (end) return;
    const iv = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          clearInterval(iv);
          setEnd((e) => e ?? { sec: time, nDone: -1, best: best.current, miss: miss.current });
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [end, time]);

  const pickL = (i: number) => {
    sfx('tap');
    setBad(null);
    setSel(i);
  };
  const pickR = (j: number) => {
    if (sel == null) {
      showToast('왼쪽 영어를 먼저 골라요');
      return;
    }
    if (j === sel) {
      const nd = { ...done, [j]: true as const };
      setDone(nd);
      combo.current += 1;
      best.current = Math.max(best.current, combo.current);
      setComboN(combo.current);
      setSel(null);
      setBad(null);
      sfx('correct');
      haptic('select');
      if (Object.keys(nd).length === N) {
        // 마지막 짝도 노랗게 잠깐 보여 준 뒤 결과로
        const sec = secondsSince(t0.current);
        const b = best.current;
        const m = miss.current;
        setTimeout(() => setEnd({ sec, nDone: N, best: b, miss: m }), 650);
      }
    } else {
      miss.current += 1;
      combo.current = 0;
      setComboN(0);
      setBad({ l: sel, r: j });
      setSel(null);
      sfx('wrong');
      haptic('error');
    }
  };

  if (end) return <MatchResult task={task} recordKey={recordKey} sec={end.sec} nDone={end.nDone < 0 ? nDone : end.nDone} best={end.best} miss={end.miss} mark={mark} next={next} again={again} isLast={isLast} />;

  return (
    <TaskLayout
      foot={
        <PText style={styles.footMsg} color={Colors.inkSub}>
          {nDone}/{N} 짝
        </PText>
      }>
      <View style={styles.timer}>
        <PText style={styles.time}>0:{String(Math.max(0, left)).padStart(2, '0')}</PText>
        <View style={styles.bar}>
          <View style={StyleSheet.flatten([styles.barFill, { width: `${(Math.max(0, left) / time) * 100}%` }])} />
        </View>
        <View style={styles.combo}>
          <PText style={styles.comboText} color={Colors.yellow}>
            x{comboN}
          </PText>
        </View>
      </View>
      <TaskMsg>영어와 뜻을 짝지어요 · 연속으로 맞히면 콤보</TaskMsg>
      <View style={styles.grid}>
        <View style={styles.col}>
          {Lo.map((i) => (
            <Card key={i} text={P[i][0]} en state={done[i] ? 'ok' : bad?.l === i ? 'bad' : sel === i ? 'sel' : 'idle'} onPress={() => pickL(i)} />
          ))}
        </View>
        <View style={styles.col}>
          {Ro.map((i) => (
            <Card key={i} text={P[i][1]} state={done[i] ? 'ok' : bad?.r === i ? 'bad' : 'idle'} onPress={() => pickR(i)} />
          ))}
        </View>
      </View>
    </TaskLayout>
  );
}

const now = () => Date.now();
const secondsSince = (t: number) => Math.max(1, Math.round((Date.now() - t) / 1000));

function Card({ text, en = false, state, onPress }: { text: string; en?: boolean; state: 'idle' | 'sel' | 'ok' | 'bad'; onPress: () => void }) {
  const x = useSharedValue(0);
  useEffect(() => {
    if (state !== 'bad') return;
    x.set(withSequence(withTiming(-6, { duration: 70 }), withTiming(6, { duration: 90 }), withTiming(-4, { duration: 80 }), withTiming(0, { duration: 70 })));
  }, [state, x]);
  const a = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  const ok = state === 'ok';
  return (
    <Pressable onPress={onPress} disabled={ok} accessibilityRole="button" accessibilityLabel={text} accessibilityState={{ selected: state === 'sel', disabled: ok }}>
      {({ pressed }) => (
        <Animated.View style={a}>
          <View style={StyleSheet.flatten([styles.mc, state === 'sel' && styles.mcSel, ok && styles.mcOk, state === 'bad' && styles.mcBad, pressed && !ok && styles.mcDown])}>
            <PText style={en ? styles.mcEn : styles.mcKo} color={state === 'bad' ? '#8A6170' : Colors.ink}>
              {text}
            </PText>
          </View>
        </Animated.View>
      )}
    </Pressable>
  );
}

function MatchResult({
  task,
  recordKey,
  sec,
  nDone,
  best,
  miss,
  mark,
  next,
  again,
  isLast,
}: {
  task: Task;
  recordKey: string;
  sec: number;
  nDone: number;
  best: number;
  miss: number;
  mark: (ok: boolean, once?: boolean) => void;
  next: () => void;
  again: () => void;
  isLast: boolean;
}) {
  const N = task.pairs.length;
  const all = nDone === N;
  const stars = all ? (sec <= 20 && miss <= 1 ? 3 : 2) : nDone >= N / 2 ? 1 : 0;
  // 기록은 처음 그릴 때 한 번만 (지난 기록과 비교한 뒤 새 기록이면 남겨요)
  const [rec] = useState(() => {
    const key = `${recordKey}:${task.id}`;
    const prev = getBest(key);
    if (all && (!prev || sec < prev)) setBest(key, sec);
    return prev;
  });
  useEffect(() => {
    mark(all);
    sfx(all ? 'correct' : 'wrong');
    // 한 번만 기록해요
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const msg = all && rec && sec < rec ? `지난 기록 ${rec}초를 깼어요!` : rec ? `내 최고 기록 ${Math.min(rec, all ? sec : rec)}초` : all ? '첫 기록이에요! 한 번 더 하면 더 빨라져요' : '시간이 끝났어요 · 한 번 더 해 볼까요?';
  return (
    <TaskLayout
      foot={
        <View style={styles.endWrap}>
          <FadeUp style={styles.endRow}>
            <Image source={all ? require('@/assets/characters/c-upright-yellow.png') : require('@/assets/characters/c-upright-purple.png')} style={styles.endChar} contentFit="contain" />
            <PText style={styles.endMsg}>{msg}</PText>
          </FadeUp>
          <FadeUp delay={70} style={styles.row}>
            <GhostButton label="한 번 더" onPress={again} />
            <YellowButton label={isLast ? '완료하기' : '다음'} onPress={next} style={styles.flex} />
          </FadeUp>
        </View>
      }>
      <View style={styles.res}>
        <Image source={all ? require('@/assets/characters/c-upright-yellow.png') : require('@/assets/characters/c-tilted-yellow.png')} style={all ? styles.resChar : styles.resCharTilt} contentFit="contain" />
        <PText style={styles.rn} accessibilityLabel={`${nDone} / ${N}`}>
          <Count to={nDone} delay={350} /> / {N}
        </PText>
        <View style={styles.stars} accessibilityLabel={`별 ${stars}개`}>
          {[0, 1, 2].map((i) => (
            <Star key={i} on={i < stars} delay={350 + i * 150} />
          ))}
        </View>
        <View style={styles.rs}>
          <Tile cls="t1" delay={450} icon={<ClockIcon size={22} />} value={all ? <><Count to={sec} delay={470} />초</> : '시간 끝'} label="걸린 시간" />
          <Tile cls="t2" delay={570} icon={<Bolt />} value={<>x<Count to={best} delay={590} /></>} label="최고 콤보" />
          <Tile cls="t3" delay={690} icon={<XIcon size={22} color="#C2416B" w={2.6} />} value={<Count to={miss} delay={710} />} label="틀린 짝" />
        </View>
      </View>
    </TaskLayout>
  );
}

const Bolt = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24">
    <Path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="#FFE200" stroke="#1E1A2B" strokeWidth={2.2} strokeLinejoin="round" />
  </Svg>
);

function useCount(to: number, delay: number) {
  const still = useReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (still || !to) return;
    let raf = 0;
    const t0 = Date.now() + delay;
    const step = () => {
      const k = Math.max(0, Math.min(1, (Date.now() - t0) / 650));
      setN(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, delay, still]);
  return still || !to ? to : n;
}

/** 세어 올라가는 숫자. 이 글자만 다시 그려지도록 따로 떼었어요 (결과 화면 전체가 매 프레임 다시 그려지지 않게) */
function Count({ to, delay }: { to: number; delay: number }) {
  return <>{useCount(to, delay)}</>;
}

function Star({ on, delay }: { on: boolean; delay: number }) {
  const still = useReducedMotion();
  const p = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (!still) p.set(withDelay(delay, withTiming(1, { duration: 450, easing: Easing.bezier(0.2, 0.9, 0.3, 1.3) })));
  }, [delay, still, p]);
  const a = useAnimatedStyle(() => ({ opacity: Math.min(1, p.get() * 1.5), transform: [{ scale: 0.4 + 0.6 * p.get() }] }));
  return (
    <Animated.View style={a}>
      <Svg width={34} height={34} viewBox="0 0 24 24">
        <Path d="M12 2.6l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 16.8 6.2 20.1l1.4-6.4L2.7 9.3l6.5-.7z" fill={on ? Colors.yellow : '#E3DCCB'} stroke={Colors.ink} strokeWidth={1.4} strokeLinejoin="round" />
      </Svg>
    </Animated.View>
  );
}

function Tile({ cls, delay, icon, value, label }: { cls: 't1' | 't2' | 't3'; delay: number; icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <FadeUp delay={delay} rotate={cls === 't2' ? -2 : 0} style={StyleSheet.flatten([styles.rt, cls === 't1' && styles.t1, cls === 't2' && styles.t2, cls === 't3' && styles.t3])}>
      <View style={StyleSheet.flatten([styles.ic, cls === 't2' && styles.icInk])}>{icon}</View>
      <PText style={styles.rtNum}>{value}</PText>
      <PText style={styles.rtLabel}>{label}</PText>
    </FadeUp>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  row: { flexDirection: 'row', gap: 10 },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  time: { minWidth: 66, fontFamily: Font.display, fontSize: 24, lineHeight: 30, fontVariant: ['tabular-nums'] },
  bar: { flex: 1, height: 14, borderRadius: 8, borderWidth: 2, borderColor: Colors.ink, backgroundColor: '#F1EBDC', overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: Colors.rosePink, borderRightWidth: 2, borderColor: Colors.ink },
  combo: { height: 30, paddingHorizontal: 10, borderRadius: 15, backgroundColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  comboText: { fontFamily: Font.display, fontSize: 12, lineHeight: 16 },
  grid: { flexDirection: 'row', gap: 10 },
  col: { flex: 1, gap: 7 },
  mc: { minHeight: 56, paddingVertical: 5, paddingHorizontal: 8, borderRadius: 18, borderWidth: 2.5, borderColor: Colors.ink, borderBottomWidth: 6.5, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  mcDown: { borderBottomWidth: 2.5, marginTop: 4 },
  mcSel: { backgroundColor: Colors.yellow },
  mcOk: { backgroundColor: Colors.yellow, borderBottomWidth: 2.5, marginTop: 4, opacity: 0.45 },
  mcBad: { backgroundColor: '#F6D3DC', borderStyle: 'dashed', borderBottomWidth: 2.5, marginTop: 4 },
  mcEn: { fontFamily: Font.display, fontSize: 15, lineHeight: 20, textAlign: 'center' },
  mcKo: { fontFamily: Font.body900, fontSize: 15, lineHeight: 20, textAlign: 'center' },
  footMsg: { textAlign: 'center', fontFamily: Font.body800, fontSize: 13, lineHeight: 20 },
  res: { alignItems: 'center', gap: 8, paddingTop: 30 },
  resChar: { width: 130, height: 83 },
  resCharTilt: { width: 130, height: 95 },
  rn: { fontFamily: Font.display, fontSize: 44, lineHeight: 54, letterSpacing: -1 },
  stars: { flexDirection: 'row', gap: 6 },
  rs: { flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 10 },
  rt: { flex: 1, minWidth: 0, alignItems: 'center', gap: 4, paddingTop: 14, paddingBottom: 12, paddingHorizontal: 6, borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, boxShadow: '3px 3px 0 #1E1A2B' },
  t1: { backgroundColor: '#E3EAF8' },
  t2: { backgroundColor: Colors.yellow }, // 기울기(-2deg)는 FadeUp rotate 로
  t3: { backgroundColor: '#FBE1E8' },
  ic: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  icInk: { backgroundColor: Colors.ink },
  rtNum: { fontFamily: Font.display, fontSize: 19, lineHeight: 24, fontVariant: ['tabular-nums'] },
  rtLabel: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 15 },
  endWrap: { gap: 12, paddingTop: 8 },
  endRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  endChar: { width: 88, height: 70, marginBottom: -2 },
  endMsg: { flex: 1, fontFamily: Font.body800, fontSize: 15, lineHeight: 22 },
});
