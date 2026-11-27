import { router, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/js-stack';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from '@/components/ui/safe-area';

import { TopBar } from '@/components/ui/top-bar';
import { SCREEN } from '@/lib/transitions';
import { useIsBlocked } from '@/components/common/report-sheet';
import { AbroadCard, PostCard } from '@/components/lounge/post-card';
import { EmptyState } from '@/components/ui/state-view';
import { Colors } from '@/constants/theme';
import { useItem, useLounge } from '@/data/lounge-store';
import { usePullRefresh } from '@/components/ui/pull-refresh';

/**
 * 글 하나 보기 (/post/[id]) — 알림 · 프로필 · 공유 링크로 들어올 때. 피드 카드와 똑같은 모양이에요 (프로토타입 LG_CARD.post).
 * 좋아요 · 댓글 · 신고 · 차단은 카드 그대로.
 */
export default function PostScreen() {
  const pull = usePullRefresh();
  const { id } = useLocalSearchParams<{ id: string }>();
  const p = useItem(String(id));
  const hidden = useLounge((s) => (p && 'who' in p ? !!s.hidden[p.who] : false));
  const blocked = useIsBlocked(p && 'who' in p ? p.who : '') || hidden;
  const back = () => (router.canGoBack() ? router.back() : router.replace('/lounge'));
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={SCREEN.push} />
      <TopBar onBack={back} />
      <ScrollView {...pull.scrollProps} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">{!p || blocked || (p.k !== 'post' && p.k !== 'abroad') ? <EmptyState title="글을 볼 수 없어요" /> : p.k === 'post' ? <PostCard p={p} /> : <AbroadCard p={p} />}</ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  body: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 60 },
});
