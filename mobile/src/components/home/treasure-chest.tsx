import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { css, cubicBezier } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { Colors } from '@/constants/theme';

/** 그림 원본 크기 (viewBox 0 0 120 106) */
export const CHEST_RATIO = 106 / 120;

type Palette = { b: string; d: string; l: string; ld: string; s: string; k: string; g: string; inner: string; floor: string };
const READY: Palette = { b: '#5B3BC4', d: '#4A2FA6', l: '#7B5CE6', ld: '#6847D6', s: Colors.yellow, k: Colors.ink, g: '#FF7FB2', inner: '#2B1C5C', floor: Colors.ink };
const LOCKED: Palette = { b: '#E4DED2', d: '#DAD3C5', l: '#EFEAE0', ld: '#E6E0D4', s: '#D6CFC0', k: '#9A93A6', g: '#E4DED2', inner: '#CFC8BA', floor: '#CFC8BA' };

/**
 * 보상 상자 (보석함) — 홈 맵과 챕터 완료 보상 화면이 같은 그림을 써요 (prototype chestSVG).
 * 다섯 겹: 뒤(그림자 · 안쪽) · 보물(동전 · 보석) · 앞판 · 뚜껑 · 자물쇠. 열리면 뚜껑이 들리고 자물쇠가 떨어지고 보물이 보여요.
 * animated: 열릴 때 뚜껑 · 자물쇠가 움직여요 (보상 화면). 맵은 그냥 열린 모습.
 * lidLoop: 뚜껑에 얹을 반복 움직임 (맵의 '열 수 있어요' 들썩).
 */
export function TreasureChest({ width, locked = false, open = false, animated = false, lidLoop }: { width: number; locked?: boolean; open?: boolean; animated?: boolean; lidLoop?: object | null }) {
  const c = locked ? LOCKED : READY;
  const height = width * CHEST_RATIO;
  const lidOpen = open ? [{ translateX: -width * 0.05 }, { translateY: -height * 0.22 }, { rotate: '-14deg' }] : [{ translateX: 0 }, { translateY: 0 }, { rotate: '0deg' }];
  const lockDrop = open ? [{ translateY: height * 0.3 }, { rotate: '24deg' }] : [{ translateY: 0 }, { rotate: '0deg' }];
  return (
    <View style={{ width, height }}>
      <Layer>
        <Rect x={15} y={56} width={96} height={48} rx={11} fill={c.floor} />
        <Rect x={15} y={40} width={90} height={22} rx={8} fill={c.inner} stroke={c.k} strokeWidth={2.5} />
      </Layer>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: open ? 1 : 0 }, animated && fadeEaseCss]}>
        <Layer>
          <Ellipse cx={60} cy={50} rx={40} ry={9} fill={Colors.yellow} opacity={0.55} />
          <G stroke={c.k} strokeWidth={2}>
            <Circle cx={34} cy={51} r={6} fill={Colors.yellow} />
            <Circle cx={47} cy={47} r={6.5} fill={Colors.yellow} />
            <Path d="M60 36L67 43L60 51L53 43Z" fill="#8FD3FF" strokeLinejoin="round" />
            <Circle cx={74} cy={48} r={6.5} fill={Colors.yellow} />
            <Circle cx={87} cy={51} r={6} fill={Colors.yellow} />
          </G>
          <Path d="M45 44.5l2-1.5M72 45.5l2-1.5" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" />
        </Layer>
      </Animated.View>
      <Layer>
        <Rect x={12} y={52} width={96} height={48} rx={11} fill={c.b} stroke={c.k} strokeWidth={2.5} />
        <Path d="M13.3 82H106.7V89A9.7 9.7 0 0 1 97 98.7H23A9.7 9.7 0 0 1 13.3 89Z" fill={c.d} />
        <Path d="M14 70H106" stroke={c.k} strokeOpacity={0.18} strokeWidth={2} />
        <Path d="M19 59h7" stroke="#fff" strokeOpacity={0.35} strokeWidth={3} strokeLinecap="round" />
        <Rect x={27} y={52} width={11} height={48} fill={c.s} stroke={c.k} strokeWidth={2.2} />
        <Rect x={82} y={52} width={11} height={48} fill={c.s} stroke={c.k} strokeWidth={2.2} />
        <Path d="M29.5 55v42M84.5 55v42" stroke="#fff" strokeOpacity={0.55} strokeWidth={2} />
        <G fill={c.k}>
          <Circle cx={32.5} cy={61} r={1.7} />
          <Circle cx={32.5} cy={91} r={1.7} />
          <Circle cx={87.5} cy={61} r={1.7} />
          <Circle cx={87.5} cy={91} r={1.7} />
        </G>
      </Layer>
      {/* 뚜껑: 경첩은 왼쪽 테두리 끝 (7% 50%) */}
      <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: '7% 50%', transform: lidOpen }, animated && lidEaseCss]}>
        <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: '50% 52%' }, lidLoop]}>
          <Layer>
            <Path d="M12 54V38C12 22 30 13 60 13S108 22 108 38V54Z" fill={c.l} stroke={c.k} strokeWidth={2.5} strokeLinejoin="round" />
            <Path d="M13.3 46H106.7V52.7H13.3Z" fill={c.ld} />
            <Path d="M27 54V20.4C30.4 19 34 17.9 38 17.1V54Z M82 54V17.1C86 17.9 89.6 19 93 20.4V54Z" fill={c.s} stroke={c.k} strokeWidth={2.2} strokeLinejoin="round" />
            <Path d="M44 22c5-2 11-3 18-3" stroke="#fff" strokeOpacity={0.7} strokeWidth={4} strokeLinecap="round" fill="none" />
            <Rect x={8} y={48} width={104} height={10} rx={5} fill={c.s} stroke={c.k} strokeWidth={2.5} />
            <Path d="M14 51.5h30" stroke="#fff" strokeOpacity={0.6} strokeWidth={2} strokeLinecap="round" />
            <Path d="M60 25L69.5 33.5L60 45L50.5 33.5Z" fill={c.g} stroke={c.k} strokeWidth={2.2} strokeLinejoin="round" />
            <Path d="M50.5 33.5H69.5M55 29.3L60 33.5L65 29.3M60 33.5V45" stroke={c.k} strokeOpacity={0.45} strokeWidth={1.3} fill="none" />
            <Path d="M55.5 30.5l2.2-2" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
          </Layer>
        </Animated.View>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: '50% 60%', opacity: open ? 0 : 1, transform: lockDrop }, animated && lockEaseCss]}>
        <Layer>
          <Path d="M50 54H70V66C70 71 65.5 74 60 76C54.5 74 50 71 50 66Z" fill={c.s} stroke={c.k} strokeWidth={2.5} strokeLinejoin="round" />
          <Circle cx={60} cy={61.5} r={2.8} fill={c.k} />
          <Path d="M60 63v5" stroke={c.k} strokeWidth={2.8} strokeLinecap="round" />
        </Layer>
      </Animated.View>
    </View>
  );
}

function Layer({ children }: { children: ReactNode }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 120 106" style={StyleSheet.absoluteFill}>
      {children}
    </Svg>
  );
}

const lidEaseCss = css.create({ t: { transitionProperty: 'transform', transitionDuration: '600ms', transitionTimingFunction: cubicBezier(0.34, 1.35, 0.5, 1) } }).t;
const lockEaseCss = css.create({ t: { transitionProperty: ['transform', 'opacity'], transitionDuration: ['350ms', '300ms'], transitionTimingFunction: 'ease-in' } }).t;
const fadeEaseCss = css.create({ t: { transitionProperty: 'opacity', transitionDuration: '300ms', transitionDelay: '100ms' } }).t;
