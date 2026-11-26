import type { Decorator } from '@storybook/react-native-web-vite';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { PText } from '@/components/ui/text';
import { showToast, ToastView, type ToastAction } from '@/components/ui/toast';
import { Colors, Spacing } from '@/constants/theme';

/**
 * 시트 · 확인 창 스토리 공통 도우미.
 * 시트(Modal)는 웹에서 body 맨 끝에 따로 그려져서 스토리 칸이 비어 보여요 — 뒤에 깔린 화면 한 장을 같이 그려요.
 */
export const behindSheet: Decorator = (Story) => (
  <View style={styles.fill}>
    <View style={styles.back}>
      <PText variant="headline">뒤 화면</PText>
      <PText color={Colors.inkSub}>시트 · 확인 창이 이 화면 위에 떠요.</PText>
    </View>
    <Story />
  </View>
);

/**
 * 토스트를 계속 띄워 둬요 — 진짜 토스트는 2.4초(행동 버튼이 있으면 3.8초) 뒤 사라져서, 보는 동안 2초마다 다시 띄워요.
 * preview 에는 ToastHost 가 없어서 ToastView 를 같이 그려요.
 */
export function KeepToast({ message, action }: { message: string; action?: ToastAction }) {
  useEffect(() => {
    showToast(message, action);
    const t = setInterval(() => showToast(message, action), 2000);
    return () => clearInterval(t);
  }, [message, action]);
  return <ToastView />;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  back: { flex: 1, padding: Spacing.gutter, gap: Spacing.tight, backgroundColor: Colors.cream },
});
