import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Colors } from '@/constants/theme';
import { SPRING } from '@/lib/motion';

/** 맨 위로 가기 (프로토타입 .to-top): 360px 넘게 내리면 오른쪽 아래에 나타나요 */
export function ToTop({ show, onPress }: { show: boolean; onPress: () => void }) {
  const insets = useSafeAreaInsets();
  const still = useReducedMotion();
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(still ? (show ? 1 : 0) : withTiming(show ? 1 : 0, { duration: show ? 400 : 300, easing: SPRING }));
  }, [show, p, still]);
  const style = useAnimatedStyle(() => ({ opacity: Math.min(1, p.value * 1.3), transform: [{ translateY: (1 - p.value) * 16 }, { scale: 0.8 + 0.2 * p.value }] }));
  return (
    <Animated.View style={[styles.wrap, { bottom: 110 + insets.bottom }, style]} pointerEvents={show ? 'auto' : 'none'}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="맨 위로 가기" style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={Colors.ink} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M12 19V5M5 12l7-7 7 7" />
        </Svg>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', right: 18, zIndex: 19 },
  btn: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', boxShadow: `3px 3px 0 ${Colors.ink}` },
  pressed: { transform: [{ translateX: 3 }, { translateY: 3 }], boxShadow: `0 0 0 ${Colors.ink}` },
});
