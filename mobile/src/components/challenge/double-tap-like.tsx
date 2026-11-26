import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Colors } from '@/constants/theme';
import { kfc } from '@/lib/motion';

import { ChIcon } from './icons';

/** 라운지 사진 하트 터짐과 같은 곡선 (lgBurst .8s var(--spring)) */
const BURST_EASE = Easing.bezierFn(0.2, 0.9, 0.3, 1.3);
const HEART = 86;

/**
 * 사진을 두 번 누르면 좋아요 (인스타처럼): 아직 안 눌렀으면 좋아요를 켜고, 이미 눌렀으면 그대로 두고 하트만 톡 터져요.
 * 한 번 누르기는 그대로 지나가요 (기다리는 시간 없음) — 길게 누르기(신고 · 차단) · 스크롤도 막지 않아요.
 * style 은 사진 칸 모양 (테두리 · 비율 등) 그대로 넘겨요.
 */
export function DoubleTapLike({ liked, onLike, style, children }: { liked: boolean; onLike: () => void; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const still = useReducedMotion();
  const burst = useSharedValue(0);
  const like = () => {
    if (!liked) onLike();
  };
  const tap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDistance(12)
    .onEnd((_e, ok) => {
      if (!ok) return;
      if (!still) {
        burst.set(0);
        burst.set(withTiming(1, { duration: 800, easing: Easing.linear }));
      }
      scheduleOnRN(like);
    });
  const heart = useAnimatedStyle(() => {
    const t = burst.get();
    const sc = kfc(t, [0, 30, 70, 100], [0, 1.15, 1, 1], BURST_EASE);
    const op = t === 0 ? 0 : kfc(t, [0, 30, 70, 100], [0, 1, 1, 0], BURST_EASE);
    return { opacity: op, transform: [{ scale: sc }] };
  });
  return (
    <GestureDetector gesture={tap}>
      <Animated.View style={style} accessibilityHint="두 번 누르면 좋아요">
        {children}
        <Animated.View pointerEvents="none" style={[styles.burst, heart]}>
          <ChIcon name="heart" size={HEART} fill={Colors.rosePink} width={1.6} />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  burst: { position: 'absolute', left: '50%', top: '50%', marginLeft: -HEART / 2, marginTop: -HEART / 2 },
});
