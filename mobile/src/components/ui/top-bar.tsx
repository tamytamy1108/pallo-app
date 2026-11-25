import type { Href } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BACK_BOX, BackButton } from '@/components/ui/back-button';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

type TopBarProps = {
  title?: string;
  /** 오른쪽 칸 (아이콘은 TOP_ICON 크기로) */
  right?: ReactNode;
  onBack?: () => void;
  /** 앞 화면이 없을 때 갈 곳 */
  fallback?: Href;
  backLabel?: string;
  /** 아래 연한 선 — 기본은 제목 있을 때만 */
  line?: boolean;
  /** SafeAreaView 밖에서 쓸 때: 맨 위 안전 영역만큼 크림으로 채워요 */
  safeTop?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * 모든 하위 화면 공통 위 줄 (프로토타입 .dtop.mp-top): 높이 44(탭 화면 머리줄과 같은 줄) · ‹ 44 칸(상자 없음) · 제목 15/900 · 오른쪽 칸 · 아래 연한 선.
 */
export function TopBar({ title, right, onBack, fallback, backLabel, line = !!title, safeTop = false, style }: TopBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.top, line && styles.line, safeTop && { height: TOP_BAR_H + insets.top, paddingTop: insets.top }, style]}>
      <BackButton onPress={onBack} fallback={fallback} label={backLabel} />
      {title ? (
        <PText style={styles.title} numberOfLines={1} accessibilityRole="header">
          {title}
        </PText>
      ) : null}
      <View style={styles.sp} />
      {right}
    </View>
  );
}

export const TOP_BAR_H = 44;

/** 위 줄 오른쪽 아이콘 칸 — 뒤로 칸과 같은 44 */
export const TOP_ICON = BACK_BOX;

const styles = StyleSheet.create({
  top: { height: TOP_BAR_H, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, backgroundColor: Colors.cream, zIndex: 3 },
  line: { borderBottomWidth: 1.5, borderColor: Colors.line },
  title: { flexShrink: 1, fontFamily: Font.body900, fontSize: 15, lineHeight: 20 },
  sp: { flex: 1 },
});
