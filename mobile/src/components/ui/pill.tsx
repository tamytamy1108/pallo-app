import { Pressable, StyleSheet, View } from 'react-native';

import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

import { PText } from './text';

type PillVariant = 'dark' | 'yellow' | 'soft';

/** 작은 라벨 알약 (프로토타입 .pill): 상태 · 분류 표시용. 누르는 용도는 Chip 을 써요. */
export function Pill({ label, variant = 'dark' }: { label: string; variant?: PillVariant }) {
  return (
    <View style={StyleSheet.flatten([styles.pill, PILL[variant]])}>
      <PText variant="label" color={variant === 'dark' ? Colors.white : Colors.ink} style={styles.pillText}>
        {label}
      </PText>
    </View>
  );
}

/** 고르는 칩 (필터 · 탭 줄): 고르면 잉크 바탕에 흰 글자. */
export function Chip({ label, selected = false, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => StyleSheet.flatten([styles.chip, selected && styles.chipOn, pressed && styles.pressed])}>
      <PText variant="body" color={selected ? Colors.white : Colors.ink} style={styles.chipText}>
        {label}
      </PText>
    </Pressable>
  );
}

const PILL = StyleSheet.create({
  dark: { backgroundColor: Colors.ink },
  yellow: { backgroundColor: Colors.yellow, borderWidth: 1.5, borderColor: Colors.ink },
  soft: { backgroundColor: '#F1EBDC' },
});

const styles = StyleSheet.create({
  pill: { alignSelf: 'flex-start', height: 26, paddingHorizontal: 11, borderRadius: 13, justifyContent: 'center' },
  pillText: { fontFamily: Font.body800, fontSize: 12, lineHeight: 16 },
  chip: { height: 36, paddingHorizontal: 15, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, justifyContent: 'center' },
  chipOn: { backgroundColor: Colors.ink },
  chipText: { fontFamily: Font.body800, fontSize: 13, lineHeight: 18 },
  pressed: { transform: [{ scale: 0.96 }] },
});
