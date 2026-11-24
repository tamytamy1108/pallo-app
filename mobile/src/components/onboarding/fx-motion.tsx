import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';

import { kf, kfc, useLoop } from '@/lib/motion';

/*
 * 가입 화면 움직임 부품 (fx-). 모두 UI 스레드에서 돌고, 움직임 줄이기를 켜면 가만히 있어요.
 * 처음 그릴 때가 아니라 '값이 바뀐 순간'에만 한 번씩 움직여요 (다시 그려질 때마다 움직이지 않게).
 */

/** 한 번 움직이는 곡선 (구간마다 따로 거는 곡선 · kfc) */
export const OUT = Easing.bezierFn(0.16, 1, 0.3, 1);
export const POP = Easing.bezierFn(0.3, 1.6, 0.5, 1);

/**
 * trigger 가 바뀔 때마다 0 → 1 을 한 번 돌려요. 쉬는 동안은 1 (= 다 움직인 뒤 모양).
 * fire 가 false 면 바뀌어도 건너뛰어요 (예: 체크가 꺼질 때는 안 튀게). onMount 면 처음 나타날 때도 한 번.
 */
export function usePulse(trigger: unknown, { duration, delay = 0, fire = true, onMount = false }: { duration: number; delay?: number; fire?: boolean; onMount?: boolean }) {
  const still = useReducedMotion();
  const p = useSharedValue(onMount && !still ? 0 : 1);
  // 앞의 값과 견줘서 바뀐 때만 (StrictMode 에서 효과가 두 번 돌아도 한 번만)
  const prev = useRef<{ v: unknown } | null>(onMount ? null : { v: trigger });
  useEffect(() => {
    if (prev.current && Object.is(prev.current.v, trigger)) return;
    prev.current = { v: trigger };
    if (still || !fire) {
      p.set(1);
      return;
    }
    p.set(withSequence(withTiming(0, { duration: 0 }), withDelay(delay, withTiming(1, { duration, easing: Easing.linear }))));
  }, [trigger, fire, still, duration, delay, p]);
  return p;
}

/** 튀어 오르기: 바뀐 순간 살짝 줄었다가 넘치게 커지고 제자리로 (scale) */
export function Pop({ trigger, fire, peak = 1.18, duration = 460, style, children }: { trigger: unknown; fire?: boolean; peak?: number; duration?: number; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const p = usePulse(trigger, { duration, fire });
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: kfc(p.get(), [0, 22, 60, 100], [1, 0.82, peak, 1], OUT) }] }));
  return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}

/** 한 번 갸웃 흔들기 (인사말 글자) */
export function Wiggle({ trigger, fire, style, children }: { trigger: unknown; fire?: boolean; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const p = usePulse(trigger, { duration: 560, fire });
  const anim = useAnimatedStyle(() => {
    const t = p.get();
    return {
      transform: [{ rotate: `${kf(t, [0, 18, 40, 62, 82, 100], [0, -9, 7, -4, 2, 0])}deg` }, { scale: kf(t, [0, 18, 100], [1, 1.12, 1]) }],
    };
  });
  return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}

/** 둥실 떠 있기: 위아래로 천천히 (팔로로 · 장식). phase 로 여럿이 엇갈려요 */
export function Bob({ amp = 6, ms = 2600, tilt = 0, delay = 0, style, children }: { amp?: number; ms?: number; tilt?: number; delay?: number; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const t = useLoop(ms, { delay });
  const anim = useAnimatedStyle(() => {
    const s = Math.sin(t.get() * Math.PI * 2);
    return { transform: [{ translateY: -amp * (0.5 - 0.5 * Math.cos(t.get() * Math.PI * 2)) }, { rotate: `${tilt * s}deg` }] };
  });
  return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}

/**
 * 화면에 들어올 때 차례로 올라오는 시각 (OnbScreen 이 정해 줘요).
 * 자기 안을 하나씩 따로 올리는 부품(카드 격자 등)이 이 값부터 이어서 써요.
 */
export const EntranceDelay = createContext(0);
export const useEntranceDelay = () => useContext(EntranceDelay);
