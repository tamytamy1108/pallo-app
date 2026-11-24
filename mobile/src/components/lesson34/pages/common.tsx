import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { useFootPadding } from '@/lib/keyboard';

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
export function PFoot({ children }: { children: ReactNode }) {
  // 키보드가 올라오면 칸째로 키보드 위로 (아래 입력 줄 · 버튼이 가리지 않게)
  const bottom = useFootPadding(16);
  return (
    <View style={StyleSheet.flatten([s.foot, { paddingBottom: bottom }])}>
      <FootFade />
      {children}
    </View>
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
