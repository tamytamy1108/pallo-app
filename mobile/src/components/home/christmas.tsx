import { useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { css } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Pattern, Rect, Stop } from 'react-native-svg';

import { XMAS } from '@/constants/season';
import { useStill } from '@/lib/motion';

import { useDecoOnScreen } from './deco-on-screen';

/*
 * 크리스마스 스터디 맵 장식 (프로토타입 renderSeason 의 xmas · E 종이 컷아웃).
 * 바탕 → 반짝이는 별 · 떨어지는 장식 → 아래 종이 숲 · 눈 언덕 은 맵 내용 뒤에,
 * 전구 가랜드는 카드 맨 위 내용 앞에 깔려요.
 */

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const PW = { stroke: XMAS.paper, strokeWidth: 1.6, strokeLinejoin: 'round' as const };

/* ───────── 떨어지는 종이 장식 모양 ───────── */

type Shape =
  | { kind: 'ball'; c: string }
  | { kind: 'gift'; c: string; r: string }
  | { kind: 'star'; c: string }
  | { kind: 'cane' }
  | { kind: 'holly' }
  | { kind: 'flake'; c: string };

// 빨간색이 많이 나오게 (프로토타입 SFX_STY.e.xmas 와 같은 비율)
const SHAPES: Shape[] = [
  { kind: 'ball', c: '#E5414B' },
  { kind: 'ball', c: '#E5414B' },
  { kind: 'ball', c: '#D8303C' },
  { kind: 'ball', c: '#F0565E' },
  { kind: 'gift', c: '#E5414B', r: '#FFD23F' },
  { kind: 'gift', c: '#D8303C', r: '#FFFDF7' },
  { kind: 'gift', c: '#E5414B', r: '#3FA65A' },
  { kind: 'cane' },
  { kind: 'cane' },
  { kind: 'holly' },
  { kind: 'holly' },
  { kind: 'star', c: '#E5414B' },
  { kind: 'star', c: '#FFD23F' },
  { kind: 'ball', c: '#3FA65A' },
  { kind: 'gift', c: '#3FA65A', r: '#E5414B' },
  { kind: 'flake', c: '#B7D5F2' },
];

const CANE = 'M9 22 V8 a4 4 0 0 1 8 0 v1.5';
const FLAKE_ARM = 'M12 2 V22 M12 5.5 L9.5 3.3 M12 5.5 L14.5 3.3 M12 18.5 L9.5 20.7 M12 18.5 L14.5 20.7';

function PaperShape({ shape, size }: { shape: Shape; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {shape.kind === 'ball' && (
        <>
          <Rect x={9.5} y={2.5} width={5} height={3.6} rx={1} fill="#E8C24A" {...PW} />
          <Circle cx={12} cy={14} r={8} fill={shape.c} {...PW} />
          <Path d="M5.5 12.5 Q12 15.5 18.5 12.5" fill="none" stroke={XMAS.paper} strokeWidth={1.4} opacity={0.85} />
          <Circle cx={9} cy={10.6} r={1.4} fill="#fff" opacity={0.7} />
        </>
      )}
      {shape.kind === 'gift' && (
        <>
          <Rect x={3.5} y={9} width={17} height={12} rx={1.6} fill={shape.c} {...PW} />
          <Rect x={2.5} y={6.5} width={19} height={4} rx={1.2} fill={shape.c} {...PW} />
          <Path d="M12 6.5 V21" stroke={shape.r} strokeWidth={2.6} />
          <Path d="M12 6.5 C9 2 5.5 4 8 6.5 Z M12 6.5 C15 2 18.5 4 16 6.5 Z" fill={shape.r} {...PW} />
        </>
      )}
      {shape.kind === 'star' && <Path d="M12 1.8l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 16.9l-6 3.3 1.3-6.7-5-4.7 6.8-.8z" fill={shape.c} {...PW} />}
      {shape.kind === 'cane' && (
        <>
          <Path d={CANE} fill="none" stroke={XMAS.paper} strokeWidth={6} strokeLinecap="round" />
          <Path d={CANE} fill="none" stroke="#E5414B" strokeWidth={3.6} strokeLinecap="round" />
          <Path d={CANE} fill="none" stroke={XMAS.paper} strokeWidth={3.6} strokeDasharray="2 2.6" />
        </>
      )}
      {shape.kind === 'holly' && (
        <>
          <Path d="M12 13 C9 8 4 8 2.5 9.5 C4 10.5 3.5 12 2.6 13 C4.5 13.6 5 15.5 4.6 16.8 C7.5 16 10 15.5 12 13 Z" fill="#3FA65A" {...PW} />
          <Path d="M12 13 C15 8 20 8 21.5 9.5 C20 10.5 20.5 12 21.4 13 C19.5 13.6 19 15.5 19.4 16.8 C16.5 16 14 15.5 12 13 Z" fill="#5BBE6E" {...PW} />
          <Circle cx={10.4} cy={13.6} r={2.3} fill="#E5414B" {...PW} />
          <Circle cx={13.6} cy={13.6} r={2.3} fill="#E5414B" {...PW} />
          <Circle cx={12} cy={11} r={2.3} fill="#F0565E" {...PW} />
        </>
      )}
      {shape.kind === 'flake' &&
        [XMAS.paper, shape.c].map((stroke, layer) => (
          <G key={layer} stroke={stroke} strokeWidth={layer ? 2.2 : 4.2} strokeLinecap="round" fill="none">
            {[0, 60, 120].map((r) => (
              <Path key={r} d={FLAKE_ARM} transform={`rotate(${r} 12 12)`} />
            ))}
          </G>
        ))}
    </Svg>
  );
}

/* ───────── 바탕: 짙은 초록 그라데이션 + 눈 점 ───────── */

function XmasBackground({ width, height }: { width: number; height: number }) {
  // 웹에서는 크기를 직접 줘야 바탕이 카드 전체에 깔려요
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id="xmGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={XMAS.top} />
          <Stop offset="0.45" stopColor={XMAS.mid} />
          <Stop offset="1" stopColor={XMAS.bottom} />
        </LinearGradient>
        <Pattern id="xmDotsBig" width={26} height={26} patternUnits="userSpaceOnUse">
          <Circle cx={13} cy={13} r={1.4} fill="#fff" fillOpacity={0.16} />
        </Pattern>
        <Pattern id="xmDotsSmall" x={6} y={9} width={13} height={13} patternUnits="userSpaceOnUse">
          <Circle cx={6.5} cy={6.5} r={1.1} fill="#fff" fillOpacity={0.08} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#xmGrad)" />
      <Rect width="100%" height="100%" fill="url(#xmDotsBig)" />
      <Rect width="100%" height="100%" fill="url(#xmDotsSmall)" />
    </Svg>
  );
}

/* ───────── 움직임 ───────── */

type Falling = { shape: Shape; left: number; size: number; dur: number; phase: number; sway: number; swayDelay: number };
type Star = { x: number; y: number; size: number; dur: number; delay: number; gold: boolean };

// 프로토타입 @keyframes sway — 좌우로 흔들리며 기울어요 (alternate · ease-in-out)
const swayKf = css.keyframes({
  from: { transform: [{ translateX: -18 }, { rotate: '-35deg' }] },
  to: { transform: [{ translateX: 18 }, { rotate: '45deg' }] },
});

/**
 * 위에서 아래로 떨어지면서 좌우로 흔들려요 (fall + sway).
 * CSS 애니메이션이라 브라우저 · 화면 스레드가 직접 그려요 (장식이 30개여도 끊기지 않게).
 * 처음엔 음수 delay 로 중간부터 시작해서 카드가 이미 장식으로 차 있어요.
 */
function FallingPiece({ p, height, still }: { p: Falling; height: number; still: boolean }) {
  const fall = useMemo(
    () => css.keyframes({ from: { transform: [{ translateY: -60 }] }, to: { transform: [{ translateY: height + 60 }] } }),
    [height],
  );
  const fallAnim = still
    ? {}
    : { animationName: fall, animationDuration: `${Math.round(p.dur)}ms`, animationDelay: `-${Math.round(p.dur * p.phase)}ms`, animationIterationCount: 'infinite' as const, animationTimingFunction: 'linear' as const };
  const swayAnim = still
    ? {}
    : {
        animationName: swayKf,
        animationDuration: `${Math.round(p.sway)}ms`,
        animationDelay: `${Math.round(p.swayDelay)}ms`,
        animationIterationCount: 'infinite' as const,
        animationDirection: 'alternate' as const,
        animationTimingFunction: 'ease-in-out' as const,
      };
  return (
    <Animated.View style={[styles.piece, { left: `${p.left}%`, width: p.size, height: p.size }, fallAnim]}>
      <Animated.View style={swayAnim}>
        <PaperShape shape={p.shape} size={p.size} />
      </Animated.View>
    </Animated.View>
  );
}

/** 밝아졌다 어두워졌다 하는 반짝이 (CSS 애니메이션) */
function Twinkle({ dur, delay, low, children, style, still }: { dur: number; delay: number; low: number; children: React.ReactNode; style: object; still: boolean }) {
  const kf = useMemo(() => css.keyframes({ from: { opacity: low }, to: { opacity: 1 } }), [low]);
  const anim = still
    ? {}
    : {
        animationName: kf,
        animationDuration: `${Math.round(dur / 2)}ms`,
        animationDelay: `${Math.round(delay)}ms`,
        animationIterationCount: 'infinite' as const,
        animationDirection: 'alternate' as const,
        animationTimingFunction: 'ease-in-out' as const,
        opacity: low,
      };
  return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}

function StarShape({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 1 C12.8 8 16 11.2 23 12 C16 12.8 12.8 16 12 23 C11.2 16 8 12.8 1 12 C8 11.2 11.2 8 12 1 Z" fill={color} />
    </Svg>
  );
}

/* ───────── 아래: 종이 숲 + 눈 언덕 ───────── */

function tree(x: number, w: number, h: number, c: string) {
  const d = `M${w / 2} 0 L${w * 0.82} ${h * 0.36} L${w * 0.66} ${h * 0.36} L${w} ${h * 0.72} L${w * 0.58} ${h * 0.72} L${w * 0.58} ${h} L${w * 0.42} ${h} L${w * 0.42} ${h * 0.72} L0 ${h * 0.72} L${w * 0.34} ${h * 0.36} L${w * 0.18} ${h * 0.36} Z`;
  const trim = `M${w * 0.28} ${h * 0.34} L${w * 0.72} ${h * 0.34} M${w * 0.14} ${h * 0.7} L${w * 0.86} ${h * 0.7}`;
  return (
    <G key={x} transform={`translate(${x} ${130 - h})`}>
      <Path d={d} fill={c} stroke={XMAS.paper} strokeWidth={2} strokeLinejoin="round" />
      <Path d={trim} stroke={XMAS.paper} strokeWidth={3} strokeLinecap="round" />
    </G>
  );
}

const FOREST: [number, number, number, string][] = [
  [-6, 44, 82, '#2E7A55'],
  [26, 36, 64, '#3C9A68'],
  [58, 50, 96, '#2A6E4D'],
  [262, 42, 76, '#3C9A68'],
  [292, 54, 104, '#2E7A55'],
  [334, 38, 66, '#2A6E4D'],
];

function SnowForest() {
  return (
    <View style={styles.drift} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 370 130" preserveAspectRatio="xMidYMax slice">
        {FOREST.map((t) => tree(...t))}
        <Path d="M0 98 Q40 78 92 94 T190 90 T290 88 T370 94 V130 H0 Z" fill="#FFFFFF" stroke="#DCE7F3" strokeWidth={2} />
        <Path d="M0 112 Q60 98 128 110 T260 106 T370 110 V130 H0 Z" fill="#EAF2FB" />
      </Svg>
    </View>
  );
}

/* ───────── 카드에 까는 두 겹 ───────── */

/** 맵 내용 뒤: 바탕 · 별 · 떨어지는 장식 · 숲 */
export function XmasBackLayer() {
  // 움직임 줄이기 · 다른 화면 · 카드가 스크롤로 화면 밖이면 멈춰요
  const onScreen = useDecoOnScreen();
  const still = useStill() || !onScreen;
  const [{ width, height }, setSize] = useState({ width: 0, height: 0 });
  const [pieces] = useState<Falling[]>(() =>
    Array.from({ length: 30 }, () => {
      const dur = rnd(12000, 18000);
      return {
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        left: rnd(2, 92),
        size: Math.round(rnd(18, 28)),
        dur,
        phase: Math.random(),
        sway: rnd(1800, 3200),
        swayDelay: rnd(0, 1600),
      };
    }),
  );
  const [stars] = useState<Star[]>(() =>
    Array.from({ length: 16 }, (_, k) => ({ x: rnd(3, 94), y: rnd(2, 96), size: Math.round(rnd(7, 13)), dur: rnd(1600, 3000), delay: rnd(0, 3000), gold: k % 3 === 0 })),
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={(e: LayoutChangeEvent) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}>
      {width > 0 && <XmasBackground width={width} height={height} />}
      {stars.map((s, k) => (
        <Twinkle key={k} dur={s.dur} delay={s.delay} low={0.25} still={still} style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%` }}>
          <StarShape size={s.size} color={s.gold ? XMAS.gold : '#FFF3C4'} />
        </Twinkle>
      ))}
      <SnowForest />
      {/* 움직임 줄이기를 켠 사람에게는 떨어지는 장식을 안 보여 줘요 */}
      {height > 0 && !still && pieces.map((p, k) => <FallingPiece key={k} p={p} height={height} still={still} />)}
    </View>
  );
}

const BULB_COLORS = ['#E5414B', '#FFD23F', '#3FA65A', '#5B8FE0', '#F7A9C0'];
const BULBS = 13;
const BULB_W = 14;
const BULB_H = 18;
const GARLAND_H = 40;

/** 카드 맨 위 전구 가랜드 (깜빡여요) */
export function XmasGarland() {
  // 움직임 줄이기 · 다른 화면 · 카드가 스크롤로 화면 밖이면 멈춰요
  const onScreen = useDecoOnScreen();
  const still = useStill() || !onScreen;
  const [width, setWidth] = useState(0);
  const sx = width / 100;
  const sy = GARLAND_H / 30;
  let wire = 'M0 4';
  for (let k = 0; k < BULBS; k++) {
    const x1 = ((k + 1) * 100) / BULBS;
    const xm = ((k + 0.5) * 100) / BULBS;
    wire += ` Q${xm.toFixed(2)} 22 ${x1.toFixed(2)} 4`;
  }

  return (
    <View style={styles.garland} pointerEvents="none" onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <>
          <Svg width={width} height={GARLAND_H} viewBox="0 0 100 30" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
            <Path d={wire} fill="none" stroke="#3E7D4E" strokeWidth={1.1} vectorEffect="non-scaling-stroke" />
          </Svg>
          {Array.from({ length: BULBS }, (_, k) => {
            const bx = ((k + 0.5) * 100) / BULBS;
            return (
              <Twinkle
                key={k}
                dur={1600}
                delay={1600 - ((k * 370) % 1600)}
                low={0.35}
                still={still}
                style={{ position: 'absolute', left: bx * sx - BULB_W / 2, top: 12 * sy, width: BULB_W, height: BULB_H }}>
                {/* 늘리지 않은 픽셀 좌표로 그려야 전구가 매끈하게 둥글어요 */}
                <Svg width={BULB_W} height={BULB_H} viewBox={`0 0 ${BULB_W} ${BULB_H}`}>
                  <Rect x={BULB_W / 2 - 2.4} y={0} width={4.8} height={4.4} rx={1.2} fill="#5C5470" />
                  <Ellipse cx={BULB_W / 2} cy={10.6} rx={5.9} ry={6.6} fill={BULB_COLORS[k % BULB_COLORS.length]} stroke={XMAS.paper} strokeWidth={1.2} />
                </Svg>
              </Twinkle>
            );
          })}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: { position: 'absolute', top: 0 },
  drift: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 130 },
  garland: { position: 'absolute', left: 0, right: 0, top: -4, height: GARLAND_H },
});
