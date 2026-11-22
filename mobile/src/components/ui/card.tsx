import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';

import { Raised } from './raised';

type Props = {
  children: ReactNode;
  /** 카드 바탕색 (기본 흰색). 오늘 스터디는 rosePink 처럼 색 카드도 돼요. */
  color?: string;
  /** 누를 수 있는 카드면 넘겨요 (누르면 쏙 들어가요). */
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: ViewStyle;
};

/** PALLO 카드: 흰 바탕 · 잉크 테두리 2px · 둥글기 22 · 하드 섀도. */
export function Card({ children, color = Colors.white, onPress, accessibilityLabel, style }: Props) {
  const body = (pressed: boolean) => (
    <Raised radius={Radius.card} pressed={pressed}>
      <View style={StyleSheet.flatten([styles.body, { backgroundColor: color }, style])}>{children}</View>
    </Raised>
  );
  if (!onPress) return body(false);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
      {({ pressed }) => body(pressed)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { borderWidth: 2, borderColor: Colors.ink, borderRadius: Radius.card, padding: Spacing.gutter, gap: Spacing.tight },
});
