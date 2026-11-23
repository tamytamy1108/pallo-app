import { router, type Href } from 'expo-router';
import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Pressable } from '@/components/ui/pressable';
import { Colors } from '@/constants/theme';

/**
 * 모든 화면 공통 뒤로 버튼 (프로토타입 .icon-btn[aria-label^="뒤로"]): 44×44 투명 칸 · ‹ 22px · 선 2.1.
 * 위 줄은 좌우 여백 12 로 맞춰서 어느 화면이든 같은 자리에 와요.
 * onPress 를 안 넘기면 앞 화면으로 (없으면 fallback 으로).
 */
export function BackButton({ onPress, fallback = '/', color = Colors.ink, label = '뒤로', style }: { onPress?: () => void; fallback?: Href; color?: string; label?: string; style?: StyleProp<ViewStyle> }) {
  const go = onPress ?? (() => (router.canGoBack() ? router.back() : router.replace(fallback)));
  return (
    <Pressable onPress={go} sound="back" accessibilityRole="button" accessibilityLabel={label} hitSlop={4} style={({ pressed }) => [BACK_BOX, pressed && { transform: [{ scale: 0.9 }] }, style]}>
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M15 4.5L7.5 12l7.5 7.5" />
      </Svg>
    </Pressable>
  );
}

/** 뒤로 버튼 칸 크기 — 오른쪽 아이콘 칸도 이 크기로 맞춰요 */
export const BACK_BOX: ViewStyle = { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
