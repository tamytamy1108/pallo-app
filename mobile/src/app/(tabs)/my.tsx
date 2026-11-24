import { router, type Href } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, type ScrollViewInstance, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Pressable } from '@/components/ui/pressable';
import { MyStudyCard } from '@/components/account/my-study-card';
import { ProNoteCard } from '@/components/account/pro-note-card';
import { BranchBoard } from '@/components/my/branch-board';
import { GearIcon, LgIcon } from '@/components/my/icons';
import { BadgeGrid, MyList, MyStats, RankSummary, SecHead } from '@/components/my/my-blocks';
import { MyHero } from '@/components/my/my-hero';
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
export default function MyScreen() {
  const scroll = useRef<ScrollViewInstance>(null);
  useTabReselect('my', () => scroll.current?.scrollTo({ y: 0, animated: true }));
  const { width } = useWindowDimensions();
  const me = useMe();
  const saved = useSavedCount();
  const [follow, setFollow] = useState<'fing' | 'fer' | null>(null);
  const [badges, setBadges] = useState(false);
  const [meets, setMeets] = useState<'joined' | 'saved' | null>(null);
  const [askReset, setAskReset] = useState(false);

  const people = rankPeople('w', me);
  const myRank = people.findIndex((p) => p.me) + 1;
  // 카드 폭 = 놓인 자리 폭 - 그림자 4 (재기 전에는 화면 - 양쪽 16 - 그림자 4).
  // 화면 폭으로만 셈하면 넓은 화면에서 카드보다 자리가 넓어져 오른쪽에 그림자 판이 드러나요.
  const [heroSlotW, setHeroSlotW] = useState(0);
  const cardW = (heroSlotW || width - Spacing.gutter * 2) - SHADOW_OFFSET;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView ref={scroll} contentContainerStyle={styles.body}>
        <Appear kind="rise" style={styles.head}>
          <PText variant="headline" accessibilityRole="header">
            마이
          </PText>
          <Pressable onPress={go('/me/settings')} accessibilityRole="button" accessibilityLabel="설정">
            {({ pressed }) => (
              <Raised radius={14} pressed={pressed}>
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
              { ic: 'users', v: `${me.joinedMeets}개`, l: '참여 중인 모임', onPress: () => setMeets('joined') },
              { ic: 'heart', v: `${MY_BADGES.filter((b) => b.on).length}개`, l: '받은 배지', onPress: () => setBadges(true) },
            ]}
          />
        </Appear>

        <Appear kind="rise" delay={80}>
          <ProNoteCard />
        </Appear>
        <Appear kind="rise" delay={100}>
          <MyStudyCard />
        </Appear>
        <Appear kind="rise" delay={120}>
          <BranchBoard />
        </Appear>

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
              { label: '내 모임', icon: <LgIcon name="users" size={18} />, value: `${me.joinedMeets}개`, onPress: () => setMeets('joined') },
              { label: '찜한 모임', icon: <LgIcon name="heart" size={18} />, value: `${me.savedMeets}개`, onPress: () => setMeets('saved') },
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
              { label: '설정', onPress: go('/me/settings') },
              { label: '고객센터 · 자주 묻는 질문', onPress: go('/me/support') },
              { label: '이용권 · 결제 내역', onPress: go('/me/pass') },
            ]}
          />
        </Appear>

        {/* 개발용 입구: 출시 전에 빼요 */}
        <View style={styles.dev}>
          <Button label="디자인 부품 보기" variant="secondary" onPress={() => router.push('/design')} />
          <Button label="기기에 저장한 기록 지우기" variant="secondary" onPress={() => setAskReset(true)} />
        </View>
      </ScrollView>

      <FollowSheet name={follow ? me.name : null} tab={follow ?? 'fer'} onTab={setFollow} onClose={() => setFollow(null)} />
      <BadgeSheet open={badges} onClose={() => setBadges(false)} />
      <MeetsSheet kind={meets} onClose={() => setMeets(null)} />
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
  body: { paddingHorizontal: Spacing.gutter, paddingTop: 12, paddingBottom: TabBarSpace + 54, gap: Spacing.stack },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  iconBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  dev: { marginTop: 10, gap: 10 },
});
