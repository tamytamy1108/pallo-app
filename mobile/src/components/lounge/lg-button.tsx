import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

/*
 * 라운지 버튼 (프로토타입 .lg-btn): 잉크 테두리 2px · 둥글기 20 · 잉크 그림자 3px · 누르면 그림자 자리로 쏙.
 * 공용 Button(알약 · 그림자 4px)과 모양이 달라서 라운지 안에서만 써요.
 */
type Tone = 'yellow' | 'white' | 'purple' | 'done' | 'bad';
const BG: Record<Tone, string> = { yellow: Colors.yellow, white: Colors.white, purple: Colors.purple, done: Colors.lavender, bad: '#B23A5A' };
const FG: Record<Tone, string> = { yellow: Colors.ink, white: Colors.ink, purple: Colors.white, done: Colors.purple, bad: Colors.white };

export function LgButton({
  label,
  onPress,
  tone = 'yellow',
  height = 36,
  fontSize = 13,
  disabled = false,
  icon,
  wide = false,
  shadow = 3,
  style,
  accessibilityLabel,
}: {
  label: string;
  onPress?: () => void;
  tone?: Tone;
  height?: number;
  fontSize?: number;
  disabled?: boolean;
  icon?: ReactNode;
  wide?: boolean;
  shadow?: number;
  style?: ViewStyle;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      hitSlop={height < 44 ? (44 - height) / 2 : 0}
      style={[wide ? styles.wide : styles.inline, style]}>
      {({ pressed }) => {
        const down = pressed && !disabled ? shadow : 0;
        return (
          <View style={[styles.wrap, { marginRight: shadow, marginBottom: shadow }, wide && styles.wide]}>
            {!disabled && !pressed && shadow > 0 ? <View style={[styles.plate, { top: shadow, left: shadow, right: -shadow, bottom: -shadow }]} /> : null}
            <View
              style={[
                styles.body,
                { height, backgroundColor: disabled ? '#E3DDD0' : BG[tone], transform: [{ translateX: down }, { translateY: down }] },
                disabled && styles.off,
              ]}>
              {icon}
              <PText style={{ fontFamily: Font.body900, fontSize, lineHeight: fontSize * 1.35, color: disabled ? '#8C8597' : FG[tone] }} numberOfLines={1}>
                {label}
              </PText>
            </View>
          </View>
        );
      }}
    </Pressable>
  );
}

/** 체크 칸 (프로토타입 .lg-chk .bx): 22 · 둥글기 7 · 고르면 보라 + 흰 체크 */
export function CheckBox({ on, size = 22 }: { on: boolean; size?: number }) {
  return (
    <View style={[styles.bx, { width: size, height: size }, on && styles.bxOn]}>
      {on ? (
        <Svg width={size - 6} height={size - 6} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M5 12.5l4.5 4.5L19 7.5" />
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inline: { alignSelf: 'flex-start' },
  wide: { alignSelf: 'stretch' },
  wrap: { position: 'relative' },
  plate: { position: 'absolute', borderRadius: 20, backgroundColor: Colors.ink },
  body: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 2, borderColor: Colors.ink },
  off: { borderColor: Colors.ink },
  bx: { borderRadius: 7, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  bxOn: { backgroundColor: Colors.purple },
});
