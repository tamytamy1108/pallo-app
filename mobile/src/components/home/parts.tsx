import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

import { LineIcon } from './icons';

/*
 * 홈 시트 · 팝업에서 같이 쓰는 작은 부품.
 */

/** 흐림 없는 그림자를 원하는 만큼 어긋나게 (프로토타입 box-shadow: Npx Npx 0 ink · 0 Npx 0 ink) */
export function Hard({ x = 4, y = 4, radius, color = Colors.ink, children, style }: { x?: number; y?: number; radius: number; color?: string; children: ReactNode; style?: ViewStyle }) {
  return (
    <View style={style}>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { transform: [{ translateX: x }, { translateY: y }], borderRadius: radius, backgroundColor: color }]} />
      {children}
    </View>
  );
}

/**
 * 노랑 큰 버튼 (프로토타입 .btn.wide.yellow.press: 60px · 둥근 30 · 그림자 4px 4px · 누르면 쏙).
 * 잠기면 회색 (#rsvpBtn:disabled).
 */
export function WideButton({ label, icon, onPress, disabled = false, style }: { label: string; icon?: string; onPress: () => void; disabled?: boolean; style?: ViewStyle }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} style={style}>
      {({ pressed }) => {
        const down = pressed && !disabled;
        return (
          <View>
            {!disabled && !down && <View pointerEvents="none" style={styles.wideShadow} />}
            <View style={StyleSheet.flatten([styles.wide, disabled && styles.wideOff, down && styles.wideDown])}>
              {icon ? <LineIcon d={icon} size={20} width={2.6} color={disabled ? '#8C8597' : Colors.ink} /> : null}
              <PText style={styles.wideText} color={disabled ? '#8C8597' : Colors.ink} numberOfLines={1}>
                {label}
              </PText>
            </View>
          </View>
        );
      }}
    </Pressable>
  );
}

/** 점선 요약 줄 (프로토타입 .sum) */
export function SumRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.sum}>
      <PText style={styles.sumLabel}>{label}</PText>
      <PText style={styles.sumValue}>{value}</PText>
    </View>
  );
}

const styles = StyleSheet.create({
  wide: { height: 60, borderRadius: 30, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 22 },
  wideShadow: { position: 'absolute', top: 4, left: 4, right: -4, bottom: -4, borderRadius: 30, backgroundColor: Colors.ink },
  wideOff: { backgroundColor: '#EFEAE0', borderColor: '#C9C2B3' },
  wideDown: { transform: [{ translateX: 4 }, { translateY: 4 }] },
  wideText: { fontFamily: Font.body900, fontSize: 17, lineHeight: 22 },
  sum: { marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, backgroundColor: Colors.white, borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.ink },
  sumLabel: { fontFamily: Font.body700, fontSize: 13, lineHeight: 19 },
  sumValue: { fontFamily: Font.display, fontSize: 13, lineHeight: 19 },
});
