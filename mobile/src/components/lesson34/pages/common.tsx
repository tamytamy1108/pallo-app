import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

import { FootFade } from '../frame';
import { SUB } from '../ui';

/*
 * 단계 화면 공용 조각 (프로토타입 #study 의 .st-intro · .card · .st-foot · .st-stats · .st-tool).
 */

/** 회색 안내 문단 .st-intro */
export const Intro = ({ text }: { text: string }) => (
  <PText style={s.intro} color={SUB}>
    {text}
  </PText>
);

/** 흰 카드 .card (잉크 테두리 · 4px 그림자) */
export const PCard = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => <View style={StyleSheet.flatten([s.card, style])}>{children}</View>;

/** 아래 고정 칸 .st-foot */
export function PFoot({ children, keyboard = false }: { children: ReactNode; keyboard?: boolean }) {
  const insets = useSafeAreaInsets();
  if (keyboard && Platform.OS === 'ios') return <PFootKeyboard bottom={16 + insets.bottom}>{children}</PFootKeyboard>;
  return (
    <View style={StyleSheet.flatten([s.foot, { paddingBottom: 16 + insets.bottom }])}>
      <FootFade />
      {children}
    </View>
  );
}

/**
 * 키보드 바로 위에 붙는 아래 칸 (아이폰): 키보드가 올라오는 움직임과 같은 프레임에 따라 올라가요 (UI 스레드).
 * 내려가 있을 땐 홈 바 여백(bottom), 올라오면 키보드 위 12 — 두 값 중 큰 쪽이라 중간에 툭 튀지 않아요.
 */
function PFootKeyboard({ bottom, children }: { bottom: number; children: ReactNode }) {
  const kb = useAnimatedKeyboard();
  const st = useAnimatedStyle(() => ({ paddingBottom: Math.max(bottom, kb.height.value + 12) }));
  return (
    <Animated.View style={[s.foot, st]}>
      <FootFade />
      {children}
    </Animated.View>
  );
}

/** 숫자 칸 .st-stats (큰 숫자 + 이름) */
export function Stats({ items }: { items: [string, string][] }) {
  return (
    <PCard style={s.stats}>
      {items.map(([b, l]) => (
        <View key={l} style={s.stat}>
          <PText style={s.statB}>{b}</PText>
          <PText style={s.statL} color={SUB}>
            {l}
          </PText>
        </View>
      ))}
    </PCard>
  );
}

/** 작은 알약 도구 .st-tool (전체 듣기 · 한국어) */
export function Tool({ label, on, onPress, icon }: { label: string; on?: boolean; onPress: () => void; icon?: ReactNode }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: !!on }} accessibilityLabel={label} style={StyleSheet.flatten([s.tool, on && s.toolOn])}>
      {icon}
      <PText style={s.toolT}>{label}</PText>
    </Pressable>
  );
}

export const s = StyleSheet.create({
  intro: { fontFamily: Font.body700, fontSize: 13.5, lineHeight: 21.6, marginHorizontal: 2 },
  card: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 22, backgroundColor: Colors.white, boxShadow: `4px 4px 0px ${Colors.ink}` },
  foot: { paddingHorizontal: 16, paddingTop: 12, gap: 8, backgroundColor: Colors.cream },
  stats: { flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 8 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statB: { fontFamily: Font.display, fontSize: 18, lineHeight: 24 },
  statL: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16 },
  tool: { height: 38, paddingHorizontal: 14, borderRadius: 19, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, flexDirection: 'row', alignItems: 'center', gap: 6 },
  toolOn: { backgroundColor: Colors.yellow },
  toolT: { fontFamily: Font.body800, fontSize: 13, lineHeight: 18 },
});
