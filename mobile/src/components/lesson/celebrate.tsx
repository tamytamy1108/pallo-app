import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Ellipse, G, Mask, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Pressable } from '@/components/ui/pressable';
import { BrandIcon, type BrandIconName } from '@/components/lesson/brand-icons';
import { HomeIcon } from '@/components/lesson/icons';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { CEL_TITLE, pickOne } from '@/data/lessons';
import { haptic, sfx } from '@/lib/feedback';
import { kfc } from '@/lib/motion';
import { LayerModal } from '@/components/ui/sheet-stack';

export type CelebrateResult = {
  /** 최종 점수: 맞힌 수 / 전체 (전체 0 이면 정확도 칸 없이) */
  correct: number;
  total: number;
  /** 이번에 받은 포인트 (단계를 처음 끝낼 때만 +5 / +10 / +15, 더 빨리 풀면 그 차이만큼 보너스) */
  points: number;
  /** 오늘 목표 (학습 n개 중 몇 개) */
  goalDone: number;
  goalTotal: number;
  /** 과를 다 끝냈으면 노랑 큰 축하 */
  unitComplete?: boolean;
  /** 제한 시간이 있던 문제 수 · 그중 시간 안에 맞힌 수 → '빠른 답' 칸 */
  timed?: number;
  fast?: number;
  /** 제목을 정해 주면 그대로 (예: '예습 완료!'). 없으면 점수에 맞춰 골라요(CEL_TITLE) */
  title?: string;
  /** 노랑 바탕 큰 축하 (구역 · 과를 다 끝냈을 때) */
  big?: boolean;
  /** [이어서 하기] 옆 다음 단계 포인트 */
  nextPoints?: number;
  /** 제목 아래 한 줄 (예: 'STAGE 3까지 건너뛰었어요') */
  sub?: string;
};

const POSES = [
  require('@/assets/characters/c-upright-yellow.png'),
  require('@/assets/characters/c-upright-yellow-flip.png'),
  require('@/assets/characters/c-tilted-yellow.png'),
  require('@/assets/characters/c-tilted-yellow-flip.png'),
];
const MOVES = ['hop', 'twirl', 'boing', 'wiggle', 'flip', 'lean'] as const;
type Move = (typeof MOVES)[number];
const RISE = Easing.bezier(0.2, 0.9, 0.3, 1.3);
const CONFETTI = ['#FFE200', '#F28CB1', '#7FA7E8', '#5CBF8A', '#493087', '#FF7A59'];

/**
 * 완료(축하) 화면 (docs/pages/03-lesson.md '완료(축하) 화면' · 프로토타입 celebrate · .celebrate).
 * 노랑 팔로가 0.5초마다 30px 통통 + 0.95초마다 춤 동작, 뒤에 세 색 빛줄기 · 컨페티,
 * 숫자 카드 한 장(포인트 · 정확도 · 빠른 답 · 오늘 목표 — 0부터 차오름), 아래 집 아이콘 + [이어서 하기]. 팡파르.
 * onNext 가 없으면(마지막 단계) 노랑 버튼만 꽉 차게. 레슨 A · B가 같이 써요. props 는 바꾸지 않아요(늘리기만).
 */
export function Celebrate({
  visible,
  result,
  onHome,
  onNext,
  sub: subProp,
}: {
  visible: boolean;
  result: CelebrateResult;
  onHome: () => void;
  onNext?: () => void;
  /** 제목 아래 한 줄 (예: '카페 장면 완료! 지도에 도장이 찍혔어요') — 프로토타입 .cel-sub */
  sub?: string;
}) {
  const insets = useSafeAreaInsets();
  const big = !!(result.big || result.unitComplete);
  const sub = subProp ?? result.sub;
  const title = useMemo(() => {
    if (result.title) return result.title;
    const { correct, total } = result;
    const mood = !total ? 'good' : correct === total ? 'perfect' : correct >= Math.ceil(total / 2) ? 'good' : 'tried';
    return pickOne(CEL_TITLE[mood]);
    // 화면이 뜰 때 한 번만 골라요
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    sfx('fanfare');
    haptic('success');
  }, [visible]);

  const acc = result.total ? Math.round((result.correct / result.total) * 100) : null;
  const gd = Math.min(result.goalDone, result.goalTotal);
  const boxes: Box[] = [];
  if (result.points) boxes.push({ k: 'pt', label: '포인트', icon: 'coin', to: result.points, fmt: (n) => `+${n}P` });
  if (acc != null) boxes.push({ k: 'ac', label: '정확도', icon: 'target', to: acc, fmt: (n) => `${n}%`, gauge: acc });
  if (result.timed) boxes.push({ k: 'sp', label: '빠른 답', icon: 'bolt', to: result.fast ?? 0, fmt: (n) => `${n}/${result.timed}`, gauge: ((result.fast ?? 0) / result.timed) * 100 });
  boxes.push({ k: 'gl', label: '오늘 목표', icon: 'flag', to: gd, fmt: (n) => `${n}/${result.goalTotal}`, gauge: result.goalTotal ? (gd / result.goalTotal) * 100 : 0 });

  return (
    <LayerModal visible={visible} animationType="fade" onRequestClose={onHome} statusBarTranslucent>
      <View style={StyleSheet.flatten([styles.root, big && styles.rootBig, { paddingTop: 40 + insets.top, paddingBottom: 26 + insets.bottom }])}>
        {visible && <Confetti big={big} />}
        <Stage big={big} />
        <Rise delay={380}>
          <PText style={styles.title} accessibilityRole="header">
            {title}
          </PText>
        </Rise>
        {sub ? (
          <Rise delay={450}>
            <PText style={styles.sub} color={big ? Colors.ink : Colors.inkSub}>
              {sub}
            </PText>
          </Rise>
        ) : null}
        <Rise delay={550} style={styles.boxesWrap}>
          <View style={styles.boxes}>
            {boxes.map((b, i) => (
              <BoxCell key={b.k} box={b} big={big} first={i === 0} index={i} />
            ))}
          </View>
        </Rise>
        <Rise delay={850} style={styles.acts}>
          {onNext ? (
            <Pressable
              onPress={() => {
                sfx('back');
                onHome();
              }}
              accessibilityRole="button"
              accessibilityLabel="홈으로">
              {({ pressed }) => (
                <View style={StyleSheet.flatten([styles.home, pressed && styles.down])}>
                  <HomeIcon />
                </View>
              )}
            </Pressable>
          ) : null}
          <Nudge style={styles.flex}>
            <Pressable
              onPress={() => {
                sfx('big');
                (onNext ?? onHome)();
              }}
              accessibilityRole="button"
              accessibilityLabel={onNext ? '이어서 하기' : '계속하기'}>
              {({ pressed }) => (
                <View style={StyleSheet.flatten([styles.next, big && styles.nextBig, pressed && styles.down])}>
                  <PText style={styles.nextText}>{onNext ? '이어서 하기' : '계속하기'}</PText>
                  {onNext && result.nextPoints ? (
                    <View style={styles.nextPts}>
                      <PText style={styles.nextPtsText} color={Colors.yellow}>
                        +{result.nextPoints}P
                      </PText>
                    </View>
                  ) : null}
                </View>
              )}
            </Pressable>
          </Nudge>
        </Rise>
      </View>
    </LayerModal>
  );
}

type Box = { k: 'pt' | 'ac' | 'sp' | 'gl'; label: string; icon: BrandIconName; to: number; fmt: (n: number) => string; gauge?: number };
const BOX_C: Record<Box['k'], { bg: string; v: string; t: string; gaugeBg: string; fill: string }> = {
  pt: { bg: '#FFE200', v: Colors.ink, t: Colors.ink, gaugeBg: 'rgba(30,26,43,0.14)', fill: Colors.ink },
  ac: { bg: Colors.purple, v: Colors.white, t: '#E3D9FA', gaugeBg: 'rgba(255,255,255,0.22)', fill: Colors.yellow },
  sp: { bg: Colors.white, v: Colors.ink, t: Colors.ink, gaugeBg: 'rgba(30,26,43,0.14)', fill: Colors.ink },
  gl: { bg: '#9DC3EE', v: Colors.ink, t: Colors.ink, gaugeBg: 'rgba(30,26,43,0.14)', fill: Colors.ink },
};

/** 숫자 카드 한 칸: 아이콘(통) → 숫자(0부터 차오름) → 게이지(0.9초) → 이름 */
function BoxCell({ box, big, first, index }: { box: Box; big: boolean; first: boolean; index: number }) {
  const c = BOX_C[box.k];
  const bg = big && box.k === 'pt' ? '#FFF3A0' : c.bg;
  const n = useCountUp(box.to, 1050, 900);
  const still = useReducedMotion();
  const g = useSharedValue(still ? 1 : 0);
  const hop = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (still) return;
    g.set(withDelay(1050, withTiming(1, { duration: 900, easing: Easing.bezier(0.2, 0.8, 0.3, 1) })));
    hop.set(withDelay(700 + index * 120, withTiming(1, { duration: 600, easing: Easing.linear })));
  }, [still, g, hop, index]);
  const fill = useAnimatedStyle(() => ({ transform: [{ scaleX: g.get() }] }));
  // cbHop: 아래에서 작게 → 살짝 위로 → 제자리
  const emo = useAnimatedStyle(() => {
    const p = hop.get();
    return { opacity: kfc(p, [0, 60, 100], [0, 1, 1], HOP_EASE), transform: [{ translateY: kfc(p, [0, 60, 100], [14, -6, 0], HOP_EASE) }, { scale: kfc(p, [0, 60, 100], [0.4, 1.06, 1], HOP_EASE) }] };
  });
  return (
    <View style={StyleSheet.flatten([styles.cb, { backgroundColor: bg }, !first && styles.cbLine])} accessibilityLabel={`${box.label} ${box.fmt(box.to)}`}>
      <Animated.View style={[styles.emo, emo]}>
        <BrandIcon name={box.icon} size={30} />
      </Animated.View>
      <PText style={styles.cbNum} color={c.v}>
        {box.fmt(n)}
      </PText>
      {box.gauge != null && (
        <View style={StyleSheet.flatten([styles.gauge, { backgroundColor: c.gaugeBg }])}>
          <Animated.View style={[styles.gaugeFill, { width: `${Math.max(0, Math.min(100, box.gauge))}%`, backgroundColor: c.fill }, fill]} />
        </View>
      )}
      <PText style={styles.cbLabel} color={c.t}>
        {box.label}
      </PText>
    </View>
  );
}

/** cbHop cubic-bezier(.3,1.6,.5,1) — 구간마다 */
const HOP_EASE = Easing.bezierFn(0.3, 1.6, 0.5, 1);

/** 0부터 숫자를 세어 올려요 (delay 뒤 dur 동안 · 끝으로 갈수록 천천히) */
function useCountUp(to: number, delay: number, dur: number) {
  const still = useReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (still || !to) return;
    let raf = 0;
    const t0 = Date.now() + delay;
    const step = () => {
      const k = Math.min(1, Math.max(0, (Date.now() - t0) / dur));
      setN(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, delay, dur, still]);
  return still || !to ? to : n;
}

/** 캐릭터 무대: 빛줄기(세 색 · 천천히 돌아요) + 그림자 + 통통 뛰며 춤추는 노랑 팔로 */
function Stage({ big }: { big: boolean }) {
  const still = useReducedMotion();
  const [pose, setPose] = useState(0);
  const [move, setMove] = useState<{ m: Move | 'in'; n: number }>({ m: 'in', n: 0 });
  const bounce = useSharedValue(0);
  const rays = useSharedValue(still ? 1 : 0);
  const spin = useSharedValue(0);

  useEffect(() => {
    if (still) return;
    rays.set(withDelay(150, withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) })));
    spin.set(withRepeat(withTiming(360, { duration: 16000, easing: Easing.linear }), -1, false));
    // 0.8초 뒤부터 0.5초마다 30px 통통 (위아래 번갈아)
    bounce.set(withDelay(800, withRepeat(withTiming(1, { duration: 500, easing: Easing.bezier(0.3, 0, 0.6, 1) }), -1, true)));
    // 0.95초마다 춤 동작: 처음엔 차례대로, 그다음엔 무작위(같은 동작 연달아 X) · 두 번에 한 번 포즈도 바꿔요
    let k = 0;
    let last: Move | '' = '';
    let iv: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      iv = setInterval(() => {
        let mv: Move = MOVES[k % MOVES.length];
        if (k >= MOVES.length) {
          do mv = pickOne([...MOVES]);
          while (mv === last);
        }
        last = mv;
        k += 1;
        if (k % 2 === 0) setPose(Math.floor(Math.random() * POSES.length));
        setMove({ m: mv, n: k });
        if (mv === 'flip' || mv === 'twirl') sfx('hop');
      }, 950);
    }, 750);
    return () => {
      clearTimeout(start);
      clearInterval(iv);
      cancelAnimation(bounce);
      cancelAnimation(spin);
    };
  }, [still, bounce, rays, spin]);

  const hopStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -30 * bounce.get() }] }));
  const shadowStyle = useAnimatedStyle(() => ({ opacity: 1 - 0.55 * bounce.get(), transform: [{ scaleX: 1 - 0.45 * bounce.get() }] }));
  const raysStyle = useAnimatedStyle(() => ({ opacity: 0.55 * rays.get(), transform: [{ scale: 0.5 + 0.5 * rays.get() }, { rotate: `${spin.get()}deg` }] }));

  return (
    <View style={styles.stage}>
      <Animated.View style={[styles.rays, raysStyle]} pointerEvents="none">
        <Rays big={big} />
      </Animated.View>
      <Animated.View style={[styles.shadow, shadowStyle]}>
        <Svg width={150} height={18}>
          <Ellipse cx={75} cy={9} rx={75} ry={9} fill="rgba(30,26,43,0.14)" />
        </Svg>
      </Animated.View>
      <Animated.View style={hopStyle}>
        <Dancer move={move} pose={pose} still={still} />
      </Animated.View>
    </View>
  );
}

/** 춤 동작 하나 (프로토타입 celIn · dance · mvTwirl · mvFlip · mvWiggle · mvBoing · mvLean 키프레임) */
function Dancer({ move, pose, still }: { move: { m: Move | 'in'; n: number }; pose: number; still: boolean }) {
  const p = useSharedValue(still ? 1 : 0);
  const kind = useSharedValue<number>(0);
  useEffect(() => {
    if (still) return;
    const DUR: Record<Move | 'in', number> = { in: 800, hop: 600, twirl: 800, flip: 850, wiggle: 700, boing: 750, lean: 800 };
    kind.set(['in', ...MOVES].indexOf(move.m));
    p.set(0);
    // 시계는 선형으로 돌리고, 곡선은 danceStyle 에서 키프레임 구간마다 걸어요 (CSS 와 같게)
    p.set(withSequence(withTiming(0, { duration: 0 }), withTiming(1, { duration: DUR[move.m], easing: Easing.linear })));
  }, [move, still, p, kind]);
  const s = useAnimatedStyle(() => danceStyle(kind.get(), p.get()));
  return (
    <Animated.View style={[styles.charBox, s]}>
      <Image source={POSES[pose]} style={pose >= 2 ? styles.charTilt : styles.char} contentFit="contain" />
    </Animated.View>
  );
}

/** 동작마다 구간 곡선 (순서: in, ...MOVES — hop · twirl · flip · wiggle · boing · lean) */
const DANCE_EASE = [
  Easing.bezierFn(0.3, 1.5, 0.5, 1),
  Easing.bezierFn(0.3, 1.4, 0.5, 1),
  Easing.bezierFn(0.3, 1.2, 0.5, 1),
  Easing.bezierFn(0.3, 1.1, 0.5, 1),
  Easing.bezierFn(0.42, 0, 0.58, 1),
  Easing.bezierFn(0.3, 1.6, 0.5, 1),
  Easing.bezierFn(0.3, 1.4, 0.5, 1),
];

function danceStyle(kind: number, t: number) {
  'worklet';
  const pct = t;
  const e = DANCE_EASE[kind] ?? DANCE_EASE[0];
  const kf = (x: number, stops: number[], values: number[]) => kfc(x, stops, values, e);
  if (kind === 0) {
    // celIn: 아래에서 작게 튀어나와 위로 → 착지
    return {
      opacity: kf(pct, [0, 55, 100], [0, 1, 1]),
      transform: [{ translateY: kf(pct, [0, 55, 78, 100], [80, -34, 0, 0]) }, { scaleX: kf(pct, [0, 55, 78, 100], [0.3, 0.92, 1.12, 1]) }, { scaleY: kf(pct, [0, 55, 78, 100], [0.3, 1.12, 0.9, 1]) }],
    };
  }
  if (kind === 1) return { transform: [{ translateY: kf(pct, [0, 40, 100], [0, -20, 0]) }, { scaleX: kf(pct, [0, 40, 100], [1.1, 0.94, 1]) }, { scaleY: kf(pct, [0, 40, 100], [0.9, 1.08, 1]) }] };
  if (kind === 2)
    return {
      transform: [{ translateY: kf(pct, [0, 20, 60, 100], [0, 0, -46, 0]) }, { rotateY: `${kf(pct, [0, 20, 60, 100], [0, 0, 360, 360])}deg` }, { scaleX: kf(pct, [0, 20, 60], [1, 1.1, 1]) }, { scaleY: kf(pct, [0, 20, 60], [1, 0.88, 1]) }],
    };
  if (kind === 3)
    return {
      transform: [{ translateY: kf(pct, [0, 25, 55, 80, 100], [0, 0, -30, 0, 0]) }, { scaleX: kf(pct, [0, 25, 55, 80, 100], [1, 1.28, 0.82, 1.08, 1]) }, { scaleY: kf(pct, [0, 25, 55, 80, 100], [1, 0.7, 1.25, 0.92, 1]) }],
    };
  if (kind === 4) return { transform: [{ rotate: `${kf(pct, [0, 20, 40, 60, 80, 100], [0, -12, 11, -8, 5, 0])}deg` }] };
  if (kind === 5)
    return {
      transform: [
        { translateY: kf(pct, [0, 18, 60, 85, 100], [0, 6, -70, 0, 0]) },
        { rotate: `${kf(pct, [0, 18, 60, 85, 100], [0, 0, -300, -360, -360])}deg` },
        { scaleX: kf(pct, [0, 18, 60, 85, 100], [1, 1.12, 1, 1.08, 1]) },
        { scaleY: kf(pct, [0, 18, 60, 85, 100], [1, 0.86, 1, 0.9, 1]) },
      ],
    };
  return { transform: [{ translateX: kf(pct, [0, 35, 70, 100], [0, -26, 22, 0]) }, { rotate: `${kf(pct, [0, 35, 70, 100], [0, -14, 12, 0])}deg` }] };
}

/** 빛줄기: 노랑 · 분홍 · 보라 10도 줄기가 번갈아 (가운데 · 바깥은 흐리게) — 프로토타입 .cel-rays conic-gradient + mask */
function Rays({ big }: { big: boolean }) {
  const R = 165;
  const wedges: { a: number; c: string; o: number }[] = [];
  for (let base = 0; base < 360; base += 72) {
    if (big) {
      for (let k = 0; k < 3; k++) wedges.push({ a: base + k * 24, c: '#FFFFFF', o: 0.75 });
    } else {
      wedges.push({ a: base, c: '#FFE200', o: 0.55 }, { a: base + 24, c: '#D0798E', o: 0.45 }, { a: base + 48, c: '#493087', o: 0.35 });
    }
  }
  const pt = (deg: number) => {
    const r = ((deg - 90) * Math.PI) / 180;
    return `${R + R * Math.cos(r)} ${R + R * Math.sin(r)}`;
  };
  return (
    <Svg width={R * 2} height={R * 2} viewBox={`0 0 ${R * 2} ${R * 2}`}>
      <Defs>
        <RadialGradient id="rayFade" cx="50%" cy="50%" r="50%">
          <Stop offset="0.25" stopColor="#fff" stopOpacity={0} />
          <Stop offset="0.42" stopColor="#fff" stopOpacity={1} />
          <Stop offset="0.74" stopColor="#fff" stopOpacity={0.5} />
          <Stop offset="1" stopColor="#fff" stopOpacity={0} />
        </RadialGradient>
        <Mask id="rayMask">
          <Rect x={0} y={0} width={R * 2} height={R * 2} fill="url(#rayFade)" />
        </Mask>
      </Defs>
      <G mask="url(#rayMask)">
        {wedges.map((w, i) => (
          <Path key={i} d={`M${R} ${R} L${pt(w.a)} A${R} ${R} 0 0 1 ${pt(w.a + 10)} Z`} fill={w.c} fillOpacity={w.o} />
        ))}
      </G>
    </Svg>
  );
}

type PieceDef = { x: number; y: number; vx: number; vy: number; r: number; vr: number; w: number; h: number; c: string; dot: boolean };
const makePieces = (n: number, width: number, height: number): PieceDef[] =>
  Array.from({ length: n }, () => ({
    x: width / 2 + (Math.random() - 0.5) * 40,
    y: height * 0.42,
    vx: (Math.random() - 0.5) * 13,
    vy: -Math.random() * 15 - 6,
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.4,
    w: 5 + Math.random() * 7,
    h: 3 + Math.random() * 4,
    c: CONFETTI[Math.floor(Math.random() * CONFETTI.length)],
    dot: Math.random() < 0.3,
  }));

/** 컨페티 (브랜드 6색 · 가운데에서 위로 터져 떨어져요 · 약 1.8초) */
function Confetti({ big }: { big: boolean }) {
  const still = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const t = useSharedValue(0);
  const [ps] = useState(() => makePieces(big ? 90 : 56, width, height));
  useEffect(() => {
    if (still) return;
    t.set(withTiming(110, { duration: 1830, easing: Easing.linear }));
  }, [still, t]);
  if (still) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {ps.map((p, i) => (
        <Piece key={i} p={p} t={t} />
      ))}
    </View>
  );
}

function Piece({ p, t }: { p: PieceDef; t: SharedValue<number> }) {
  const s = useAnimatedStyle(() => {
    const n = t.get();
    // 프로토타입: 매 프레임 vy += .9 (화면 2배) · vx *= .985
    const x = p.x + (p.vx * (1 - Math.pow(0.985, n))) / 0.015;
    const y = p.y + p.vy * n + 0.225 * n * n;
    return { opacity: n >= 110 ? 0 : 1, transform: [{ translateX: x - p.w / 2 }, { translateY: y - p.h / 2 }, { rotate: `${p.r + p.vr * n}rad` }] };
  });
  return <Animated.View style={[styles.piece, { width: p.dot ? p.h * 2 : p.w, height: p.dot ? p.h * 2 : p.h, borderRadius: p.dot ? p.h : 0, backgroundColor: p.c }, s]} />;
}

/** 아래에서 살짝 올라오며 나타나요 (.rise · 스프링) */
function Rise({ delay, style, children }: { delay: number; style?: object; children: React.ReactNode }) {
  const still = useReducedMotion();
  const p = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (!still) p.set(withDelay(delay, withTiming(1, { duration: 500, easing: RISE })));
  }, [delay, still, p]);
  const a = useAnimatedStyle(() => ({ opacity: Math.min(1, p.get()), transform: [{ translateY: (1 - p.get()) * 14 }, { scale: 0.97 + 0.03 * p.get() }] }));
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
}

const NUDGE_EASE = Easing.bezierFn(0.42, 0, 0.58, 1);

/** [이어서 하기]가 2.2초 뒤부터 2.4초마다 살짝 들썩 (nextNudge) */
function Nudge({ style, children }: { style?: object; children: React.ReactNode }) {
  const still = useReducedMotion();
  const p = useSharedValue(0);
  useEffect(() => {
    if (still) return;
    p.set(withDelay(2200, withRepeat(withTiming(1, { duration: 2400, easing: Easing.linear }), -1, false)));
    return () => cancelAnimation(p);
  }, [still, p]);
  const a = useAnimatedStyle(() => {
    const v = p.get();
    return { transform: [{ translateY: kfc(v, [0, 70, 80, 90, 100], [0, 0, -4, 0, 0], NUDGE_EASE) }, { scale: kfc(v, [0, 70, 80, 90, 100], [1, 1, 1.02, 1, 1], NUDGE_EASE) }] };
  });
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', paddingHorizontal: 24, backgroundColor: Colors.cream },
  rootBig: { backgroundColor: Colors.yellow },
  flex: { flex: 1, minWidth: 0 },
  stage: { marginTop: 'auto', width: 200, height: 170, alignItems: 'center', justifyContent: 'flex-end' },
  rays: { position: 'absolute', left: 100 - 165, top: 85 - 175, width: 330, height: 330 },
  shadow: { position: 'absolute', bottom: 4, width: 150, height: 18 },
  charBox: { transformOrigin: '50% 100%' },
  char: { width: 170, height: 108 },
  charTilt: { width: 170, height: 124 },
  title: { marginTop: 26, fontFamily: Font.body900, fontSize: 28, lineHeight: 35, letterSpacing: -0.8, textAlign: 'center' },
  sub: { marginTop: 6, fontFamily: Font.body700, fontSize: 13.5, lineHeight: 20, textAlign: 'center' },
  boxesWrap: { marginTop: 24, width: '100%', maxWidth: 330 },
  boxes: { flexDirection: 'row', borderWidth: 2.5, borderColor: Colors.ink, borderRadius: 18, overflow: 'hidden', backgroundColor: Colors.white, boxShadow: '3px 3px 0 #1E1A2B' },
  cb: { flex: 1, minWidth: 0, alignItems: 'center', gap: 7, paddingTop: 14, paddingBottom: 12, paddingHorizontal: 2 },
  cbLine: { borderLeftWidth: 2.5, borderColor: Colors.ink },
  emo: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  cbNum: { fontFamily: Font.display, fontSize: 20, lineHeight: 24, fontVariant: ['tabular-nums'] },
  gauge: { width: '70%', height: 7, borderRadius: 4, overflow: 'hidden' },
  gaugeFill: { height: '100%', borderRadius: 4, transformOrigin: 'left' },
  cbLabel: { fontFamily: Font.body900, fontSize: 12, lineHeight: 16 },
  acts: { marginTop: 'auto', width: '100%', flexDirection: 'row', alignItems: 'center', gap: 10 },
  home: { width: 54, height: 59, borderRadius: 27, borderWidth: 2.5, borderColor: Colors.ink, borderBottomWidth: 7.5, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  next: { height: 59, borderRadius: 28, borderWidth: 2.5, borderColor: Colors.ink, borderBottomWidth: 7.5, backgroundColor: Colors.yellow, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  nextBig: { backgroundColor: Colors.white },
  down: { borderBottomWidth: 2.5, marginTop: 5 },
  nextText: { fontFamily: Font.body900, fontSize: 16, lineHeight: 21 },
  nextPts: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: Colors.ink },
  nextPtsText: { fontFamily: Font.display, fontSize: 13, lineHeight: 17 },
  piece: { position: 'absolute', left: 0, top: 0, borderWidth: 1, borderColor: Colors.ink },
});
