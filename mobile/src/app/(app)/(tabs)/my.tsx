import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, type ScrollViewInstance, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from '@/components/ui/safe-area';

import { apiErrorMessage } from '@/api/errors';
import { useMyPage } from '@/api/use-my-page';
import { applyDevMe } from '@/components/home/dev';
import { Pressable } from '@/components/ui/pressable';
import { MyStudyCard } from '@/components/account/my-study-card';
import { MyClassCard } from '@/components/account/my-class-card';
import { SavedChallengesSheet } from '@/components/challenge/saved-sheet';
import { MemberLock } from '@/components/common/member-lock';
import { checkScrollLock, ScrollLock } from '@/components/common/scroll-lock';
import { ProNoteCard } from '@/components/account/pro-note-card';
import { BranchBoard } from '@/components/my/branch-board';
import { DevPersonaPill } from '@/components/my/dev-persona';
import { GearIcon, LgIcon } from '@/components/my/icons';
import { BadgeGrid, MyList, MyStats, RankSummary, SecHead } from '@/components/my/my-blocks';
import { MyHero } from '@/components/my/my-hero';
import { MyMeetsSheet } from '@/components/my/my-meets-sheet';
import { BadgeSheet, FollowSheet, MeetsSheet } from '@/components/my/my-sheets';
import { Appear } from '@/components/ui/appear';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { Raised, SHADOW_OFFSET } from '@/components/ui/raised';
import { PText } from '@/components/ui/text';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-view';
import { showToast } from '@/components/ui/toast';
import { Colors, Spacing, TabBarSpace, TabHeadTop } from '@/constants/theme';
import { sfx } from '@/lib/feedback';
import { clearSavedData } from '@/lib/store';
import { isMember } from '@/state/access';
import { useMe } from '@/state/me';
import { grantReward, resetRewards } from '@/state/rewards';
import { useTabReselect } from '@/lib/tab-reselect';
import { usePullRefresh } from '@/components/ui/pull-refresh';

// 마이 B 화면(설정 · 고객센터 · 이용권)은 아직 없을 수 있어서 주소 타입을 넓혀 둬요
const go = (href: string) => () => {
  sfx('tap');
  router.push(href as Href);
};

/**
 * 마이 (프로토타입 renderMy): 제목 · 톱니 → 캐릭터 룸 카드 → 숫자 4칸 → PRO'S NOTE → 내 스터디(프로는 내 수업) → 지점 안내
 * → 랭킹 요약 → 배지 → 내 활동 → 설정 · 상담 신청 내역(체험 전만) · 버그 보고. 맨 아래 개발용 입구.
 * 칸은 마이 BFF(GET /me/mypage)가 준 것만 그려요 — proStats · myClasses 가 오면 프로 마이, proNote · study · badges 가 null 이면 그 칸을 안 그려요.
 */
/** 비회원이 볼 수 있는 잠김 칸 위 높이 (랭킹 윗부분) */
const MY_PEEK = 300;

/** 숫자 칸 · 개수 표시: 아직 못 받았거나 순위가 없으면(null) '–' */
const num = (v: number | null | undefined, unit: string) => (v == null ? '–' : `${v.toLocaleString()}${unit}`);

export default function MyScreen() {
  const pull = usePullRefresh();
  const scroll = useRef<ScrollViewInstance>(null);
  useTabReselect('my', (animated) => scroll.current?.scrollTo({ y: 0, animated }));
  const { width } = useWindowDimensions();
  // 개발용 ?link= · ?name= (웹에서만)
  const dev = useLocalSearchParams<{ link?: string; name?: string; trial?: string; reward?: string; open?: string }>();
  useEffect(() => applyDevMe({ link: dev.link, name: dev.name, trial: dev.trial }), [dev.link, dev.name, dev.trial]);
  // 개발용 ?reward=santa: 서버가 시즌 보상을 자동으로 넣어 준 것처럼 (받은 창 · 알림 · 꾸미기 잠김 풀림). ?reward=reset 은 처음으로
  useEffect(() => {
    if (!__DEV__ || !dev.reward) return;
    if (dev.reward === 'reset') resetRewards();
    else grantReward(dev.reward);
  }, [dev.reward]);
  const me = useMe();
  const [classOpen, setClassOpen] = useState(false);
  // 설정은 누구나 (비회원도 로그아웃 · 알림 · 차단). 회원 전용 줄은 설정 안에서 숨겨요
  const openSettings = go('/me/settings');
  // 숫자 4칸 · PRO'S NOTE · 내 수업 · 내 스터디 · 랭킹 요약 · 배지 · 내 활동 개수 = GET /me/mypage (api/use-my-page.ts)
  const page = useMyPage();
  const my = page.data;
  // 지점 회원인지 = 마이 BFF branchMember (받기 전엔 GET /me 판정으로 — 회원에게 잠김 칸이 잠깐 비치지 않게)
  const member = my ? my.branchMember : isMember(me);
  // 프로 마이인지는 서버가 정해요 (프로 숫자 칸이 오면 프로)
  const proStats = my?.proStats ?? null;
  const [follow, setFollow] = useState<'fing' | 'fer' | null>(null);
  const [badges, setBadges] = useState(false);
  const [meets, setMeets] = useState<'joined' | 'saved' | null>(null);
  const [chals, setChals] = useState(false);
  const [askReset, setAskReset] = useState(false);
  const [myMeetsOpen, setMyMeetsOpen] = useState(false);
  // 토스트 [보러가기] → /my?open=saved-meets · joined-meets · saved-challenges 로 오면 그 목록 시트를 바로 열어요
  // (렌더 중에 이전 값과 비교해 한 번만 열고, 주소의 open 은 지워요)
  const [seenOpen, setSeenOpen] = useState<string | undefined>(undefined);
  // /my?open=study (연기 · 변경 신청 뒤 확인) → 내 스터디 칸까지 내려가요 (칸 자리를 재면 그때 내려가요)
  const studyY = useRef<number | null>(null);
  const [toStudy, setToStudy] = useState(false);
  if (dev.open !== seenOpen) {
    setSeenOpen(dev.open);
    if (dev.open === 'study') setToStudy(true);
    if (dev.open === 'saved-meets') setMeets('saved');
    else if (dev.open === 'joined-meets') setMyMeetsOpen(true);
    else if (dev.open === 'saved-challenges') setChals(true);
  }
  useEffect(() => {
    if (dev.open) router.setParams({ open: undefined });
  }, [dev.open]);
  // 이미 내 스터디 칸 자리를 쟀으면 (마이가 열려 있던 채로 돌아오면) 바로 내려가요
  useEffect(() => {
    if (!toStudy || studyY.current == null) return;
    setToStudy(false);
    const y = studyY.current;
    requestAnimationFrame(() => scroll.current?.scrollTo({ y: Math.max(0, y - 12), animated: true }));
  }, [toStudy]);

  // 카드 폭 = 놓인 자리 폭 - 그림자 4 (재기 전에는 화면 - 양쪽 16 - 그림자 4).
  // 화면 폭으로만 셈하면 넓은 화면에서 카드보다 자리가 넓어져 오른쪽에 그림자 판이 드러나요.
  const [heroSlotW, setHeroSlotW] = useState(0);
  const cardW = (heroSlotW || width - Spacing.gutter * 2) - SHADOW_OFFSET;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView refreshControl={pull.refreshControl} onScrollBeginDrag={pull.onScrollBeginDrag} onScrollEndDrag={pull.onScrollEndDrag} ref={scroll} contentContainerStyle={styles.body} onScroll={(e) => {
          pull.onScroll(e);
          checkScrollLock('my');
        }} scrollEventThrottle={64}>
        <Appear kind="rise" style={styles.head}>
          {/* 화면 제목은 영어 · 탭 버튼은 한국어 그대로 (2026-11-25) */}
          <PText variant="headline" accessibilityRole="header" accessibilityLabel="마이">
            My page
          </PText>
          <View style={styles.headR}>
            {/* 개발용 사람 바꾸기 (개발 서버에서만) */}
            <DevPersonaPill />
            <Pressable onPress={openSettings} accessibilityRole="button" accessibilityLabel="설정">
              {({ pressed }) => (
                <Raised radius={14} pressed={pressed}>
                  <View style={styles.iconBtn}>
                    <GearIcon />
                  </View>
                </Raised>
              )}
            </Pressable>
          </View>
        </Appear>

        <Appear kind="rise" delay={40}>
          <View onLayout={(e) => setHeroSlotW(Math.round(e.nativeEvent.layout.width))}>
            <MyHero width={cardW} sparks={my?.sparks} follow={my?.follow} onFollow={setFollow} />
          </View>
        </Appear>

        <Appear kind="rise" delay={60}>
          <MyStats
            items={
              proStats
                ? // 프로: 연속 학습(앱 학습 코너) · 출석률(맡은 세션 중 프로로 참여) · 보낸 노트 · 받은 고마워요 (2026-11-26)
                  [
                    { ic: 'flame', v: num(my?.stats.streakDays, '일'), l: '연속 학습', onPress: go('/me/ranking') },
                    // 프로 = 출석률(맡은 세션 중) · 스텝 = 참여한 세션(프로로 출석 체크한 누적 수 — 맡은 세션이 없어서)
                    me.role === 'manager'
                      ? { ic: 'bolt', v: num(proStats.sessionsTotal, '회'), l: '참여한 세션', onPress: () => setClassOpen(true) }
                      : { ic: 'bolt', v: num(proStats.attendanceRate, '%'), l: '출석률', onPress: () => setClassOpen(true) },
                    { ic: 'mic', v: num(proStats.notesSent, '개'), l: '보낸 노트', onPress: go('/me/notes?box=sent') },
                    { ic: 'heart', v: num(proStats.thanksReceived, '개'), l: '받은 고마워요', onPress: go('/me/notes?box=sent') },
                  ]
                : [
                    { ic: 'flame', v: num(my?.stats.streakDays, '일'), l: '연속 학습', onPress: go('/me/ranking') },
                    { ic: 'crown', v: num(my?.stats.weekRank, '위'), l: '이번 주 랭킹', onPress: go('/me/ranking') },
                    { ic: 'users', v: num(my?.stats.joinedMeetCount, '개'), l: '참여중', onPress: () => setMyMeetsOpen(true) },
                    { ic: 'heart', v: num(my?.stats.badgeCount, '개'), l: '받은 배지', onPress: () => setBadges(true) },
                  ]
            }
          />
        </Appear>

        {/* PRO'S NOTE · 내 수업(프로) / 내 스터디 = 서버가 준 칸만 · 지점 안내 = 회원만 */}
        {my?.proNote ? (
          <Appear kind="rise" delay={80}>
            <ProNoteCard note={my.proNote} />
          </Appear>
        ) : null}
        {my?.myClasses ? (
          // 프로: 이용권 · 팀 대신 이번 주 맡은 세션 (내 일정 전체 보기)
          // 제목과 카드 사이는 다른 칸(랭킹 · 배지)과 같은 간격
          <Appear kind="rise" delay={100}>
            <View style={styles.stack}>
              <SecHead title="내 수업" />
              <MyClassCard classes={my.myClasses.thisWeek} open={classOpen} onOpen={setClassOpen} />
            </View>
          </Appear>
        ) : my?.study ? (
          <Appear kind="rise" delay={100}>
            <View
              onLayout={(e) => {
                studyY.current = e.nativeEvent.layout.y;
                if (toStudy) {
                  setToStudy(false);
                  scroll.current?.scrollTo({ y: Math.max(0, e.nativeEvent.layout.y - 12), animated: true });
                }
              }}>
              {/* 제목 옆 '전체 보기 ›' → 내 스터디 화면 (랭킹 · 배지와 같은 머리줄) */}
              <SecHead title="내 스터디" more="전체 보기 ›" onMore={go('/me/study')} />
              <MyStudyCard study={my.study} title={false} />
            </View>
          </Appear>
        ) : null}
        {member && (
          <Appear kind="rise" delay={120}>
            <BranchBoard />
          </Appear>
        )}

        {/* 비회원: 랭킹 윗부분까지만 보이고 아래는 '지점 회원이 되면 열려요' 칸 (스크롤 잠김 · components/common/scroll-lock) */}
        <ScrollLock screen="my" peek={MY_PEEK} panel={<MemberLock />} locked={!member}>
          <View style={styles.stack}>
            <SecHead title="랭킹" more="전체 보기 ›" onMore={go('/me/ranking')} />
            <Appear kind="rise">
              {page.isPending ? (
                <LoadingState />
              ) : page.isError ? (
                <ErrorState message={apiErrorMessage(page.error)} onRetry={() => page.refetch()} />
              ) : (
                <RankSummary podium={page.data.ranking.podium} myRank={page.data.ranking.myRank} myPoints={page.data.ranking.myPoints} branch={me.branch} onPress={go('/me/ranking')} />
              )}
            </Appear>

            {/* 배지: 서버가 칸을 안 주면(null) 안 그려요 · 받은 게 하나도 없으면(빈 목록) 칸은 두고 빈 상태 문구 */}
            {my?.badges && (
              <>
                <SecHead title="배지" more="모두 보기 ›" onMore={() => setBadges(true)} />
                <Appear kind="rise">{my.badges.length ? <BadgeGrid list={my.badges} /> : <EmptyState title="아직 받은 배지가 없어요" compact />}</Appear>
              </>
            )}

            <SecHead title="내 활동" more="전체 보기 ›" onMore={go('/me/expressions')} />
            <Appear kind="rise">
              <MyList
                rows={[
                  { label: '내 모임', icon: <LgIcon name="users" size={18} />, value: num(my?.activity.joinedMeetCount, '개'), onPress: () => setMyMeetsOpen(true) },
                  { label: '찜한 모임', icon: <LgIcon name="heart" size={18} />, value: num(my?.activity.savedMeetCount, '개'), onPress: () => setMeets('saved') },
                  { label: '찜한 챌린지', icon: <LgIcon name="heart" size={18} />, value: num(my?.activity.savedChallengeCount, '개'), onPress: () => setChals(true) },
                  {
                    label: '내가 쓴 글',
                    icon: <LgIcon name="image" size={18} />,
                    value: num(my?.activity.postCount, '개'),
                    onPress: () => {
                      sfx('tap');
                      router.push('/lounge');
                      showToast('내가 쓴 글은 커뮤니티에서 볼 수 있어요');
                    },
                  },
                  { label: '내 표현함', icon: <LgIcon name="save" size={18} />, value: num(my?.activity.savedExpressionCount, '개'), onPress: go('/me/expressions') },
                  { label: '랭킹 · 퀘스트', icon: <LgIcon name="flame" size={18} />, onPress: go('/me/ranking') },
                ]}
              />
            </Appear>
          </View>
        </ScrollLock>

        {/* 아래 메뉴는 잠김 칸 밖 — 비회원도 상담 신청 내역 · 버그 보고에 갈 수 있게. 자주 묻는 질문은 설정 안 · 이용권 · 결제 내역 줄은 뺐어요 (2026-11-26) */}
        <Appear kind="rise">
          <MyList
            rows={[
              { label: '설정', onPress: openSettings },
              // 상담 신청 내역은 체험 전(지점 회원이 아닌) 사람만 — 회원에게는 줄을 안 보여요
              ...(member ? [] : [{ label: '상담 신청 내역', onPress: go('/me/consultations') }]),
              { label: '버그 보고', onPress: go('/me/support?view=bug') },
            ]}
          />
        </Appear>

        {/* 개발용 입구: 개발 서버(__DEV__)에서만 보여요 — 실제 앱에는 안 나와요 */}
        {__DEV__ ? (
          <View style={styles.dev}>
            <Button label="기기에 저장한 기록 지우기" variant="secondary" onPress={() => setAskReset(true)} />
          </View>
        ) : null}
      </ScrollView>

      <FollowSheet name={follow ? me.name : null} tab={follow ?? 'fer'} onTab={setFollow} onClose={() => setFollow(null)} />
      <BadgeSheet open={badges} onClose={() => setBadges(false)} />
      <MeetsSheet kind={meets} onClose={() => setMeets(null)} />
      <MyMeetsSheet open={myMeetsOpen} onClose={() => setMyMeetsOpen(false)} />
      <SavedChallengesSheet open={chals} onClose={() => setChals(false)} />
      <ConfirmDialog
        open={askReset}
        title="저장한 기록을 지울까요?"
        message="진도 · 포인트 · 꾸미기 · 설정이 처음 상태로 돌아가요 (개발용)."
        confirmLabel="지우기"
        destructive
        onCancel={() => setAskReset(false)}
        onConfirm={() => {
          setAskReset(false);
          clearSavedData();
          showToast('기기에 저장한 기록을 지웠어요');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  body: { paddingHorizontal: Spacing.gutter, paddingTop: TabHeadTop, paddingBottom: TabBarSpace + 54, gap: Spacing.stack },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 44, marginTop: Spacing.headDrop, marginBottom: 4 - Spacing.headDrop },
  headR: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  dev: { marginTop: 10, gap: 10 },
  stack: { gap: Spacing.stack },
});
