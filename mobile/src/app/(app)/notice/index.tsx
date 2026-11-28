import { useQuery } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from '@/components/ui/safe-area';

import { apiErrorMessage } from '@/api/errors';
import { noticesQuery } from '@/api/queries';
import { TopBar } from '@/components/ui/top-bar';
import { Pressable } from '@/components/ui/pressable';
import { ICON_PATH, LineIcon } from '@/components/home/icons';
import { useNoticeRead } from '@/components/home/noti-state';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-view';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { useScrollEndPad } from '@/components/ui/scroll-end';
import { NOTICE_TAG, noticeDate } from '@/data/mock';
import { usePullRefresh } from '@/components/ui/pull-refresh';

/**
 * 공지사항 목록 (프로토타입 noticeHTML · .nc-row).
 * 내가 고정한 공지(압정) 맨 위 · 태그 · 제목 · 날짜 · 쓴 곳 · 새 글 점. 누르면 상세로 (고정은 상세 위 압정으로).
 * 데이터: 12 GET /notices (첫 20개 · 더 받기는 공지가 많아지면 useInfiniteQuery 로)
 */
export default function NoticeListScreen() {
  const endPad = useScrollEndPad();
  const pull = usePullRefresh();
  const { data, isPending, isError, error, refetch } = useQuery(noticesQuery());
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar title="공지사항" />
      <ScrollView {...pull.scrollProps} contentContainerStyle={[styles.body, { paddingBottom: endPad }]}>
        {isPending ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState message={apiErrorMessage(error)} onRetry={() => refetch()} />
        ) : data.items.length === 0 ? (
          <EmptyState title="아직 공지가 없어요." />
        ) : (
          data.items.map((n) => <Row key={n.id} id={n.id} tag={NOTICE_TAG[n.type]} pinned={n.pinned} title={n.title} meta={`${noticeDate(n.publishAt)} · ${n.author}`} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ id, tag, pinned, title, meta }: { id: string; tag: string; pinned: boolean; title: string; meta: string }) {
  const read = useNoticeRead(id);
  return (
    <Pressable
      onPress={() => router.push(`/notice/${id}` as Href)}
      accessibilityRole="button"
      accessibilityLabel={`${pinned ? '고정 ' : ''}${tag} ${title}, ${meta}${read ? '' : ', 새 글'}`}
      style={({ pressed }) => StyleSheet.flatten([styles.row, pressed && styles.rowPressed])}>
      <View style={styles.tg}>
        {pinned && <LineIcon d={ICON_PATH.tack} size={13} color={Colors.purple} />}
        <PText style={styles.tgText} color={Colors.purple}>
          {pinned ? '고정' : tag}
        </PText>
      </View>
      <View style={styles.titleRow}>
        <PText style={styles.title}>{title}</PText>
        {!read && <View style={styles.dot} />}
      </View>
      <PText style={styles.meta} color={Colors.inkSub}>
        {meta}
      </PText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  body: { paddingTop: 4, paddingHorizontal: 16 },
  row: { paddingVertical: 14, borderBottomWidth: 1.5, borderColor: Colors.line },
  rowPressed: { opacity: 0.7 },
  tg: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  tgText: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17 },
  titleRow: { marginTop: 3, flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21, flexShrink: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.rosePink },
  meta: { marginTop: 3, fontFamily: Font.body700, fontSize: 12, lineHeight: 17 },
});
