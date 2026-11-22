import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Colors } from '@/constants/theme';

/**
 * 작은 하드 섀도 (프로토타입 box-shadow: 2px 2px 0 ink · 0 3px 0 ink 같은 것).
 * Raised 와 같은 방법(잉크 판을 어긋나게 깔기)인데 그림자 크기 · 색을 고를 수 있고 자리를 차지하지 않아요.
 */
export function Lift({
  radius,
  x = 2,
  y = 2,
  color = Colors.ink,
  pressed = false,
  shadow = true,
  style,
  children,
}: {
  radius: number;
  x?: number;
  y?: number;
  color?: string;
  pressed?: boolean;
  /** false 면 그림자만 숨겨요 (자리는 그대로) */
  shadow?: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  return (
    <View style={style}>
      {!pressed && shadow && <View pointerEvents="none" style={[styles.shadow, { borderRadius: radius, top: y, left: x, right: -x, bottom: -y, backgroundColor: color }]} />}
      <View style={pressed ? { transform: [{ translateX: x }, { translateY: y }] } : null}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: { position: 'absolute' },
});
