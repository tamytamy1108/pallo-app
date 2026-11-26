import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from '@/components/ui/safe-area';

import { PText } from '@/components/ui/text';
import { Colors, Spacing, TabBarSpace } from '@/constants/theme';
import { usePullRefresh } from '@/components/ui/pull-refresh';

/** 탭 화면 공통 틀: 크림 바탕 · 큰 제목 · 아래 탭 바만큼 여백. */
export function Screen({ title, children }: { title: string; children?: ReactNode }) {
  const pullRefresh = usePullRefresh();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView refreshControl={pullRefresh} contentContainerStyle={styles.body}>
        <PText variant="headline" accessibilityRole="header" style={styles.title}>
          {title}
        </PText>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  body: { padding: Spacing.gutter, paddingBottom: TabBarSpace, gap: Spacing.stack },
  title: { marginTop: 8 },
});
