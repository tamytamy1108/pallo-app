import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

import { Raised } from './raised';
import { PText } from './text';

type Variant = 'primary' | 'secondary' | 'dark' | 'ghost';

type Props = {
  label: string;
  onPress?: () => void;
  /** primary: 노랑(핵심 행동) · secondary: 흰색 · dark: 잉크 · ghost: 테두리만 */
  variant?: Variant;
  /** 화면 폭 가득 · 조금 더 크게 (프로토타입 .btn.wide) */
  wide?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
};

const BG: Record<Variant, string> = { primary: Colors.yellow, secondary: Colors.white, dark: Colors.ink, ghost: 'transparent' };

/** PALLO 버튼: 잉크 테두리 2px · 알약 모양 · 누르면 그림자 자리로 쏙 들어가요. */
export function Button({ label, onPress, variant = 'primary', wide = false, disabled = false, icon }: Props) {
  const height = wide ? 60 : 54;
  const radius = height / 2;
  const flat = disabled || variant === 'ghost';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={wide ? styles.wide : styles.inline}>
      {({ pressed }) => (
        <Raised radius={radius} pressed={pressed} flat={flat} style={wide ? styles.wide : undefined}>
          <View
            style={StyleSheet.flatten([
              styles.body,
              { height, borderRadius: radius, backgroundColor: BG[variant], paddingHorizontal: variant === 'ghost' ? 16 : 22 },
              disabled && styles.disabled,
            ])}>
            {icon}
            <PText
              variant="bodyStrong"
              color={disabled ? '#8C8597' : variant === 'dark' ? Colors.white : Colors.ink}
              style={{ fontFamily: variant === 'ghost' ? Font.body700 : Font.body900, fontSize: variant === 'ghost' ? 14 : wide ? 17 : 16, lineHeight: 22 }}>
              {label}
            </PText>
          </View>
        </Raised>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  inline: { alignSelf: 'flex-start' },
  wide: { alignSelf: 'stretch' },
  body: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 2, borderColor: Colors.ink },
  disabled: { backgroundColor: '#EEE8DA', borderColor: '#B9B2A3' },
});
