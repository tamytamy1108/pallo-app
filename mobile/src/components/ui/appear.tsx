import { type ReactNode, useEffect } from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming, Easing } from 'react-native-reanimated';

import { APPEAR, appearStyle, type AppearKind } from '@/lib/motion';

/**
 * 처음 나타날 때 한 번 움직여요 (프로토타입 .rise · shIn · shUp · tkRise · reactHop · reactWord).
 * 움직임 줄이기를 켠 사람에게는 바로 보여요.
 */
export function Appear({
  kind,
  delay = 0,
  style,
  onLayout,
  children,
}: {
  kind: AppearKind;
  delay?: number;
  style?: StyleProp<ViewStyle>;
  onLayout?: (e: LayoutChangeEvent) => void;
  children: ReactNode;
}) {
  const still = useReducedMotion();
  const k = APPEAR[kind];
  const p = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (still) return;
    p.set(withDelay(delay, withTiming(1, { duration: k.duration, easing: Easing.linear })));
  }, [delay, k.duration, still, p]);
  const anim = useAnimatedStyle(() => appearStyle(k, p.get()));
  return (
    <Animated.View onLayout={onLayout} style={[style, 'origin' in k && k.origin === 'bottom' ? { transformOrigin: 'center bottom' } : null, anim]}>
      {children}
    </Animated.View>
  );
}
