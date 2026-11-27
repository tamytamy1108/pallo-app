import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from '@/components/ui/safe-area';

import { apiErrorMessage, isNotFound } from '@/api/errors';
import { noticeQuery, popupsQuery } from '@/api/queries';
import { useNoticePin } from '@/api/use-notice-pin';
import { TopBar } from '@/components/ui/top-bar';
import { Pressable } from '@/components/ui/pressable';
import { ICON_PATH, LineIcon } from '@/components/home/icons';
import { POSTER_RATIO, PopupPoster } from '@/components/home/launch-popup';
import { markNoticeRead } from '@/components/home/noti-state';
import { ErrorState, LoadingState } from '@/components/ui/state-view';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { NOTICE_TAG, noticeDate, type NoticeDetail } from '@/data/mock';
import { usePullRefresh } from '@/components/ui/pull-refresh';

/**
 * 공지 · 이벤트 · 새 소식 상세. 위 오른쪽 압정으로 내 공지 목록 맨 위에 고정해요 (사람마다 따로).
 * 데이터: 12 GET /notices/:id (본문 · 첨부 이미지). 행동 버튼(cta)은 콘솔에 칸이 생기면 다시 붙여요.
 * 이 공지를 가리키는 앱 시작 팝업(A1 GET /popups)이 있으면 그 포스터를 맨 위에 그대로 보여 줘요 (팝업에서 넘어와도 글만 있지 않게).
 */
export default function NoticeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: notice, isPending, error, refetch } = useQuery(noticeQuery(id));
  const missing = isNotFound(error);
  useEffect(() => {
    if (notice) markNoticeRead(notice.id);
  }, [notice]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar title="공지" fallback="/notice" right={notice ? <PinButton notice={notice} /> : null} />

      {notice ? (
        <Detail notice={notice} />
      ) : isPending ? (
        <LoadingState />
      ) : missing ? (
        <PText style={styles.missing}>게시물을 찾을 수 없어요.</PText>
      ) : (
        <ErrorState message={apiErrorMessage(error)} onRetry={() => refetch()} />
      )}
    </SafeAreaView>
  );
}

function PinButton({ notice }: { notice: NoticeDetail }) {
  const { mutate, isPending } = useNoticePin();
  const pinned = notice.pinned;
  return (
    <Pressable
      onPress={() =>
        mutate(
          { id: notice.id, pinned: !pinned },
          { onSuccess: () => showToast(pinned ? '고정을 풀었어요' : '공지 목록 맨 위에 고정했어요') },
        )
      }
      disabled={isPending}
      accessibilityRole="button"
      accessibilityLabel={pinned ? '고정 풀기' : '목록 맨 위에 고정'}
      accessibilityState={{ selected: pinned, disabled: isPending }}
      hitSlop={8}
      style={({ pressed }) => StyleSheet.flatten([styles.pin, pinned && styles.pinOn, pressed && styles.pressed])}>
      <LineIcon d={ICON_PATH.tack} size={16} color={pinned ? Colors.white : Colors.purple} />
      <PText style={styles.pinText} color={pinned ? Colors.white : Colors.purple}>
        {pinned ? '고정됨' : '고정'}
      </PText>
    </Pressable>
  );
}

function Detail({ notice }: { notice: NoticeDetail }) {
  const pull = usePullRefresh();
  const paragraphs = notice.content.split(/\n+/).filter((p) => p.trim());
  const { data: popups } = useQuery(popupsQuery());
  const popup = popups?.find((p) => p.resourceType === 'NOTICE' && p.resourceId === notice.id);
  return (
    <ScrollView {...pull.scrollProps} contentContainerStyle={styles.body}>
      {popup && (
        <View style={styles.posterBox}>
          <View style={styles.posterShadow} />
          <PopupPoster p={popup} style={styles.poster} charInside />
        </View>
      )}
      <PText variant="label" color={Colors.purple}>
        {NOTICE_TAG[notice.type]} · {notice.audience}
      </PText>
      <PText style={styles.title}>{notice.title}</PText>
      <PText variant="small" color={Colors.inkSub} style={styles.meta}>
        {noticeDate(notice.publishAt)} · {notice.author}
      </PText>
      {paragraphs.map((p, i) => (
        <PText key={i} style={styles.para}>
          {p}
        </PText>
      ))}
      {notice.images.map((src) => (
        <Image key={src} source={{ uri: src }} style={styles.image} contentFit="contain" accessibilityLabel="공지 이미지" />
      ))}
      <Pressable onPress={() => router.push('/notice' as Href)} accessibilityRole="link" style={styles.all}>
        <PText variant="bodyStrong" color={Colors.purple}>
          공지 전체 보기 ›
        </PText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  body: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 40, gap: 4 },
  // 팝업 카드처럼 검은 테두리 + 오른쪽 아래 그림자
  posterBox: { marginBottom: 18, marginRight: 4 },
  posterShadow: { position: 'absolute', left: 4, top: 4, right: -4, bottom: -4, borderRadius: 20, backgroundColor: Colors.ink },
  poster: { width: '100%', aspectRatio: POSTER_RATIO, borderRadius: 20, borderWidth: 2, borderColor: Colors.ink },
  title: { marginTop: 4, fontFamily: Font.body900, fontSize: 22, lineHeight: 30, letterSpacing: -0.4 },
  meta: { marginBottom: 10 },
  para: { fontFamily: Font.body700, fontSize: 15, lineHeight: 25, marginBottom: 10 },
  image: { width: '100%', aspectRatio: 4 / 3, borderRadius: 16, backgroundColor: Colors.white, marginBottom: 10 },
  all: { alignSelf: 'center', paddingVertical: 10 },
  missing: { padding: 20 },
  pin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: Colors.purple,
  },
  pinOn: { backgroundColor: Colors.purple },
  pressed: { opacity: 0.7 },
  pinText: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18 },
});
