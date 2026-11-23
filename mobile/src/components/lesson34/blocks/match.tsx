import { useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Pressable } from '@/components/ui/pressable';
import { Appear } from '@/components/ui/appear';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { haptic, sfx } from '@/lib/feedback';

import { Body, Foot, useRunner } from '../frame';
import { answers, setBest } from '../store';
import { shuffle } from '../text';
import type { MatchTask } from '../types';
import { EndMsg, EndNote, FootRow, GoBtn, Msg, SkipBtn, SUB } from '../ui';
import { HopStage, PopStars, useCountUp } from './match-result-fx';

/**
 * 짝 맞추기 타임어택 (프로토타입 TKV.match): 왼쪽 영어 → 오른쪽 뜻. 30초 · 콤보 · 최고 기록.
 * 고르면 들리고, 맞은 짝은 통 튀며 반짝인 뒤 초록으로 가라앉고, 틀린 짝은 양쪽이 분홍으로 번쩍이며 흔들려요. 결과: 걸린 시간 · 최고 콤보 · 틀린 짝.
 */
export function MatchBlock({ task }: { task: MatchTask }) {
  const [round, setRound] = useState(0);
  return <MatchRound key={round} task={task} onAgain={() => setRound((n) => n + 1)} />;
}

/** 시작부터 지난 초 (최소 1초) */
const since = (t0: number) => Math.max(1, Math.round((Date.now() - t0) / 1000));

function MatchRound({ task, onAgain }: { task: MatchTask; onAgain: () => void }) {
  const rt = useRunner();
  const P = task.pairs;
  const N = P.length;
  const [L] = useState(() => shuffle(P.map((_, i) => i)));
  const [R] = useState(() => shuffle(P.map((_, i) => i)));
  const [done, setDone] = useState<Record<number, true>>({});
  const [sel, setSel] = useState<number | null>(null);
  const [combo, setCombo] = useState(0);
  const [best, setBestCombo] = useState(0);
  const [miss, setMiss] = useState(0);
  const [bad, setBad] = useState<{ l: number; r: number; n: number } | null>(null);
  const [left, setLeft] = useState(task.time);
  const [end, setEnd] = useState<null | { used: number }>(null);
  const t0 = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const nDone = Object.keys(done).length;

  useEffect(() => {
    t0.current = Date.now();
    timer.current = setInterval(() => {
      setLeft((x) => {
        if (x - 1 <= 0) {
          if (timer.current) clearInterval(timer.current);
          setEnd({ used: task.time });
        }
        return Math.max(0, x - 1);
      });
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [task.time]);

  const pickR = (j: number) => {
    if (sel == null) {
      showToast('왼쪽 영어를 먼저 골라요');
      return;
    }
    if (j === sel) {
      const next = { ...done, [j]: true as const };
      setDone(next);
      setCombo((c) => {
        setBestCombo((b) => Math.max(b, c + 1));
        return c + 1;
      });
      setSel(null);
      sfx('correct');
      haptic('select');
      if (Object.keys(next).length === N) {
        // 마지막 짝도 초록으로 잠깐 보여 준 뒤 결과로
        if (timer.current) clearInterval(timer.current);
        const used = since(t0.current);
        setTimeout(() => setEnd({ used }), 650);
      }
    } else {
      if (miss === 0) rt.peek(['한 번 더 짝지어 봐요', '']);
      setMiss((m) => m + 1);
      setCombo(0);
      setBad((b) => ({ l: sel, r: j, n: (b?.n ?? 0) + 1 }));
      setTimeout(() => setBad(null), 500);
      setSel(null);
      sfx('wrong');
      haptic('error');
    }
  };

  if (end) return <MatchResult task={task} nDone={nDone} used={end.used} best={best} miss={miss} onAgain={onAgain} />;
  return (
    <>
      <Body>
        <View style={styles.timer}>
          <PText style={styles.time}>{`0:${String(Math.max(0, left)).padStart(2, '0')}`}</PText>
          <View style={styles.bar}>
            <View style={StyleSheet.flatten([styles.fill, { width: `${(Math.max(0, left) / task.time) * 100}%` }])} />
          </View>
          <View style={styles.combo}>
            <PText style={styles.comboT} color={Colors.yellow}>{`x${combo}`}</PText>
          </View>
        </View>
        <Msg text="영어와 뜻을 짝지어요 · 연속으로 맞히면 콤보" />
        <View style={styles.grid}>
          <View style={styles.col}>
            {L.map((i) => (
              <Tile key={i} label={P[i][0]} en ok={!!done[i]} sel={sel === i} bad={bad?.l === i ? bad.n : 0} onPress={() => {
                  sfx('tap');
                  setSel(i);
                }} />
            ))}
          </View>
          <View style={styles.col}>
            {R.map((i) => (
              <Tile key={i} label={P[i][1]} ok={!!done[i]} bad={bad?.r === i ? bad.n : 0} onPress={() => pickR(i)} />
            ))}
          </View>
        </View>
      </Body>
      <Foot>
        <Msg text={`${nDone}/${N} 짝`} style={styles.footMsg} />
      </Foot>
    </>
  );
}

/** 고르면 살짝 들려요 · 짝 맞으면 통 튀었다 가라앉는 스프링 */
const LIFT = { damping: 13, stiffness: 340, mass: 0.7 } as const;
const SETTLE = { damping: 8, stiffness: 260, mass: 0.7 } as const;
const OUT = Easing.out(Easing.quad);

/**
 * 짝 카드 .tk-mc (고름: 노랑 · 맞음: 초록 · 틀림: 빨강 흔들림)
 * - 고르면: 스프링으로 살짝 커지며 들려요
 * - 맞으면: 통 커졌다가 반짝(흰 빛) → 조금 작고 옅게 가라앉아 '끝난 짝' 이 돼요
 * - 틀리면: 레슨 1 처럼 좌우로 흔들리고 분홍 빛이 번쩍 (0.5초 뒤 원래 색)
 * 움직임 줄이기면 색만 바뀌어요.
 */
function Tile({ label, en, ok, sel, bad, onPress }: { label: string; en?: boolean; ok: boolean; sel?: boolean; bad: number; onPress: () => void }) {
  const still = useReducedMotion();
  const x = useSharedValue(0);
  const s = useSharedValue(1);
  const y = useSharedValue(0);
  const fade = useSharedValue(1);
  const flash = useSharedValue(0);
  // 틀린 짝은 0.5초 동안 빨갛게 (bad 가 0이 되면 원래대로)
  const red = bad > 0;

  // 고름 ↔ 풀림: 스프링 들림 (맞음 효과보다 먼저 두어야 맞음이 이겨요)
  useEffect(() => {
    if (still || ok) return;
    s.set(withSpring(sel ? 1.06 : 1, LIFT));
    y.set(withSpring(sel ? -3 : 0, LIFT));
  }, [sel, ok, still, s, y]);

  // 맞음: 통 → 반짝 → 가라앉기
  useEffect(() => {
    if (!ok || still) return;
    s.set(withSequence(withTiming(1.12, { duration: 120, easing: OUT }), withSpring(0.96, SETTLE)));
    y.set(withSequence(withTiming(-6, { duration: 120, easing: OUT }), withSpring(0, SETTLE)));
    flash.set(withSequence(withTiming(0.85, { duration: 90 }), withTiming(0, { duration: 380, easing: OUT })));
    fade.set(withDelay(380, withTiming(0.72, { duration: 320 })));
  }, [ok, still, s, y, flash, fade]);

  // 틀림: 좌우 흔들림 (레슨 1 카드와 같은 박자) + 분홍 번쩍
  useEffect(() => {
    if (!bad || still) return;
    x.set(withSequence(withTiming(-6, { duration: 70 }), withTiming(6, { duration: 90 }), withTiming(-4, { duration: 80 }), withTiming(0, { duration: 70 })));
    s.set(withSequence(withTiming(0.97, { duration: 70 }), withSpring(1, LIFT)));
    flash.set(withSequence(withTiming(0.7, { duration: 70 }), withTiming(0, { duration: 330, easing: OUT })));
  }, [bad, still, x, s, flash]);

  const move = useAnimatedStyle(() => ({ opacity: fade.get(), transform: [{ translateX: x.get() }, { translateY: y.get() }, { scale: s.get() }] }));
  const glow = useAnimatedStyle(() => ({ opacity: flash.get() }));
  return (
    <Pressable onPress={onPress} disabled={ok} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: !!sel, disabled: ok }}>
      {({ pressed }) => (
        <Animated.View style={move}>
          <View style={[styles.tile, sel && styles.tileSel, ok && styles.tileOk, red && styles.tileBad, pressed && !ok && styles.tileOn]}>
            <Animated.View pointerEvents="none" style={[styles.flash, { backgroundColor: red ? '#FF9DB1' : Colors.white }, glow]} />
            <PText style={en ? styles.tileEn : styles.tileKo} color={ok ? '#1D6B3B' : red ? '#A3243C' : Colors.ink}>
              {label}
            </PText>
          </View>
        </Animated.View>
      )}
    </Pressable>
  );
}

function MatchResult({ task, nDone, used, best, miss, onAgain }: { task: MatchTask; nDone: number; used: number; best: number; miss: number; onAgain: () => void }) {
  const rt = useRunner();
  const N = task.pairs.length;
  const all = nDone === N;
  const sec = all ? used : 0;
  const stars = all ? (sec <= 20 && miss <= 1 ? 3 : 2) : nDone >= N / 2 ? 1 : 0;
  const bestKey = `${rt.bestKey}:${task.id}`;
  const [prev] = useState(() => answers().best[bestKey]);
  const marked = useRef(false);
  useEffect(() => {
    if (marked.current) return;
    marked.current = true;
    rt.mark(all);
    if (all && (!prev || sec < prev)) setBest(bestKey, sec);
    sfx(all ? 'correct' : 'wrong');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const count = useCountUp(nDone, 150, 600);
  const [title, msg] =
    all && prev && sec < prev
      ? [`${sec}초 신기록!`, `지난 기록 ${prev}초를 깼어요`]
      : all && prev
        ? [`${sec}초`, `내 최고 기록 ${prev}초`]
        : all
          ? ['첫 기록!', '한 번 더 하면 더 빨라져요']
          : ["Time's up!", prev ? `내 최고 기록 ${prev}초 · 한 번 더 해 볼까요?` : '시간이 끝났어요 · 한 번 더 해 볼까요?'];
  return (
    <>
      <Body>
        <View style={styles.res}>
          {/* res 가 가운데 정렬이라 감싸개가 내용 폭(0)으로 줄어요 → 꽉 채워야 무대(width 100%)가 보여요 */}
          <Appear kind="tkRise" style={styles.stageWrap}>
            <HopStage good={all} />
          </Appear>
          <View style={styles.score} accessibilityLabel={`${N}짝 중 ${nDone}짝`}>
            <PText style={styles.rn}>{count}</PText>
            <PText style={styles.rnOf} color={SUB}>{`/ ${N}`}</PText>
          </View>
          <PopStars n={stars} delay={350} />
          <View style={styles.rs}>
            <ResTile tone={styles.t1} icon={<ClockIc />} value={all ? sec : null} unit="초" label="걸린 시간" delay={900} />
            <ResTile tone={styles.t2} icon={<BoltIc />} value={best} prefix="x" label="최고 콤보" delay={1020} tilt />
            <ResTile tone={styles.t3} icon={<MissIc />} value={miss} label="틀린 짝" delay={1140} />
          </View>
        </View>
      </Body>
      <Foot>
        <EndNote good={all}>
          <EndMsg title={title} rest={msg} good={all} />
        </EndNote>
        <FootRow>
          <SkipBtn label="한 번 더" onPress={onAgain} />
          <GoBtn label={rt.goLabel === '완료하기' ? '완료하기' : '다음'} onPress={rt.next} />
        </FootRow>
      </Foot>
    </>
  );
}
/** 결과 칸 하나: 아래에서 솟아오르고, 숫자는 0부터 올라가요. value 가 null 이면 '시간 끝' */
function ResTile({ tone, icon, value, prefix = '', unit = '', label, delay, tilt }: { tone: object; icon: ReactNode; value: number | null; prefix?: string; unit?: string; label: string; delay: number; tilt?: boolean }) {
  const n = useCountUp(value ?? 0, delay + 200, 650);
  return (
    <Appear kind="tkRise" delay={delay} style={styles.rtWrap}>
      <View style={StyleSheet.flatten([styles.rt, tone, tilt && { transform: [{ rotate: '-2deg' }] }])}>
        <View style={StyleSheet.flatten([styles.ic, tilt && { backgroundColor: Colors.ink }])}>{icon}</View>
        <PText style={styles.rtB}>{value == null ? '시간 끝' : `${prefix}${n}${unit}`}</PText>
        <PText style={styles.rtS}>{label}</PText>
      </View>
    </Appear>
  );
}
const ClockIc = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={Colors.ink} strokeWidth={2.4} strokeLinecap="round">
    <Path d="M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M12 7v5l3 2" />
  </Svg>
);
const BoltIc = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Path d="M13 2 4 14h7l-1 8 9-12h-7z" fill={Colors.yellow} stroke={Colors.yellow} strokeWidth={1.5} strokeLinejoin="round" />
  </Svg>
);
const MissIc = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#C2416B" strokeWidth={2.8} strokeLinecap="round">
    <Path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

const styles = StyleSheet.create({
  timer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  time: { fontFamily: Font.display, fontSize: 24, lineHeight: 30, minWidth: 72, fontVariant: ['tabular-nums'] },
  bar: { flex: 1, height: 16, borderRadius: 8, borderWidth: 2, borderColor: Colors.ink, backgroundColor: '#F1EBDC', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: Colors.rosePink, borderRightWidth: 2, borderColor: Colors.ink },
  combo: { height: 30, paddingHorizontal: 10, borderRadius: 15, backgroundColor: Colors.ink, justifyContent: 'center' },
  comboT: { fontFamily: Font.display, fontSize: 12, lineHeight: 16 },
  grid: { flexDirection: 'row', gap: 10, marginTop: 4 },
  col: { flex: 1, gap: 7 },
  tile: { minHeight: 56, paddingVertical: 5, paddingHorizontal: 8, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, boxShadow: `0px 4px 0px ${Colors.ink}`, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  tileSel: { backgroundColor: Colors.yellow },
  flash: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16, opacity: 0 },
  tileOk: { backgroundColor: '#DDF3E2', borderColor: '#2E9E5B', boxShadow: 'none' },
  tileBad: { backgroundColor: '#FBD5DC', borderColor: '#D83A56', boxShadow: 'none' },
  tileOn: { transform: [{ translateY: 3 }], boxShadow: `0px 1px 0px ${Colors.ink}` },
  tileEn: { fontFamily: Font.display, fontSize: 15, lineHeight: 19.5, textAlign: 'center' },
  tileKo: { fontFamily: Font.body800, fontSize: 15, lineHeight: 19.5, textAlign: 'center' },
  footMsg: { paddingBottom: 8 },
  res: { flex: 1, alignItems: 'center', gap: 6, paddingTop: 6 },
  stageWrap: { alignSelf: 'stretch' },
  score: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 10 },
  rn: { fontFamily: Font.display, fontSize: 52, lineHeight: 58, letterSpacing: -1, fontVariant: ['tabular-nums'] },
  rnOf: { fontFamily: Font.display, fontSize: 26, lineHeight: 32 },
  rs: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 14 },
  rtWrap: { flex: 1 },
  rt: { alignItems: 'center', gap: 4, paddingTop: 14, paddingBottom: 12, paddingHorizontal: 6, borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, boxShadow: `3px 3px 0px ${Colors.ink}` },
  t1: { backgroundColor: '#E3EAF8' },
  t2: { backgroundColor: Colors.yellow },
  t3: { backgroundColor: '#FBE1E8' },
  ic: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  rtB: { fontFamily: Font.display, fontSize: 19, lineHeight: 23, fontVariant: ['tabular-nums'] },
  rtS: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16, color: SUB },
});
