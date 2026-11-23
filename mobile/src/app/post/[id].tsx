import { router, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/js-stack';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { SCREEN } from '@/lib/transitions';
import { useIsBlocked } from '@/components/common/report-sheet';
import { AbroadCard, PostCard } from '@/components/lounge/post-card';
import { EmptyState } from '@/components/ui/state-view';
import { Colors } from '@/constants/theme';
import { useItem, useLounge } from '@/data/lounge-store';

/**
 * 글 하나 보기 (/post/[id]) — 알림 · 프로필 · 공유 링크로 들어올 때. 피드 카드와 똑같은 모양이에요 (프로토타입 LG_CARD.post).
 * 좋아요 · 댓글 · 신고 · 차단은 카드 그대로.
 */
export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const p = useItem(String(id));
  const hidden = useLounge((s) => (p && 'who' in p ? !!s.hidden[p.who] : false));
  const blocked = useIsBlocked(p && 'who' in p ? p.who : '') || hidden;
  const back = () => (router.canGoBack() ? router.back() : router.replace('/lounge'));
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={SCREEN.push} />
      <View style={styles.top}>
        <BackButton onPress={back} />
      </View>
      <ScrollView contentContainerStyle={styles.body}>{!p || blocked || (p.k !== 'post' && p.k !== 'abroad') ? <EmptyState title="글을 볼 수 없어요" /> : p.k === 'post' ? <PostCard p={p} /> : <AbroadCard p={p} />}</ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  top: { paddingVertical: 8, paddingHorizontal: 12, justifyContent: 'center' },
  ib: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 60 },
});
