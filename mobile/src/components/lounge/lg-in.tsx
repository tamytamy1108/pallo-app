import { type ReactNode, useEffect } from 'react';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { EASE } from '@/lib/motion';

/** 피드 카드가 처음 나타날 때 (프로토타입 .lg-feed > * · lgIn .45s: 아래 10px 에서 올라오며) */
export function LgIn({ delay = 0, children }: { delay?: number; children: ReactNode }) {
  const still = useReducedMotion();
  const p = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (!still) p.set(withDelay(delay, withTiming(1, { duration: 450, easing: EASE })));
  }, [delay, still, p]);
  const a = useAnimatedStyle(() => ({ opacity: p.get(), transform: [{ translateY: (1 - p.get()) * 10 }] }));
  return <Animated.View style={a}>{children}</Animated.View>;
}
