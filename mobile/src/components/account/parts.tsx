/**
 * 마이 B 화면들이 같이 쓰는 작은 부품: 위 줄(뒤로 · 제목) · 화면 틀 · 아이콘 · 스위치 · 칩 · 밑줄 탭.
 * 프로토타입 .mp-top · .lg-dcta · lgI() · .st-row.tg i · .cg-chips · .nt-tabs 를 옮겼어요.
 */
import type { ReactNode, RefObject } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type ScrollViewInstance, type ViewStyle } from 'react-native';
import { SafeAreaView } from '@/components/ui/safe-area';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Pressable } from '@/components/ui/pressable';
import { TopBar } from '@/components/ui/top-bar';
import { BottomBar } from '@/components/bottom-bar';
import { Sink } from '@/components/ui/raised';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { haptic, sfx } from '@/lib/feedback';
import { useKeyboardShown } from '@/lib/keyboard';

/** 프로토타입 LG_IC 중 마이 B 가 쓰는 것 (24 칸 선 아이콘) */
const IC = {
  back: 'M15 4.5L7.5 12l7.5 7.5',
  clock: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M12 7v5l3 2',
  cal: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  pin: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  plus: 'M12 5v14M5 12h14',
  save: 'M6 3h12v18l-6-4.5L6 21z',
  heart: 'M12 20s-7.5-4.6-9.2-9.4C1.6 7 4 4 7.2 4c2 0 3.6 1.2 4.8 2.8C13.2 5.2 14.8 4 16.8 4 20 4 22.4 7 21.2 10.6 19.5 15.4 12 20 12 20z',
  pen: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  search: 'M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14zM20 20l-4-4',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  cmt: 'M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 20 12z',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  tack: 'M9 3h6l-1 6 3 3H7l3-3zM12 12v9',
  lock: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5',
} as const;
export type IconName = keyof typeof IC;

export function Icon({ name, size = 22, color = Colors.ink, fill = 'none', strokeWidth = 2.1, d }: { name?: IconName; size?: number; color?: string; fill?: string; strokeWidth?: number; d?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d={d ?? (name ? IC[name] : '')} />
    </Svg>
  );
}

type PageProps = {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
  children: ReactNode;
  /** 아래 고정 행동 버튼 (BottomBar 안에 넣어요) */
  footer?: ReactNode;
  /** 버튼 위에 한 줄 안내가 붙는 아래 바 (신청서) — footer 대신 통째로 넘겨요 */
  bottom?: ReactNode;
  bodyStyle?: ViewStyle;
  scrollRef?: RefObject<ScrollViewInstance | null>;
  /** 스크롤 없이 (탭 화면처럼 안에서 따로 스크롤) */
  plain?: boolean;
};

/** 마이 B 하위 화면 틀: 크림 바탕 · 위 줄 · 스크롤 · 아래 고정 바 */
export function AccountPage({ title, onBack, right, children, footer, bottom, bodyStyle, scrollRef, plain }: PageProps) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar title={title} onBack={onBack} right={right} fallback="/my" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {plain ? (
          <View style={[styles.flex, bodyStyle]}>{children}</View>
        ) : (
          <ScrollView ref={scrollRef} style={styles.flex} contentContainerStyle={[styles.body, bodyStyle]} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        )}
        {bottom}
        {footer ? <BottomBar>{footer}</BottomBar> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** 아래 고정 바 (BottomBar 와 같은 모양) — 칸을 똑같이 나누지 않고 안을 직접 배치할 때 (프로토타입 .lg-dcta) */
export function Bar({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const insets = useSafeAreaInsets();
  const kb = useKeyboardShown();
  return <View style={[styles.bar, { paddingBottom: 18 + (kb ? 0 : insets.bottom) }, style]}>{children}</View>;
}

/** 하드 섀도 (프로토타입 box-shadow: dx dy 0 ink) — Raised 는 4·4 만 있어서 0·4 같은 아래 그림자용 */
export function Lift({ children, radius, dx = 4, dy = 4, color = Colors.ink, pressed = false, style }: { children: ReactNode; radius: number; dx?: number; dy?: number; color?: string; pressed?: boolean; style?: ViewStyle }) {
  return (
    <View style={[{ marginRight: dx, marginBottom: dy }, style]}>
      <View pointerEvents="none" style={{ position: 'absolute', top: dy, left: dx, right: -dx, bottom: -dy, borderRadius: radius, backgroundColor: color }} />
      <Sink x={dx} y={dy} pressed={pressed}>
        {children}
      </Sink>
    </View>
  );
}

/** 흰 카드 (프로토타입 .card: 잉크 2px · 22 · 4px 그림자). style 의 바깥 여백(margin)은 그림자째 옮겨요 */
export function Box({ children, style, color = Colors.white, onPress, label }: { children: ReactNode; style?: ViewStyle; color?: string; onPress?: () => void; label?: string }) {
  const { margin, marginTop, marginBottom, marginLeft, marginRight, marginHorizontal, marginVertical, ...inner } = StyleSheet.flatten(style) ?? {};
  const outer = { margin, marginTop, marginBottom, marginLeft, marginRight, marginHorizontal, marginVertical };
  const body = (pressed: boolean) => (
    <View style={outer}>
      <Lift radius={22} pressed={pressed}>
        <View style={[styles.box, { backgroundColor: color }, inner]}>{children}</View>
      </Lift>
    </View>
  );
  if (!onPress) return body(false);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      {({ pressed }) => body(pressed)}
    </Pressable>
  );
}

/** 섹션 제목 (프로토타입 .ps-h · .cg-q) */
export function Head({ children, style }: { children: ReactNode; style?: object }) {
  return (
    <PText style={[styles.head, style]} accessibilityRole="header">
      {children}
    </PText>
  );
}

/** 보라 글자 링크 (프로토타입 .lg-link) */
export function TextLink({ label, onPress, color = Colors.purple, style }: { label: string; onPress: () => void; color?: string; style?: object }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" hitSlop={8} style={({ pressed }) => [styles.link, pressed && styles.pressed, style]}>
      <PText style={[styles.linkText, { color }]}>{label}</PText>
    </Pressable>
  );
}

/** 켜고 끄기 (프로토타입 .st-row.tg i: 46×28 · 잉크 2px · 켜면 보라) */
export function Toggle({ value }: { value: boolean }) {
  return (
    <View style={[styles.track, value && styles.trackOn]}>
      <View style={[styles.knob, value && styles.knobOn]} />
    </View>
  );
}

/** 고르는 칩 (프로토타입 .cg-chips button: 38 · 잉크 2px · 고르면 보라) */
export function ChoiceChip({ label, on, onPress, disabled, small }: { label: string; on: boolean; onPress: () => void; disabled?: boolean; small?: boolean }) {
  return (
    <Pressable
      onPress={() => {
        sfx('tap');
        haptic('select');
        onPress();
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: on, disabled }}
      style={({ pressed }) => [styles.chip, small && styles.chipSmall, on && styles.chipOn, disabled && styles.dim, pressed && styles.pressed]}>
      <PText style={[styles.chipText, small && styles.chipTextSmall]} color={on ? Colors.white : Colors.ink}>
        {label}
      </PText>
    </Pressable>
  );
}

/** 밑줄 탭 (프로토타입 .nt-tabs: 고른 탭은 잉크 굵은 밑줄) */
export function UnderTabs<K extends string>({ tabs, value, onChange }: { tabs: [K, string][]; value: K; onChange: (k: K) => void }) {
  return (
    <View style={styles.tabs} accessibilityRole="tablist">
      {tabs.map(([k, l]) => {
        const on = k === value;
        return (
          <Pressable
            key={k}
            onPress={() => {
              sfx('tab');
              onChange(k);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={styles.tab}>
            <PText style={styles.tabText} color={on ? Colors.ink : Colors.inkSub}>
              {l}
            </PText>
            <View style={[styles.tabLine, on && styles.tabLineOn]} />
          </Pressable>
        );
      })}
    </View>
  );
}

export const S = StyleSheet.create({
  /** 연한 구분선 */
  divider: { borderTopWidth: 1.5, borderColor: Colors.line },
  sub: { color: Colors.inkSub },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  flex: { flex: 1 },
  bar: { flexDirection: 'row', gap: 10, paddingTop: 12, paddingHorizontal: 16, backgroundColor: Colors.cream, borderTopWidth: 2, borderColor: Colors.ink },
  pressed: { transform: [{ scale: 0.96 }] },
  body: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
  box: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 22 },
  head: { marginTop: 22, marginBottom: 8, fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  link: { paddingVertical: 6, paddingHorizontal: 2, alignSelf: 'flex-start' },
  linkText: { fontFamily: Font.body900, fontSize: 13, lineHeight: 19 },
  track: { width: 46, height: 28, borderRadius: 14, borderWidth: 2, borderColor: Colors.ink, backgroundColor: '#EEE8DA', justifyContent: 'center', paddingHorizontal: 2 },
  trackOn: { backgroundColor: Colors.purple },
  knob: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  knobOn: { transform: [{ translateX: 18 }] },
  chip: { height: 38, paddingHorizontal: 14, borderRadius: 19, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, justifyContent: 'center' },
  chipSmall: { height: 34, paddingHorizontal: 14, borderRadius: 17 },
  chipOn: { backgroundColor: Colors.purple },
  chipText: { fontFamily: Font.body900, fontSize: 13.5, lineHeight: 19 },
  chipTextSmall: { fontSize: 13 },
  dim: { opacity: 0.45 },
  tabs: { flexDirection: 'row', gap: 18, paddingHorizontal: 16, borderBottomWidth: 1.5, borderColor: Colors.line },
  tab: { paddingTop: 14, alignItems: 'stretch' },
  tabText: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21, paddingBottom: 10 },
  tabLine: { height: 3, borderRadius: 2, backgroundColor: 'transparent' },
  tabLineOn: { backgroundColor: Colors.ink },
});
