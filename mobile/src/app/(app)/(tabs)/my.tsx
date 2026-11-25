import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, type ScrollViewInstance, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { applyDevMe } from '@/components/home/dev';
import { Pressable } from '@/components/ui/pressable';
import { MyStudyCard } from '@/components/account/my-study-card';
import { SavedChallengesSheet, useSavedChallengeCount } from '@/components/challenge/saved-sheet';
import { MemberLock } from '@/components/common/member-lock';
import { memberGate } from '@/components/common/trial-guide';
import { checkScrollLock, ScrollLock } from '@/components/common/scroll-lock';
import { ProNoteCard } from '@/components/account/pro-note-card';
import { BranchBoard } from '@/components/my/branch-board';
import { GearIcon, LgIcon } from '@/components/my/icons';
import { BadgeGrid, MyList, MyStats, RankSummary, SecHead } from '@/components/my/my-blocks';
import { MyHero } from '@/components/my/my-hero';
import { MyMeetsSheet, useMyMeetCounts } from '@/components/my/my-meets-sheet';
import { BadgeSheet, FollowSheet, MeetsSheet } from '@/components/my/my-sheets';
import { Appear } from '@/components/ui/appear';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { Raised, SHADOW_OFFSET } from '@/components/ui/raised';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Colors, Spacing, TabBarSpace } from '@/constants/theme';
import { MY_BADGES, rankPeople } from '@/data/my';
import { sfx } from '@/lib/feedback';
import { clearSavedData } from '@/lib/store';
import { useSavedCount } from '@/state/expressions';
import { canUse, isMember } from '@/state/access';
import { useMe } from '@/state/me';
import { useTabReselect } from '@/lib/tab-reselect';

// 마이 B 화면(설정 · 고객센터 · 이용권)은 아직 없을 수 있어서 주소 타입을 넓혀 둬요
const go = (href: string) => () => {
  sfx('tap');
  router.push(href as Href);
};

/**
 * 마이 (프로토타입 renderMy): 제목 · 톱니 → 캐릭터 룸 카드 → 숫자 4칸 → PRO'S NOTE → 내 스터디 → 지점 안내
 * → 랭킹 요약 → 배지 → 내 활동 → 설정 · 고객센터 · 이용권. 맨 아래 개발용 입구.
 */
/** 비회원이 볼 수 있는 잠김 칸 위 높이 (랭킹 윗부분) */
const MY_PEEK = 300;

export default function MyScreen() {
  const scroll = useRef<ScrollViewInstance>(null);
  useTabReselect('my', () => scroll.current?.scrollTo({ y: 0, animated: true }));
  const { width } = useWindowDimensions();
  // 개발용 ?link= · ?name= (웹에서만)
  const dev = useLocalSearchParams<{ link?: string; name?: string; trial?: string }>();
  useEffect(() => applyDevMe({ link: dev.link, name: dev.name, trial: dev.trial }), [dev.link, dev.name, dev.trial]);
  const me = useMe();
  const member = isMember(me);
  const canSettings = canUse(me, 'settings');
  const openSettings = canSettings ? go('/me/settings') : () => memberGate('설정을 쓰려면');
  const saved = useSavedCount();
  const [follow, setFollow] = useState<'fing' | 'fer' | null>(null);
  const [badges, setBadges] = useState(false);
  const [meets, setMeets] = useState<'joined' | 'saved' | null>(null);
  const savedChal = useSavedChallengeCount();
  const [chals, setChals] = useState(false);
  const [askReset, setAskReset] = useState(false);
  const [myMeetsOpen, setMyMeetsOpen] = useState(false);
  const myMeets = useMyMeetCounts();

  const people = rankPeople('w', me);
  const myRank = people.findIndex((p) => p.me) + 1;
  // 카드 폭 = 놓인 자리 폭 - 그림자 4 (재기 전에는 화면 - 양쪽 16 - 그림자 4).
  // 화면 폭으로만 셈하면 넓은 화면에서 카드보다 자리가 넓어져 오른쪽에 그림자 판이 드러나요.
  const [heroSlotW, setHeroSlotW] = useState(0);
  const cardW = (heroSlotW || width - Spacing.gutter * 2) - SHADOW_OFFSET;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView ref={scroll} contentContainerStyle={styles.body} onScroll={() => checkScrollLock('my')} scrollEventThrottle={64}>
        <Appear kind="rise" style={styles.head}>
          <PText variant="headline" accessibilityRole="header">
            마이
          </PText>
          {/* 설정은 회원만: 비회원은 흐리게 · 누르면 잠김 1번 */}
          <Pressable onPress={openSettings} accessibilityRole="button" accessibilityLabel="설정" accessibilityHint={canSettings ? undefined : '지점 회원이 되면 쓸 수 있어요'} style={!canSettings && styles.off}>
            {({ pressed }) => (
              <Raised radius={14} pressed={pressed && canSettings} flat={!canSettings}>
                <View style={styles.iconBtn}>
                  <GearIcon />
                </View>
              </Raised>
            )}
          </Pressable>
        </Appear>

        <Appear kind="rise" delay={40}>
          <View onLayout={(e) => setHeroSlotW(Math.round(e.nativeEvent.layout.width))}>
            <MyHero width={cardW} onFollow={setFollow} />
          </View>
        </Appear>

        <Appear kind="rise" delay={60}>
          <MyStats
            items={[
              { ic: 'flame', v: `${me.streak}일`, l: '연속 학습', onPress: go('/me/ranking') },
              { ic: 'crown', v: `${myRank}위`, l: '이번 주 랭킹', onPress: go('/me/ranking') },
              { ic: 'users', v: `${myMeets.active}개`, l: '참여 중인 모임', onPress: () => setMyMeetsOpen(true) },
              { ic: 'heart', v: `${MY_BADGES.filter((b) => b.on).length}개`, l: '받은 배지', onPress: () => setBadges(true) },
            ]}
          />
        </Appear>

        {/* 회원만: PRO'S NOTE · 내 스터디 · 지점 안내 */}
        {member && (
          <>
            <Appear kind="rise" delay={80}>
              <ProNoteCard />
            </Appear>
            <Appear kind="rise" delay={100}>
              <MyStudyCard />
            </Appear>
            <Appear kind="rise" delay={120}>
              <BranchBoard />
            </Appear>
          </>
        )}

        {/* 비회원: 랭킹 윗부분까지만 보이고 아래는 '지점 회원이 되면 열려요' 칸 (스크롤 잠김 · components/common/scroll-lock) */}
        <ScrollLock screen="my" peek={MY_PEEK} panel={<MemberLock />}>
          <View style={styles.stack}>
            <SecHead title="랭킹" more="전체 보기 ›" onMore={go('/me/ranking')} />
            <Appear kind="rise">
              <RankSummary people={people} myRank={myRank} branch={me.branch} onPress={go('/me/ranking')} />
            </Appear>

            <SecHead title="배지" more="모두 보기 ›" onMore={() => setBadges(true)} />
            <Appear kind="rise">
              <BadgeGrid list={MY_BADGES.slice(0, 4)} />
            </Appear>

            <SecHead title="내 활동" more="전체 보기 ›" onMore={go('/me/expressions')} />
            <Appear kind="rise">
              <MyList
                rows={[
                  { label: '내 모임', icon: <LgIcon name="users" size={18} />, value: `${myMeets.total}개`, onPress: () => setMyMeetsOpen(true) },
                  { label: '찜한 모임', icon: <LgIcon name="heart" size={18} />, value: `${me.savedMeets}개`, onPress: () => setMeets('saved') },
                  { label: '찜한 챌린지', icon: <LgIcon name="heart" size={18} />, value: `${savedChal}개`, onPress: () => setChals(true) },
                  {
                    label: '내가 쓴 글',
                    icon: <LgIcon name="image" size={18} />,
                    value: `${me.postCount}개`,
                    onPress: () => {
                      sfx('tap');
                      router.push('/lounge');
                      showToast('내가 쓴 글은 커뮤니티에서 볼 수 있어요');
                    },
                  },
                  { label: '내 표현함', icon: <LgIcon name="save" size={18} />, value: `${saved}개`, onPress: go('/me/expressions') },
                  { label: '랭킹 · 퀘스트', icon: <LgIcon name="flame" size={18} />, onPress: go('/me/ranking') },
                ]}
              />
            </Appear>
            <Appear kind="rise">
              <MyList
                rows={[
                  { label: '설정', onPress: openSettings },
                  { label: '고객센터 · 자주 묻는 질문', onPress: go('/me/support') },
                  // 이용권은 회원만 · 앱 구독자는 결제 내역만
                  ...(member ? [{ label: '이용권 · 결제 내역', onPress: go('/me/pass') }] : me.plan === 'app' ? [{ label: '결제 내역', onPress: go('/me/payments') }] : []),
                ]}
              />
            </Appear>
          </View>
        </ScrollLock>

        {/* 개발용 입구: 개발 서버(__DEV__)에서만 보여요 — 실제 앱에는 안 나와요 */}
        {__DEV__ ? (
          <View style={styles.dev}>
            <Button label="디자인 부품 보기" variant="secondary" onPress={() => router.push('/design')} />
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
  body: { paddingHorizontal: Spacing.gutter, paddingTop: 0, paddingBottom: TabBarSpace + 54, gap: Spacing.stack },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  iconBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  dev: { marginTop: 10, gap: 10 },
  stack: { gap: Spacing.stack },
  off: { opacity: 0.4 },
});
