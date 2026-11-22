import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { BottomBar } from '@/components/bottom-bar';
import { ICON_PATH, LineIcon } from '@/components/home/icons';
import { markNoticeRead } from '@/components/home/noti-state';
import { Button } from '@/components/ui/button';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { ALL_NOTICES, type Notice } from '@/data/mock';

/** 공지 행동 버튼이 여는 곳 (프로토타입 nccta: 변경 신청 · 이벤트 탭 · 라이브러리 탭) */
const CTA_HREF: Record<NonNullable<Notice['cta']>['action'], Href> = {
  schedule: '/me/change' as Href,
  event: '/event',
  library: '/library',
};

/** 공지 · 이벤트 · 새 소식 상세. 행동 버튼은 아래 고정 바에. */
export default function NoticeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const notice = ALL_NOTICES.find((n) => n.id === id);
  useEffect(() => {
    if (notice) markNoticeRead(notice.id);
  }, [notice]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.top}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="뒤로" hitSlop={10} style={styles.back}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={Colors.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M15 5l-7 7 7 7" />
          </Svg>
        </Pressable>
        <PText variant="bodyStrong" style={styles.topTitle}>
          공지
        </PText>
        <View style={styles.sp} />
        {notice && (
          <Pressable onPress={() => showToast('공지 링크를 복사했어요')} accessibilityRole="button" accessibilityLabel="공유" style={styles.back}>
            <LineIcon d={ICON_PATH.send} size={19} />
          </Pressable>
        )}
      </View>

      {notice ? <Detail notice={notice} /> : <PText style={styles.missing}>게시물을 찾을 수 없어요.</PText>}
    </SafeAreaView>
  );
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
        <Pressable onPress={() => router.push('/notice')} accessibilityRole="link" style={styles.all}>
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
  top: { height: 56, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, borderBottomWidth: 1.5, borderColor: Colors.line },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontFamily: Font.body900, fontSize: 16 },
  sp: { flex: 1 },
  body: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 40, gap: 4 },
  title: { marginTop: 4, fontFamily: Font.body900, fontSize: 22, lineHeight: 30, letterSpacing: -0.4 },
  meta: { marginBottom: 10 },
  para: { fontFamily: Font.body700, fontSize: 15, lineHeight: 25, marginBottom: 10 },
  all: { alignSelf: 'center', paddingVertical: 10 },
  missing: { padding: 20 },
});
