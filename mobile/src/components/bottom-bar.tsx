import { Children, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';

/**
 * 화면 아래 고정 바: 행동 버튼(신청하기 · 보내기 등)은 늘 여기에 둬요.
 * 프로토타입 .lg-dcta 와 같아요 — 크림 바탕 · 위쪽 잉크 선. 버튼이 여럿이면 칸을 똑같이 나눠요.
 */
export function BottomBar({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={StyleSheet.flatten([styles.bar, { paddingBottom: 18 + insets.bottom }])}>
      {Children.map(children, (child) => (
        <View style={styles.slot}>{child}</View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', gap: 10, paddingTop: 12, paddingHorizontal: 16, backgroundColor: Colors.cream, borderTopWidth: 2, borderColor: Colors.ink },
  slot: { flex: 1 },
});
