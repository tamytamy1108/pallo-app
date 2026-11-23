import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ClientErrorCode, errorMessage, isApiError } from '@/api/errors';
import type { Page } from '@/api/client';
import { noticeQuery } from '@/api/queries';
import { TOP_ICON, TopBar } from '@/components/ui/top-bar';
import { Pressable } from '@/components/ui/pressable';
import { BottomBar } from '@/components/bottom-bar';
import { ICON_PATH, LineIcon } from '@/components/home/icons';
import { markNoticeRead } from '@/components/home/noti-state';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/components/ui/state-view';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import type { Notice } from '@/data/mock';

/** 공지 행동 버튼이 여는 곳 (프로토타입 nccta: 변경 신청 · 이벤트 탭 · 라이브러리 탭) */
const CTA_HREF: Record<NonNullable<Notice['cta']>['action'], Href> = {
  schedule: '/me/change' as Href,
  event: '/event',
  library: '/library',
};

/** 공지 · 이벤트 · 새 소식 상세. 행동 버튼은 아래 고정 바에. */
export default function NoticeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  // 12 GET /notices/:id — 목록(홈 띠 · 공지 목록)에서 이미 받은 공지면 기다리지 않고 바로 보여요
  const { data: notice, isPending, error, refetch } = useQuery({ ...noticeQuery(id), initialData: () => cachedNotice(qc, id) });
  const missing = isApiError(error) && error.code === ClientErrorCode.notFound;
  useEffect(() => {
    if (notice) markNoticeRead(notice.id);
  }, [notice]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar
        title="공지"
        fallback="/notice"
        right={
          notice && (
            <Pressable onPress={() => showToast('공지 링크를 복사했어요')} accessibilityRole="button" accessibilityLabel="공유" style={TOP_ICON}>
              <LineIcon d={ICON_PATH.send} size={19} />
            </Pressable>
          )
        }
      />

      {notice ? (
        <Detail notice={notice} />
      ) : isPending ? (
        <LoadingState />
      ) : missing ? (
        <PText style={styles.missing}>게시물을 찾을 수 없어요.</PText>
      ) : (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      )}
    </SafeAreaView>
  );
}

function cachedNotice(qc: QueryClient, id: string) {
  for (const [, page] of qc.getQueriesData<Page<Notice>>({ queryKey: ['notices', 'list'] })) {
    const hit = page?.items.find((n) => n.id === id);
    if (hit) return hit;
  }
  return undefined;
}

function Detail({ notice }: { notice: Notice }) {
  return (
    <>
      <ScrollView contentContainerStyle={styles.body}>
        <PText variant="label" color={Colors.purple}>
          {notice.tag} · {notice.audience}
        </PText>
        <PText style={styles.title}>{notice.title}</PText>
        <PText variant="small" color={Colors.inkSub} style={styles.meta}>
          {notice.date} · {notice.author}
        </PText>
        {notice.body.map((p, i) => (
          <PText key={i} style={styles.para}>
            {p}
          </PText>
        ))}
        <Pressable onPress={() => router.push('/notice' as Href)} accessibilityRole="link" style={styles.all}>
          <PText variant="bodyStrong" color={Colors.purple}>
            공지 전체 보기 ›
          </PText>
        </Pressable>
      </ScrollView>
      {notice.cta && (
        <BottomBar>
          <Button label={notice.cta.label} wide onPress={() => notice.cta && router.push(CTA_HREF[notice.cta.action])} />
        </BottomBar>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  body: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 40, gap: 4 },
  title: { marginTop: 4, fontFamily: Font.body900, fontSize: 22, lineHeight: 30, letterSpacing: -0.4 },
  meta: { marginBottom: 10 },
  para: { fontFamily: Font.body700, fontSize: 15, lineHeight: 25, marginBottom: 10 },
  all: { alignSelf: 'center', paddingVertical: 10 },
  missing: { padding: 20 },
});
