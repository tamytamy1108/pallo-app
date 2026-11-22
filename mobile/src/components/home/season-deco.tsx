import { useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { css, useReducedMotion } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import type { Season } from '@/constants/season';

/*
 * 봄 · 여름 · 가을 · 겨울 스터디 맵 장식 (프로토타입 renderSeason · SFXK 'e' 종이 컷아웃 · SFX_STY.e).
 * 맵 내용 뒤에서 위 → 아래로 떨어지며 좌우로 뒤집혀요 (fall + sfFlip). 터치는 막지 않아요.
 * 크리스마스(11.22 ~ 12.31)는 christmas.tsx 가 그려요.
 */

type Plain = Exclude<Season, 'xmas'>;

const PAPER = '#FFFDF7';
const PW = { stroke: PAPER, strokeWidth: 1.6, strokeLinejoin: 'round' as const };

const D_PETAL = 'M12 5 L10.4 2 C5.6 4.4 3.4 11 6.8 17.6 C9 21.8 15 21.8 17.2 17.6 C20.6 11 18.4 4.4 13.6 2 Z';
const D_LEAF = 'M12 1.5 C19 6 20.5 15 12 22.5 C3.5 15 5 6 12 1.5 Z';
const D_MAPLE =
  'M12 1.2l1.6 3.8 2.3-1.3-.45 4.15 3.6-1.85-.8 3.05 3.8.15-2.75 2.9 1.45 1.2-4.3 2.3.85 2.2-4.6-.9-.3 5.3h-.8l-.3-5.3-4.6.9.85-2.2-4.3-2.3 1.45-1.2-2.75-2.9 3.8-.15-.8-3.05 3.6 1.85-.45-4.15 2.3 1.3z';
const D_GINKGO = 'M12 14 C4 13.5 1.5 7 4.5 3 C7.5 5 10 4.2 12 2.2 C14 4.2 16.5 5 19.5 3 C22.5 7 20 13.5 12 14 Z';
const FLAKE_ARM = 'M12 2 V22 M12 5.5 L9.5 3.3 M12 5.5 L14.5 3.3 M12 18.5 L9.5 20.7 M12 18.5 L14.5 20.7';

type Shape = { kind: 'paper'; d: string; c: string; vein?: boolean } | { kind: 'blossom'; c: string } | { kind: 'flake'; c: string };

/** 계절마다 고르는 모양 (프로토타입 SFX_STY.e) — 데이터 한 줄로 늘릴 수 있어요 */
const SHAPES: Record<Plain, Shape[]> = {
  spring: [
    { kind: 'paper', d: D_PETAL, c: '#F59BB6' },
    { kind: 'paper', d: D_PETAL, c: '#F8BFD0' },
    { kind: 'blossom', c: '#F7A9C0' },
  ],
  summer: [
    { kind: 'paper', d: D_LEAF, c: '#7CCB6B', vein: true },
    { kind: 'paper', d: D_LEAF, c: '#A9DC74', vein: true },
  ],
  autumn: [
    { kind: 'paper', d: D_MAPLE, c: '#EF7B3C' },
    { kind: 'paper', d: D_MAPLE, c: '#E0503F' },
    { kind: 'paper', d: D_GINKGO, c: '#F3BC2E' },
  ],
  winter: [
    { kind: 'flake', c: '#8FBFEA' },
    { kind: 'flake', c: '#B7D5F2' },
  ],
};

function PaperShape({ shape, size }: { shape: Shape; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {shape.kind === 'paper' && (
        <>
          <Path d={shape.d} fill={shape.c} {...PW} />
          {shape.vein && <Path d="M12 4 V20" stroke={PAPER} strokeWidth={1} />}
        </>
      )}
      {shape.kind === 'blossom' && (
        <>
          <G fill={shape.c} stroke={PAPER} strokeWidth={1.4}>
            {[0, 72, 144, 216, 288].map((r) => (
              <Ellipse key={r} cx={12} cy={6.6} rx={3.5} ry={4.9} transform={`rotate(${r} 12 12)`} />
            ))}
          </G>
          <Circle cx={12} cy={12} r={2.3} fill="#FFE27A" stroke={PAPER} strokeWidth={1} />
        </>
      )}
      {shape.kind === 'flake' &&
        [PAPER, shape.c].map((stroke, layer) => (
          <G key={layer} stroke={stroke} strokeWidth={layer ? 2.2 : 4.2} strokeLinecap="round" fill="none">
            {[0, 60, 120].map((r) => (
              <Path key={r} d={FLAKE_ARM} transform={`rotate(${r} 12 12)`} />
            ))}
          </G>
        ))}
    </Svg>
  );
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

/** sfFlip: 좌우로 흔들리며 종이가 뒤집혀요 (perspective 200px · alternate · ease-in-out) */
const flipKf = css.keyframes({
  '0%': { transform: [{ perspective: 200 }, { translateX: -12 }, { rotate: '-20deg' }, { rotateY: '0deg' }] },
  '50%': { transform: [{ perspective: 200 }, { translateX: 2 }, { rotate: '10deg' }, { rotateY: '90deg' }] },
  '100%': { transform: [{ perspective: 200 }, { translateX: 14 }, { rotate: '40deg' }, { rotateY: '180deg' }] },
});

type Piece = { shape: Shape; left: number; size: number; dur: number; phase: number; flip: number };

function Falling({ p, height }: { p: Piece; height: number }) {
  // fall: 카드 위 60px 에서 카드 아래(카드 높이 + 60)까지
  const fall = useMemo(() => css.keyframes({ from: { transform: [{ translateY: -60 }] }, to: { transform: [{ translateY: height + 60 }] } }), [height]);
  return (
    <Animated.View
      style={[
        styles.piece,
        { left: `${p.left}%`, width: p.size, height: p.size },
        { animationName: fall, animationDuration: `${Math.round(p.dur)}ms`, animationDelay: `-${Math.round(p.dur * p.phase)}ms`, animationIterationCount: 'infinite', animationTimingFunction: 'linear' },
      ]}>
      <Animated.View
        style={[
          styles.shadow,
          { animationName: flipKf, animationDuration: `${Math.round(p.flip)}ms`, animationIterationCount: 'infinite', animationDirection: 'alternate', animationTimingFunction: 'ease-in-out' },
        ]}>
        <PaperShape shape={p.shape} size={p.size} />
      </Animated.View>
    </Animated.View>
  );
}

/** 맵 카드 뒤에 까는 계절 장식 (24개 · 18~28px · 12~18초에 한 번 떨어져요) */
export function SeasonLayer({ season }: { season: Plain }) {
  const still = useReducedMotion();
  const [height, setHeight] = useState(0);
  const [pieces] = useState<Piece[]>(() =>
    Array.from({ length: 24 }, () => {
      const list = SHAPES[season];
      return { shape: list[Math.floor(Math.random() * list.length)], left: rnd(2, 92), size: Math.round(rnd(18, 28)), dur: rnd(12000, 18000), phase: Math.random(), flip: rnd(1800, 3200) };
    }),
  );
  // 움직임 줄이기를 켠 사람에게는 떨어지는 장식을 안 보여 줘요
  if (still) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={(e: LayoutChangeEvent) => setHeight(e.nativeEvent.layout.height)}>
      {height > 0 && pieces.map((p, k) => <Falling key={k} p={p} height={height} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: { position: 'absolute', top: 0 },
  // drop-shadow(0 3px 2px rgba(80,60,30,.22)) — 종이가 살짝 떠 보이게
  shadow: { filter: [{ dropShadow: { offsetX: 0, offsetY: 3, standardDeviation: 2, color: 'rgba(80,60,30,0.22)' } }] },
});
