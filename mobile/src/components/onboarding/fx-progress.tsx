import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { EASE, kf, kfc } from '@/lib/motion';

import { POP } from './fx-motion';
import { SparkMark } from './fx-spark';

/** 마지막으로 보여 준 진행 값 (0~1). 다음 화면은 이 값에서부터 차올라요 */
let lastShown = 0;

const FILL_MS = 700;
const RIDER = 20;

/**
 * 보라 진행 바 + 끝에 올라탄 노란 스파크 (프로토타입 진행 바 · .tb).
 * 앞 화면 값에서 이번 값까지 차오르고, 다 차면 스파크가 통 튀어요. 뒤로 돌아와 다시 보일 때는 그 값을 기억만 해요.
 */
export function ProgressRail({ step, total }: { step: number; total: number }) {
  const still = useReducedMotion();
  const target = Math.min(1, Math.max(0, step / total));
  const [w, setW] = useState(0);
  const p = useSharedValue(still ? target : lastShown);
  const hop = useSharedValue(1);

  useEffect(() => {
    lastShown = target;
    if (still) {
      p.set(target);
      return;
    }
    p.set(withTiming(target, { duration: FILL_MS, easing: EASE }));
    hop.set(withSequence(withTiming(0, { duration: 0 }), withDelay(FILL_MS * 0.72, withTiming(1, { duration: 620, easing: Easing.linear }))));
  }, [target, still, p, hop]);

  // 이 화면으로 뒤로 돌아오면 다음 화면이 이 값에서 시작해요
  useFocusEffect(
    useCallback(() => {
      lastShown = target;
    }, [target]),
  );

  const fill = useAnimatedStyle(() => ({ transform: [{ translateX: -(1 - p.get()) * w }] }));
  const rider = useAnimatedStyle(() => {
    const h = hop.get();
    return {
      opacity: w ? 1 : 0,
      transform: [
        // 끝까지 차도 오른쪽 n/N 글자를 덮지 않게 바 안쪽에 멈춰요
        { translateX: Math.min(p.get() * w - RIDER / 2, w - RIDER + 3) },
        { translateY: kfc(h, [0, 35, 70, 100], [0, -9, 0, 0], POP) },
        { rotate: `${kf(h, [0, 35, 70, 100], [0, -18, 6, 0])}deg` },
        { scaleX: kf(h, [0, 62, 74, 100], [1, 1, 1.18, 1]) },
        { scaleY: kf(h, [0, 62, 74, 100], [1, 1, 0.84, 1]) },
      ],
    };
  });

  return (
    <View style={styles.rail} onLayout={(e) => setW(e.nativeEvent.layout.width)} accessible accessibilityRole="progressbar" accessibilityLabel={`${total}단계 중 ${step}단계`}>
      <View style={styles.bar}>
        <Animated.View style={[styles.fill, fill]} />
      </View>
      <Animated.View pointerEvents="none" style={[styles.rider, rider]}>
        <SparkMark size={RIDER} color={Colors.yellow} stroke={Colors.ink} strokeWidth={1.6} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: { flex: 1, height: 24, justifyContent: 'center' },
  bar: { height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: Colors.ink, backgroundColor: '#EAE2CF', overflow: 'hidden' },
  fill: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: Colors.purple },
  rider: { position: 'absolute', left: 0, top: (24 - (RIDER * 377.94) / 426.31) / 2 - 1 },
});
