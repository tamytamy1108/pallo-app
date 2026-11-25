import { useContext, useMemo, type ReactNode } from 'react';
import { Platform, StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaInsetsContext, useSafeAreaInsets, type Edge, type EdgeInsets } from 'react-native-safe-area-context';

/**
 * 아이폰 위 안전 영역 줄이기 (앱 전체).
 * 아이폰 노치 · 다이내믹 아일랜드 기기의 위 안전 영역(47 · 59 · 62)은 상태 바 글자 아래로 여유가 커서,
 * 그대로 쓰면 헤더가 상태 바에서 멀어 보여요. 아이폰에서만 위 값을 약간 줄여요 (62 → 50, 47 → 38).
 * 안드로이드 · 홈 버튼 아이폰(20) · 웹은 그대로예요.
 */
export function trimTop(top: number) {
  if (Platform.OS !== 'ios' || top <= 24) return top;
  return Math.max(top - 12, Math.round(top * 0.8));
}

/** 맨 바깥(_layout)에 한 번: 그 안의 useSafeAreaInsets() 가 줄인 위 값을 받아요 */
export function TightTopInsets({ children }: { children: ReactNode }) {
  const parent = useContext(SafeAreaInsetsContext);
  const value = useMemo<EdgeInsets | null>(() => (parent ? { ...parent, top: trimTop(parent.top) } : parent), [parent]);
  return <SafeAreaInsetsContext.Provider value={value}>{children}</SafeAreaInsetsContext.Provider>;
}

const ALL: readonly Edge[] = ['top', 'right', 'bottom', 'left'];
const PAD = { top: 'paddingTop', right: 'paddingRight', bottom: 'paddingBottom', left: 'paddingLeft' } as const;

/**
 * react-native-safe-area-context 의 SafeAreaView 대신 써요 (같은 props: edges · style).
 * 그쪽은 기기 값을 바로 읽어 위 줄이기가 안 먹혀서, 여기서는 useSafeAreaInsets() 값을 안쪽 여백에 더해요.
 */
export function SafeAreaView({ edges = ALL, style, ...rest }: ViewProps & { edges?: readonly Edge[] }) {
  const insets = useSafeAreaInsets();
  const flat = StyleSheet.flatten(style) ?? {};
  const pad: Record<string, number> = {};
  edges.forEach((e) => {
    const side = PAD[e];
    const own = flat[side] ?? (e === 'top' || e === 'bottom' ? flat.paddingVertical : flat.paddingHorizontal) ?? flat.padding ?? 0;
    pad[side] = (typeof own === 'number' ? own : 0) + insets[e];
  });
  return <View style={[flat, pad]} {...rest} />;
}
