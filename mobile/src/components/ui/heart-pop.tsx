import { useEffect, useRef, type ReactNode } from 'react';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { haptic } from '@/lib/feedback';

/**
 * 하트(좋아요 · 찜)를 누르면 톡 커졌다 돌아오고 손에 살짝 떨림이 와요. 끌 때는 살짝 줄었다 돌아와요.
 * 색만 바뀌면 눌렸는지 잘 안 느껴져서 (인스타처럼) 움직임을 더해요. 아이콘을 감싸기만 하면 돼요.
 */
export function HeartPop({ on, children }: { on: boolean; children: ReactNode }) {
  const still = useReducedMotion();
  const s = useSharedValue(1);
  const first = useRef(true);
  useEffect(() => {
    // 처음 그릴 때는 움직이지 않아요 (이미 좋아요한 글을 열었을 때)
    if (first.current) {
      first.current = false;
      return;
    }
    haptic(on ? 'success' : 'tap');
    if (still) return;
    s.set(on ? withSequence(withTiming(1.35, { duration: 120 }), withSpring(1, { damping: 7, stiffness: 260 })) : withSequence(withTiming(0.82, { duration: 90 }), withSpring(1, { damping: 12, stiffness: 300 })));
  }, [on, still, s]);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: s.get() }] }));
  return <Animated.View style={st}>{children}</Animated.View>;
}
