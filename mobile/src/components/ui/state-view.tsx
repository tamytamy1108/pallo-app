import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { sfx } from '@/lib/feedback';

import { PText } from './text';

/**
 * 빈 화면 · 불러오는 중 · 오류. API 를 붙일 때 모든 목록에서 같이 써요.
 * 프로토타입 빈 상태는 캐릭터 없이 글만 있어요 (.lg-empty: 가운데 · 14px · 700 · 보조색, 줄바꿈 + 보라 글자 링크).
 * 예) <EmptyState title={'이날은 번개가 없어요.'} link={{ label: '이날 번개 열기 ›', onPress }} />
 * 담당: 공통 부품. props 는 바꾸지 않아요(늘리기만).
 */
export function EmptyState({ title, action, link, compact = false }: { title: string; action?: ReactNode; link?: { label: string; onPress: () => void }; compact?: boolean }) {
  return (
    <View style={[styles.empty, compact && styles.compact]}>
      <PText style={styles.emptyText}>{title}</PText>
      {link ? <TextLink label={link.label} onPress={link.onPress} /> : null}
      {action}
    </View>
  );
}

export function LoadingState() {
  return (
    <View style={styles.box} accessibilityLabel="불러오는 중" accessibilityRole="progressbar">
      <ActivityIndicator color={Colors.purple} />
    </View>
  );
}

export function ErrorState({ message = '불러오지 못했어요', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <View style={styles.box}>
      <PText style={styles.emptyText}>{message}</PText>
      {onRetry ? <TextLink label="다시 시도" onPress={onRetry} /> : null}
    </View>
  );
}

function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        sfx('soft');
        onPress();
      }}
      accessibilityRole="button"
      hitSlop={10}
      style={styles.link}>
      <PText color={Colors.purple} style={styles.linkText}>
        {label}
      </PText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // .lg-empty { text-align: center; padding: 30px 10px; font-size: 14px; font-weight: 700; color: var(--sub) }
  empty: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 10 },
  compact: { paddingVertical: 12, paddingHorizontal: 0 },
  emptyText: { textAlign: 'center', fontFamily: Font.body700, fontSize: 14, lineHeight: 14 * 1.55, color: Colors.inkSub },
  box: { alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 40 },
  // .lg-link { padding: 6px 2px; font-size: 13px; font-weight: 900; color: var(--purple) }
  link: { paddingVertical: 6, paddingHorizontal: 2 },
  linkText: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18 },
});
