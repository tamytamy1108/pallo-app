import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

/*
 * 라운지 공통 작은 부품 (프로토타입 .lg-btn · .lg-sec · .lg-capb · 하드 섀도).
 */

/** 그림자를 자리 밖으로 그려요 (프로토타입 box-shadow: 4px 4px 0 ink — 카드 폭이 줄지 않게) */
export function Shadowed({ radius, offset = 4, style, children }: { radius: number; offset?: number; style?: ViewStyle; children: ReactNode }) {
  return (
    <View style={StyleSheet.flatten([{ position: 'relative' }, style])}>
      <View pointerEvents="none" style={{ position: 'absolute', top: offset, left: offset, right: -offset, bottom: -offset, borderRadius: radius, backgroundColor: Colors.ink }} />
      {children}
    </View>
  );
}

type BtnVariant = 'y' | 'wh' | 'pu' | 'done' | 'off' | 'on';
const BG: Record<BtnVariant, string> = { y: Colors.yellow, wh: Colors.white, pu: Colors.purple, done: Colors.ink, off: '#E3DDD0', on: Colors.lavender };
const FG: Record<BtnVariant, string> = { y: Colors.ink, wh: Colors.ink, pu: Colors.white, done: Colors.white, off: '#8C8597', on: Colors.ink };

type BtnProps = {
  label?: string;
  onPress?: () => void;
  variant?: BtnVariant;
  height?: number;
  fontSize?: number;
  shadow?: number;
  icon?: ReactNode;
  /** 칸을 꽉 채워요 (아래 고정 바) */
  grow?: boolean;
  width?: number;
  paddingH?: number;
  accessibilityLabel?: string;
  pressedState?: boolean;
  /** 둥글기 (기본 높이의 반 — 알약) */
  radius?: number;
};

/** 노랑 알약 버튼 (프로토타입 .lg-btn: 높이 40 · 잉크 2px · 그림자 3px · 누르면 그림자 자리로) */
export function LgButton({ label, onPress, variant = 'y', height = 40, fontSize = 13, shadow = 3, icon, grow, width, paddingH = 14, accessibilityLabel, pressedState, radius }: BtnProps) {
  const off = variant === 'off';
  const r = radius ?? height / 2;
  return (
    <Pressable
      onPress={onPress}
      disabled={off || !onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: off, selected: pressedState }}
      hitSlop={height < 44 ? (44 - height) / 2 : 0}
      style={grow ? styles.grow : width ? { width } : styles.inline}>
      {({ pressed }) => (
        <View style={{ height, marginRight: off ? 0 : shadow, marginBottom: off ? 0 : shadow }}>
          {off || pressed ? null : <View pointerEvents="none" style={[styles.shadow, { borderRadius: r, top: shadow, left: shadow, right: -shadow, bottom: -shadow }]} />}
          <View
            style={StyleSheet.flatten([
              styles.btn,
              { height, borderRadius: r, backgroundColor: BG[variant], paddingHorizontal: paddingH },
              off && styles.btnOff,
              pressed && !off && { transform: [{ translateX: shadow }, { translateY: shadow }] },
            ])}>
            {icon}
            {label ? (
              <PText numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ flexShrink: 1, fontFamily: Font.body900, fontSize, lineHeight: fontSize * 1.3, color: FG[variant] }}>
                {label}
              </PText>
            ) : null}
          </View>
        </View>
      )}
    </Pressable>
  );
}

/** 섹션 제목 줄 (프로토타입 .lg-sec: 16 · 900 + 회색 작은 글 + 오른쪽 버튼) */
export function SecHead({ title, sub, right, style }: { title: ReactNode; sub?: string; right?: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.sec, style]}>
      <View style={styles.secTitle}>{typeof title === 'string' ? <PText style={styles.secT}>{title}</PText> : title}</View>
      {sub ? <PText style={styles.secSub}>{sub}</PText> : null}
      <View style={styles.sp} />
      {right}
    </View>
  );
}

/** 인원 막대 (프로토타입 .lg-capb: 84 × 8, 다 차면 분홍) */
export function CapBar({ cur, max, width = 84 }: { cur: number; max: number; width?: number }) {
  const full = cur >= max;
  return (
    <View style={[styles.cap, { width }]}>
      <View style={{ width: `${Math.min(100, Math.round((cur / max) * 100))}%`, height: '100%', borderRadius: 4, backgroundColor: full ? Colors.rosePink : Colors.purple }} />
    </View>
  );
}

/** 텍스트 링크 버튼 (프로토타입 .lg-link) */
export function LgLink({ label, onPress, color = Colors.purple, size = 13 }: { label: string; onPress: () => void; color?: string; size?: number }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" hitSlop={10}>
      <PText style={{ fontFamily: Font.body900, fontSize: size, lineHeight: size * 1.4, color }}>{label}</PText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  inline: { alignSelf: 'flex-start' },
  grow: { flex: 1 },
  shadow: { position: 'absolute', backgroundColor: Colors.ink },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 2, borderColor: Colors.ink },
  btnOff: { borderColor: Colors.ink },
  sec: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 34 },
  secTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  secT: { fontFamily: Font.body900, fontSize: 16, lineHeight: 22 },
  secSub: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  sp: { flex: 1 },
  cap: { height: 8, borderRadius: 4, backgroundColor: '#EEE8DA', overflow: 'hidden', marginTop: 4 },
});
