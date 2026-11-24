import { useEffect, type ReactNode } from 'react';
import { ScrollView, StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { GrowInput } from '@/components/ui/grow-input';
import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { haptic, sfx } from '@/lib/feedback';
import { EASE } from '@/lib/motion';

import { ChIcon, type ChIconKey } from './icons';

/*
 * 챌린지 화면 공통 조각 (프로토타입 라운지 CSS: .lg-btn · .lg-capb · .lg-sec · .lg-pills · .ch-find · .lg-empty · lgIn).
 */

export const SUB = Colors.inkSub;
export const LINE = Colors.line;

export type BtnTone = 'yellow' | 'purple' | 'done' | 'white';
const TONE: Record<BtnTone, { bg: string; ink: string }> = {
  yellow: { bg: Colors.yellow, ink: Colors.ink },
  purple: { bg: Colors.purple, ink: Colors.white },
  done: { bg: Colors.ink, ink: Colors.white },
  white: { bg: Colors.white, ink: Colors.ink },
};

/**
 * .lg-btn: 잉크 2px · 둥글기 20 · 3px 그림자 · 누르면 그림자 자리로 쏙 (translate 3px).
 * off: 흐리게(.4) · 안 눌려요 (.lg-btn.off — 같은 표현이 있을 때 챌린지 열기)
 */
export function LgBtn({
  label,
  onPress,
  tone = 'yellow',
  height = 36,
  fontSize = 13,
  padX = 14,
  shadow = 3,
  icon,
  off = false,
  wide = false,
  width,
  style,
  a11y,
}: {
  label?: string;
  onPress?: () => void;
  tone?: BtnTone;
  height?: number;
  fontSize?: number;
  padX?: number;
  shadow?: number;
  icon?: ReactNode;
  off?: boolean;
  wide?: boolean;
  /** 아이콘만 있는 네모 버튼 (찜 54 × 54) */
  width?: number;
  style?: StyleProp<ViewStyle>;
  a11y?: string;
}) {
  const t = TONE[tone];
  return (
    <Pressable
      onPress={off ? undefined : onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={a11y ?? label}
      accessibilityState={{ disabled: off }}
      hitSlop={height < 44 ? (44 - height) / 2 : 0}
      style={[wide ? styles.wide : styles.inline, { paddingRight: shadow, paddingBottom: shadow, opacity: off ? 0.4 : 1 }, style]}>
      {({ pressed }) => (
        <>
          {!pressed || off ? <View pointerEvents="none" style={[styles.btnShadow, { top: shadow, left: shadow, borderRadius: 20 }]} /> : null}
          <View
            style={[
              styles.btn,
              { height, width, backgroundColor: t.bg, paddingHorizontal: padX },
              pressed && !off ? { transform: [{ translateX: shadow }, { translateY: shadow }] } : null,
            ]}>
            {icon}
            {label ? (
              <PText numberOfLines={1} style={{ fontFamily: Font.body900, fontSize, lineHeight: fontSize * 1.35, color: t.ink }}>
                {label}
              </PText>
            ) : null}
          </View>
        </>
      )}
    </Pressable>
  );
}

/** .lg-capb: 진행 막대 (84 × 8, 다 차면 분홍) */
export function CapBar({ cur, max, width = 84 }: { cur: number; max: number; width?: number }) {
  const pct = max ? Math.min(100, Math.round((cur / max) * 100)) : 0;
  return (
    <View style={[styles.capb, { width }]}>
      <View style={{ width: `${pct}%` as const, height: '100%', borderRadius: 4, backgroundColor: cur >= max ? Colors.rosePink : Colors.purple }} />
    </View>
  );
}

/** .lg-sec: 묶음 제목 (16px · 900) + 작은 설명 + 오른쪽 버튼 */
export function Sec({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <View style={styles.sec}>
      <PText style={styles.secT} accessibilityRole="header">
        {title}
      </PText>
      {sub ? <PText style={styles.secS}>{sub}</PText> : null}
      <View style={styles.sp} />
      {right}
    </View>
  );
}

/** .lg-link: 보라 글자 버튼 ('모두 보기 ›') */
export function LgLink({ label, onPress, color = Colors.purple }: { label: string; onPress: () => void; color?: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" hitSlop={8} style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
      <PText style={[styles.linkT, { color }]}>{label}</PText>
    </Pressable>
  );
}

/** .lg-empty: 가운데 보조색 글 */
export function Empty({ children }: { children: string }) {
  return <PText style={styles.empty}>{children}</PText>;
}

/**
 * lgIn: 피드 칸이 아래에서 10px 올라오며 나타나요 (.45초 --ease, 칸마다 .05초씩 늦게).
 * 움직임 줄이기를 켠 사람에게는 바로 보여요.
 */
export function LgIn({ index = 0, children, style }: { index?: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const still = useReducedMotion();
  const p = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (still) return;
    p.set(withDelay(Math.min(index, 4) * 50, withTiming(1, { duration: 450, easing: EASE })));
  }, [index, still, p]);
  const anim = useAnimatedStyle(() => ({ opacity: p.get(), transform: [{ translateY: (1 - p.get()) * 10 }] }));
  return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}

/** .lg-pills: 시트 안 고르기 줄 (옆으로 넘겨요, 고르면 보라) */
export function Pills<T extends string | number>({
  options,
  value,
  onChange,
  label = (v: T) => String(v),
  multi,
  bleed = 18,
}: {
  options: readonly T[];
  value: T | T[];
  onChange: (v: T) => void;
  label?: (v: T) => string;
  multi?: boolean;
  bleed?: number;
}) {
  const on = (v: T) => (Array.isArray(value) ? value.includes(v) : value === v);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -bleed }} contentContainerStyle={[styles.pills, { paddingHorizontal: bleed }]}>
      {options.map((v) => (
        <Pressable
          key={String(v)}
          onPress={() => {
            sfx('tap');
            haptic('select');
            onChange(v);
          }}
          accessibilityRole={multi ? 'checkbox' : 'radio'}
          accessibilityState={multi ? { checked: on(v) } : { selected: on(v) }}
          style={({ pressed }) => [styles.pill, on(v) && styles.pillOn, pressed && styles.pressed]}>
          <PText style={[styles.pillT, on(v) && styles.pillTOn]}>{label(v)}</PText>
        </Pressable>
      ))}
    </ScrollView>
  );
}

/** .lg-fl > .lb: 칸 이름 (14px · 900) */
export function FieldLabel({ children }: { children: string }) {
  return <PText style={styles.lb}>{children}</PText>;
}

/** 시트 입력칸 (.lg-fl textarea: 흰 · 잉크 2px · 둥글기 18 · 안쪽 12 14) */
export function Field({ multiline, style, ...rest }: TextInputProps & { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.field, multiline ? styles.fieldMulti : null, style]}>
      {/* 여러 줄 칸은 길게 쓰는 만큼 저절로 늘어나요 (GrowInput). 테두리는 바깥 칸이 그려요 */}
      {multiline ? <GrowInput ring={false} placeholderTextColor="#9B94A6" style={[styles.fieldIn, styles.fieldInMulti]} {...rest} /> : <TextInput placeholderTextColor="#9B94A6" style={styles.fieldIn} {...rest} />}
    </View>
  );
}

/** .ch-find: 찾기 칸 (둥근 흰 칸 + 돋보기) */
export function SearchBox({ value, onChangeText, placeholder, label }: { value: string; onChangeText: (t: string) => void; placeholder: string; label: string }) {
  return (
    <View style={styles.find}>
      <ChIcon name="search" size={16} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9B94A6"
        autoCorrect={false}
        autoCapitalize="none"
        accessibilityLabel={label}
        style={styles.findIn}
      />
    </View>
  );
}

/** 작은 줄 아이콘 + 글 (카드 일정 줄 · 출처 줄) */
export function IconLine({ icon, text, size = 13, color = SUB, style, textStyle }: { icon: ChIconKey; text: string; size?: number; color?: string; style?: StyleProp<ViewStyle>; textStyle?: object }) {
  return (
    <View style={[styles.iconLine, style]}>
      <ChIcon name={icon} size={size} color={color} />
      <PText numberOfLines={1} style={[styles.iconLineT, { color }, textStyle]}>
        {text}
      </PText>
    </View>
  );
}

const styles = StyleSheet.create({
  inline: { alignSelf: 'flex-start' },
  wide: { alignSelf: 'stretch' },
  btnShadow: { position: 'absolute', right: 0, bottom: 0, backgroundColor: Colors.ink },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 20, borderWidth: 2, borderColor: Colors.ink },
  capb: { height: 8, borderRadius: 4, backgroundColor: '#EEE8DA', overflow: 'hidden', marginTop: 4 },
  sec: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: -8 },
  secT: { fontFamily: Font.body900, fontSize: 16, lineHeight: 23 },
  secS: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: SUB },
  sp: { flex: 1 },
  link: { paddingVertical: 6, paddingHorizontal: 2 },
  linkT: { fontFamily: Font.body900, fontSize: 13, lineHeight: 19 },
  pressed: { opacity: 0.7 },
  empty: { textAlign: 'center', paddingVertical: 30, paddingHorizontal: 10, fontFamily: Font.body700, fontSize: 14, lineHeight: 22, color: SUB },
  pills: { flexDirection: 'row', gap: 7, paddingBottom: 2 },
  pill: { height: 36, paddingHorizontal: 13, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, justifyContent: 'center' },
  pillOn: { backgroundColor: Colors.purple },
  pillT: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18, color: Colors.ink },
  pillTOn: { color: Colors.white },
  lb: { fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  field: { minHeight: 48, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, paddingHorizontal: 14, justifyContent: 'center' },
  fieldMulti: { minHeight: 110, justifyContent: 'flex-start', paddingVertical: 12 },
  fieldIn: { fontFamily: Font.body600, fontSize: 15, color: Colors.ink, paddingVertical: 10 },
  fieldInMulti: { minHeight: 82, paddingVertical: 0, textAlignVertical: 'top' },
  find: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, paddingHorizontal: 14, borderRadius: 22, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  findIn: { flex: 1, minWidth: 0, fontFamily: Font.body700, fontSize: 14, color: Colors.ink, paddingVertical: 0 },
  iconLine: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 0 },
  iconLineT: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, flexShrink: 1 },
});
