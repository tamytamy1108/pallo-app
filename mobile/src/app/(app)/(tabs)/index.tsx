import { useMutation, useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from '@/components/ui/safe-area';

import { apiErrorMessage } from '@/api/errors';
import { sendAttendance, sendRsvp } from '@/api/home';
import { meQuery, queryKeys } from '@/api/queries';
import { queryClient } from '@/api/query-client';
import { guardMember } from '@/components/common/trial-guide';
import { Pressable } from '@/components/ui/pressable';
import { AttendSheet, type AttendSheetMode } from '@/components/home/attend-sheet';
import { getAttend, minuteOf, nowDate, openTeams, slotSelectable, summary, type SheetMode } from '@/components/home/attendance';
import { setDecoOnScreen } from '@/components/home/deco-on-screen';
import { applyDevAdmin, applyDevMe, applyDevParams, applyDevPlan } from '@/components/home/dev';
import { GoalCard } from '@/components/home/goal-card';
import { Greeting } from '@/components/home/greeting';
import { LineIcon } from '@/components/home/icons';
import { InviteSheet } from '@/components/home/invite-sheet';
import { LaunchPopup } from '@/components/home/launch-popup';
import { LinkAdminDev } from '@/components/home/link-admin-dev';
import { LoungePreview } from '@/components/home/lounge-preview';
import { askCurrentStop } from '@/components/home/map-state';
import { useUnreadCount } from '@/components/home/noti-state';
import { NoticeStrip } from '@/components/home/notice-strip';
import { QrScanner } from '@/components/home/qr-scanner';
import { HomeCard } from '@/components/home/home-card';
import { StudyMap } from '@/components/home/study-map';
import { Logo } from '@/components/logo';
import { Appear } from '@/components/ui/appear';
import { Raised } from '@/components/ui/raised';
import { ErrorState, LoadingState } from '@/components/ui/state-view';
import { showToast } from '@/components/ui/toast';
import { Colors, Spacing, TabBarSpace, TabHeadTop } from '@/constants/theme';
import { sfx } from '@/lib/feedback';
import { LANGS, SLOTS } from '@/data/home';
import { shouldAskInvite } from '@/state/invite-prompt';
import { useMe } from '@/state/me';
import { useTabReselect } from '@/lib/tab-reselect';

const BELL = 'M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0';

/** 홈: 로고 · 알림 → 인사 → 공지 띠 → 오늘 스터디 카드(앱 구독자는 오늘의 목표) → 스터디 맵 → 라운지 미리보기. */
export default function HomeScreen() {
  // 개발용 주소 값 (?now= · ?season= · ?plan= · ?link= · ?admin=) — 웹에서만, 화면엔 아무것도 안 그려요
  const dev = useLocalSearchParams<{ now?: string; season?: string; plan?: string; link?: string; name?: string; admin?: string; trial?: string; follow?: string; attend?: string; slot?: string; lang?: string }>();
  useState(() => applyDevParams(dev));
  useEffect(() => applyDevPlan(dev.plan), [dev.plan]);
  useEffect(() => applyDevMe({ link: dev.link, name: dev.name, trial: dev.trial, follow: dev.follow }), [dev.link, dev.name, dev.trial, dev.follow]);
  useEffect(() => applyDevAdmin(dev.admin), [dev.admin]);

  // 3 /me — 받아 온 값은 로그인 상태가 state/me 에 넣어요 (src/api/session.tsx). 여기서는 불러오는 중 · 오류만 봐요
  const me = useQuery(meQuery());
  const name = useMe((m) => m.name);
  const plan = useMe((m) => m.plan);
  const unread = useUnreadCount();
  const scroll = useRef<ScrollViewInstance>(null);
  useTabReselect('home', (animated) => scroll.current?.scrollTo({ y: 0, animated }));
  const mapY = useRef(0);
  const mapH = useRef(0);
  const viewH = useRef(0);

  // 출석: 시트(사전 출석 · 출석 · 완료) → QR 스캐너 (프로토타입 openSheet · openScanner)
  const [sheet, setSheet] = useState<AttendSheetMode | null>(null);
  const [scan, setScan] = useState<{ slot: number; lang: number } | null>(null);
  // 알림 '○○님이 오늘 20:00 영어 세션에 가요. 같이 갈래요?' → /?attend=rsvp&slot=&lang= 로 오면 그 시간 · 언어로 사전 출석 시트
  const [preset, setPreset] = useState<{ slot: number; lang: number } | null>(null);
  // 사전 출석이 끝나면 '함께 가자고 할까요?' (회원 · 팔로우한 멤버 있음 · 2주간 보지 않기 아님)
  const [invite, setInvite] = useState<{ slot: number; lang: number } | null>(null);

  // 9 사전 출석 · 10 QR 출석 (src/api/home.ts)
  const refreshToday = () => queryClient.invalidateQueries({ queryKey: queryKeys.sessionsToday });
  const rsvp = useMutation({
    mutationFn: sendRsvp,
    onSuccess: (_, v) => {
      showToast(`${summary(v.slot, v.lang)} 참석을 알렸어요`);
      refreshToday();
      if (shouldAskInvite()) setTimeout(() => setInvite({ slot: v.slot, lang: v.lang }), 450);
    },
    onError: (e) => showToast(apiErrorMessage(e)),
  });
  const attendance = useMutation({
    mutationFn: sendAttendance,
    onSuccess: () => {
      setSheet('done');
      refreshToday();
    },
    onError: (e) => showToast(apiErrorMessage(e)),
  });

  // 출석 · 사전 출석은 회원만 (state/access — 카드가 이미 나눠 보여 주지만 한 번 더 막아요)
  // 출석체크: 지금 QR 출석이 되는 내 팀이 하나면 바로 그 팀 QR, 둘 이상이면 QR 전에 팀을 고르는 시트
  const openAttend = (mode: AttendSheetMode) =>
    guardMember(() => {
      if (mode === 'checkin') {
        const now = minuteOf(nowDate());
        const ready = openTeams().filter((t) => slotSelectable(t.slot, 'checkin', now));
        if (ready.length === 1) {
          setScan({ slot: ready[0].slot, lang: ready[0].lang });
          return;
        }
      }
      setSheet(mode);
    }, '출석하려면');

  useEffect(() => {
    if (dev.attend !== 'rsvp') return;
    const slot = Number(dev.slot);
    const lang = Number(dev.lang);
    // 비회원이면 체험 안내 · 연동 대기면 토스트 (guardMember)
    guardMember(() => {
      setPreset(SLOTS[slot] && LANGS[lang] ? { slot, lang } : null);
      setSheet('rsvp');
    }, '출석하려면');
    // 한 번 연 뒤엔 주소에서 지워요 (다시 홈에 와도 또 열리지 않게)
    router.setParams({ attend: undefined, slot: undefined, lang: undefined });
  }, [dev.attend, dev.slot, dev.lang]);

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
        {me.isPending ? <LoadingState /> : <ErrorState message={apiErrorMessage(me.error)} onRetry={() => me.refetch()} />}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        ref={scroll}
        contentContainerStyle={styles.body}
        onLayout={(e) => (viewH.current = e.nativeEvent.layout.height)}
        // 스터디 맵 카드가 화면 밖으로 나가면 카드 장식 움직임을 멈춰요 (스크롤이 부드럽게)
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          setDecoOnScreen(y + viewH.current > mapY.current && y < mapY.current + mapH.current);
        }}
        scrollEventThrottle={64}>
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
        <Appear kind="rise" delay={100}>{plan === 'app' ? <GoalCard onContinue={continueGoal} /> : <HomeCard onOpen={openAttend} />}</Appear>
        <Appear
          kind="rise"
          delay={140}
          onLayout={(e) => {
            mapY.current = e.nativeEvent.layout.y;
            mapH.current = e.nativeEvent.layout.height;
          }}>
          <StudyMap />
        </Appear>
        <Appear kind="rise" delay={260}>
          <LoungePreview />
        </Appear>
      </ScrollView>

      <AttendSheet
        mode={sheet}
        preset={preset}
        onClose={() => {
          setSheet(null);
          setPreset(null);
        }}
        onConfirm={confirm}
      />
      <InviteSheet at={invite} onClose={() => setInvite(null)} />
      <QrScanner
        open={!!scan}
        summaryText={scan ? summary(scan.slot, scan.lang) : ''}
        onClose={() => setScan(null)}
        onScanned={scanned}
      />
      <LaunchPopup />
      {/* 지점 연동 결과: 개발용 '지점 처리 흉내' 알약 · 위에서 내려오는 푸시 배너 (state/link-events) */}
      <LinkAdminDev />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  center: { justifyContent: 'center' },
  body: { paddingHorizontal: Spacing.gutter, paddingTop: TabHeadTop, paddingBottom: TabBarSpace + 40, gap: Spacing.stack },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 44, marginTop: Spacing.headDrop, marginBottom: -Spacing.headDrop },
  iconBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  // .icon-btn.has-dot::after: 안 읽은 알림이 있으면 분홍 점
  bellDot: { position: 'absolute', top: 9, right: 10, width: 9, height: 9, borderRadius: 4.5, backgroundColor: Colors.rosePink, borderWidth: 2, borderColor: Colors.white },
});
