import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';

import { Button } from './button';
import { PText } from './text';

/**
 * 빈 화면 · 불러오는 중 · 오류. API 를 붙일 때 모든 목록에서 같이 써요.
 * 담당: 공통 부품 — 모양은 프로토타입 빈 상태 문구 · 캐릭터대로 다듬어요. props 는 바꾸지 않아요(늘리기만).
 */
export function EmptyState({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={styles.box}>
      <PText variant="bodyStrong" color={Colors.inkSub} style={styles.center}>
        {title}
      </PText>
      {action}
    </View>
  );
}

export function LoadingState() {
  return (
    <View style={styles.box} accessibilityLabel="불러오는 중">
      <ActivityIndicator color={Colors.ink} />
    </View>
  );
}

export function ErrorState({ message = '불러오지 못했어요', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <View style={styles.box}>
      <PText variant="bodyStrong" style={styles.center}>
        {message}
      </PText>
      {onRetry ? <Button label="다시 시도" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 40 },
  center: { textAlign: 'center' },
});
