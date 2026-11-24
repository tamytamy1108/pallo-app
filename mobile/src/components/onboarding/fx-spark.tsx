import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { SPARK } from '@/components/meet/korea-paths';
import { Colors } from '@/constants/theme';
import { kf, kfc } from '@/lib/motion';

import { OUT, usePulse } from './fx-motion';

/** 스파크 심볼 원본 크기 (korea-paths SPARK · viewBox 0 0 426.31 377.94) */
const SPARK_W = 426.31;
const SPARK_H = 377.94;

/** PALLO 스파크 심볼 한 개. stroke 는 화면 px 굵기 (작게 그려도 테두리가 같은 굵기로 보여요) */
export function SparkMark({ size, color = Colors.yellow, stroke, strokeWidth = 1.5 }: { size: number; color?: string; stroke?: string; strokeWidth?: number }) {
  const unit = SPARK_W / size;
  const pad = stroke ? strokeWidth * unit : 0;
  return (
    <Svg width={size} height={(size * SPARK_H) / SPARK_W} viewBox={`${-pad / 2} ${-pad / 2} ${SPARK_W + pad} ${SPARK_H + pad}`}>
      <Path d={SPARK} fill={color} stroke={stroke} strokeWidth={stroke ? strokeWidth * unit : 0} strokeLinejoin="round" />
    </Svg>
  );
}

const BURST_COLORS = [Colors.yellow, '#F2A3B8', Colors.white, Colors.yellow, '#C9B8F2', '#F2A3B8'];

/**
 * 반짝 터지기: trigger 가 바뀐 순간 작은 스파크들이 가운데에서 둘레로 퍼지며 사라져요.
 * 놓을 자리(가운데)를 style 의 left · top 으로 정해요. 쉬는 동안은 안 보이고, 누르는 데 끼어들지 않아요.
 */
export function SparkBurst({
  trigger,
  fire,
  count = 6,
  radius = 30,
  size = 11,
  delay = 0,
  colors = BURST_COLORS,
  onMount,
  style,
}: {
  trigger: unknown;
  fire?: boolean;
  count?: number;
  radius?: number;
  size?: number;
  delay?: number;
  colors?: string[];
  onMount?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const p = usePulse(trigger, { duration: 640, delay, fire, onMount });
  return (
    <View pointerEvents="none" style={[styles.burst, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: count }, (_, i) => (
        <BurstBit key={i} p={p} angle={(i / count) * Math.PI * 2 - Math.PI / 2 + (i % 2) * 0.25} dist={radius * (i % 2 ? 0.78 : 1)} size={size * (i % 2 ? 0.75 : 1)} color={colors[i % colors.length]} />
      ))}
    </View>
  );
}

function BurstBit({ p, angle, dist, size, color }: { p: SharedValue<number>; angle: number; dist: number; size: number; color: string }) {
  const anim = useAnimatedStyle(() => {
    const t = p.get();
    const d = kfc(t, [0, 100], [dist * 0.25, dist], OUT);
    return {
      opacity: t >= 1 ? 0 : kf(t, [0, 8, 70, 100], [0, 1, 1, 0]),
      transform: [{ translateX: Math.cos(angle) * d }, { translateY: Math.sin(angle) * d }, { rotate: `${angle * 40}deg` }, { scale: kf(t, [0, 30, 100], [0.2, 1, 0.4]) }],
    };
  });
  return (
    <Animated.View style={[styles.bit, { left: -size / 2, top: -size / 2 }, anim]}>
      <SparkMark size={size} color={color} stroke={Colors.ink} strokeWidth={1.2} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  burst: { position: 'absolute', width: 0, height: 0 },
  bit: { position: 'absolute' },
});
