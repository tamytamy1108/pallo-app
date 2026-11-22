import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedProps, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming, Easing } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

import { fmtS } from './text';
import { PINK_INK, SUB } from './ui';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const R = 34;
const C = 2 * Math.PI * R;
export const RING_PURPLE = Colors.purple;

/**
 * 원형 시계 .tk-ring — 1초마다 줄어들고, 3초 남으면 글자가 분홍으로 바뀌며 흔들려요.
 * 준비 시간은 보라, 나머지는 분홍 (프로토타입 ringHTML · ringSet).
 */
export function Ring({ left, total, label, color = Colors.rosePink }: { left: number; total: number; label: string; color?: string }) {
  const { height } = useWindowDimensions();
  const size = height < 700 ? 68 : 92; // 프로토타입: 낮은 화면에서는 68px
  const still = useReducedMotion();
  const off = useSharedValue(C * (1 - Math.max(0, left) / total));
  const shake = useSharedValue(0);
  const low = left <= 3 && total > 3;
  useEffect(() => {
    off.set(still ? C * (1 - Math.max(0, left) / total) : withTiming(C * (1 - Math.max(0, left) / total), { duration: 1000, easing: Easing.linear }));
  }, [left, total, still, off]);
  useEffect(() => {
    if (!low || still) return;
    shake.set(withSequence(withTiming(-4, { duration: 80 }), withTiming(4, { duration: 80 }), withTiming(-3, { duration: 80 }), withTiming(0, { duration: 80 })));
  }, [low, left, still, shake]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: off.get() }));
  const move = useAnimatedStyle(() => ({ transform: [{ translateX: shake.get() }] }));
  return (
    <View style={styles.wrap} accessibilityRole="timer" accessibilityLabel={`${label} ${fmtS(left)}`}>
      <Animated.View style={[{ width: size, height: size }, move]}>
        <Svg width={size} height={size} viewBox="0 0 80 80" style={styles.rot}>
          <Circle cx={40} cy={40} r={R} stroke="#EFE8D8" strokeWidth={8} fill="none" />
          <AnimatedCircle cx={40} cy={40} r={R} stroke={color} strokeWidth={8} fill="none" strokeLinecap="round" strokeDasharray={`${C}`} animatedProps={props} />
        </Svg>
        <View style={styles.center}>
          <PText style={StyleSheet.flatten([styles.t, { fontSize: size < 80 ? 16 : 21 }])} color={low ? PINK_INK : Colors.ink}>
            {fmtS(left)}
          </PText>
        </View>
      </Animated.View>
      <PText style={styles.l} color={SUB}>
        {label}
      </PText>
    </View>
  );
}

/** 1초마다 줄어드는 시계 (프로토타입 tkCount). 문제가 바뀌면(화면이 사라지면) 저절로 멈춰요 */
export function useCountdown() {
  const [left, setLeft] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }, []);
  const start = useCallback(
    (sec: number, onEnd: () => void) => {
      stop();
      setTotal(sec);
      setLeft(sec);
      let n = sec;
      timer.current = setInterval(() => {
        n -= 1;
        setLeft(n);
        if (n <= 0) {
          stop();
          onEnd();
        }
      }, 1000);
    },
    [stop],
  );
  useEffect(() => stop, [stop]);
  return { left, total, start, stop, running: () => timer.current != null, reset: () => setLeft(null) };
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 4 },
  rot: { transform: [{ rotate: '-90deg' }] },
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  t: { fontFamily: Font.display, lineHeight: 26, fontVariant: ['tabular-nums'] },
  l: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17 },
});
