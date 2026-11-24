import { useMutation, useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { errorMessage } from '@/api/errors';
import { sendAttendance, sendRsvp } from '@/api/home';
import { meQuery, queryKeys } from '@/api/queries';
import { queryClient } from '@/api/query-client';
import { Pressable } from '@/components/ui/pressable';
import { AttendSheet, type AttendSheetMode } from '@/components/home/attend-sheet';
import { getAttend, summary, type SheetMode } from '@/components/home/attendance';
import { applyDevParams, applyDevPlan } from '@/components/home/dev';
import { GoalCard } from '@/components/home/goal-card';
import { LineIcon } from '@/components/home/icons';
import { LaunchPopup } from '@/components/home/launch-popup';
import { LoungePreview } from '@/components/home/lounge-preview';
import { askCurrentStop } from '@/components/home/map-state';
import { useUnreadCount } from '@/components/home/noti-state';
import { NoticeStrip } from '@/components/home/notice-strip';
import { QrScanner } from '@/components/home/qr-scanner';
import { SessionCard } from '@/components/home/session-card';
import { StudyMap } from '@/components/home/study-map';
import { Logo } from '@/components/logo';
import { Appear } from '@/components/ui/appear';
import { Raised } from '@/components/ui/raised';
import { ErrorState, LoadingState } from '@/components/ui/state-view';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Colors, Spacing, TabBarSpace } from '@/constants/theme';
import { sfx } from '@/lib/feedback';
import { useMe } from '@/state/me';
import { useTabReselect } from '@/lib/tab-reselect';

const BELL = 'M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0';

/** 홈: 로고 · 알림 → 인사 → 공지 띠 → 오늘 스터디 카드(앱 구독자는 오늘의 목표) → 스터디 맵 → 라운지 미리보기. */
export default function HomeScreen() {
  // 개발용 주소 값 (?now= · ?season= · ?plan=) — 웹에서만, 화면엔 아무것도 안 그려요
  const dev = useLocalSearchParams<{ now?: string; season?: string; plan?: string }>();
  useState(() => applyDevParams(dev));
  useEffect(() => applyDevPlan(dev.plan), [dev.plan]);

  // 3 /me — 받아 온 값은 MeSync 가 state/me 에 넣어요 (src/api/provider.tsx). 여기서는 불러오는 중 · 오류만 봐요
  const me = useQuery(meQuery());
  const name = useMe((m) => m.name);
  const plan = useMe((m) => m.plan);
  const unread = useUnreadCount();
  const scroll = useRef<ScrollViewInstance>(null);
  useTabReselect('home', () => scroll.current?.scrollTo({ y: 0, animated: true }));
  const mapY = useRef(0);

  // 출석: 시트(사전 출석 · 출석 · 완료) → QR 스캐너 (프로토타입 openSheet · openScanner)
  const [sheet, setSheet] = useState<AttendSheetMode | null>(null);
  const [scan, setScan] = useState<{ slot: number; lang: number } | null>(null);

  // 9 사전 출석 · 10 QR 출석 (src/api/home.ts)
  const refreshToday = () => queryClient.invalidateQueries({ queryKey: queryKeys.sessionsToday });
  const rsvp = useMutation({
    mutationFn: sendRsvp,
    onSuccess: (_, v) => {
      showToast(`${summary(v.slot, v.lang)} 참석을 알렸어요`);
      refreshToday();
    },
    onError: (e) => showToast(errorMessage(e)),
  });
  const attendance = useMutation({
    mutationFn: sendAttendance,
    onSuccess: () => {
      setSheet('done');
      refreshToday();
    },
    onError: (e) => showToast(errorMessage(e)),
  });

  const confirm = (mode: SheetMode, slot: number, lang: number) => {
    setSheet(null);
    if (mode === 'rsvp') {
      rsvp.mutate({ slot, lang });
      return;
    }
    // 시트가 내려간 뒤 스캐너
    setTimeout(() => setScan({ slot, lang }), 220);
  };
  const scanned = (qr: string) => {
    const s = scan ?? { slot: getAttend().slot, lang: getAttend().lang };
    setScan(null);
    attendance.mutate({ slot: s.slot, lang: s.lang, qr });
  };

  const continueGoal = () => {
    scroll.current?.scrollTo({ y: Math.max(0, mapY.current - 20), animated: true });
    askCurrentStop();
  };

  if (me.isPending || (me.isError && !me.data)) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]} edges={['top']}>
        {me.isPending ? <LoadingState /> : <ErrorState message={errorMessage(me.error)} onRetry={() => me.refetch()} />}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView ref={scroll} contentContainerStyle={styles.body}>
        {/* 칸마다 조금씩 늦게 아래에서 올라와요 (프로토타입 .rise · 0 / .04 / .06 / .1 / .14 / .26초) */}
        <Appear kind="rise" style={styles.head}>
          <Logo />
          <Pressable
            onPress={() => {
              sfx('tap');
              router.push('/notifications');
            }}
            accessibilityRole="button"
            accessibilityLabel={unread ? `알림 · 안 읽은 알림 ${unread}개` : '알림'}>
            {({ pressed }) => (
              <Raised radius={14} pressed={pressed}>
                <View style={styles.iconBtn}>
                  <LineIcon d={BELL} size={20} width={2.2} />
                  {unread > 0 && <View style={styles.bellDot} />}
                </View>
              </Raised>
            )}
          </Pressable>
        </Appear>

        <Appear kind="rise" delay={40}>
          <Greeting name={name} />
        </Appear>
        <Appear kind="rise" delay={60}>
          <NoticeStrip />
        </Appear>
        <Appear kind="rise" delay={100}>{plan === 'app' ? <GoalCard onContinue={continueGoal} /> : <SessionCard onOpen={setSheet} />}</Appear>
        <Appear kind="rise" delay={140} onLayout={(e) => (mapY.current = e.nativeEvent.layout.y)}>
          <StudyMap />
        </Appear>
        <Appear kind="rise" delay={260}>
          <LoungePreview />
        </Appear>
      </ScrollView>

      <AttendSheet mode={sheet} onClose={() => setSheet(null)} onConfirm={confirm} />
      <QrScanner
        open={!!scan}
        summaryText={scan ? summary(scan.slot, scan.lang) : ''}
        onClose={() => setScan(null)}
        onChange={() => {
          setScan(null);
          setSheet('checkin');
        }}
        onScanned={scanned}
      />
      <LaunchPopup />
    </SafeAreaView>
  );
}

/** "Hey Tammy, / let's [talk!]" — talk! 은 노란 형광펜 상자 */
function Greeting({ name }: { name: string }) {
  return (
    <View style={styles.greet} accessibilityRole="header" accessibilityLabel={`Hey ${name}, let’s talk!`}>
      <PText variant="display">Hey {name},</PText>
      <View style={styles.greetRow}>
        <PText variant="display">let’s </PText>
        <View style={styles.mark}>
          <PText variant="display">talk!</PText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  center: { justifyContent: 'center' },
  body: { paddingHorizontal: Spacing.gutter, paddingTop: 12, paddingBottom: TabBarSpace + 40, gap: Spacing.stack },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  // .icon-btn.has-dot::after: 안 읽은 알림이 있으면 분홍 점
  bellDot: { position: 'absolute', top: 9, right: 10, width: 9, height: 9, borderRadius: 4.5, backgroundColor: Colors.rosePink, borderWidth: 2, borderColor: Colors.white },
  greet: { marginTop: 6, marginHorizontal: 2 },
  greetRow: { flexDirection: 'row', alignItems: 'center' },
  mark: { backgroundColor: Colors.yellow, borderWidth: 2, borderColor: Colors.ink, borderRadius: 8, paddingHorizontal: 6 },
});
