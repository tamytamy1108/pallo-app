import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { type ReactNode, useCallback, useRef, useState } from 'react';
import { type NativeScrollEvent, type NativeSyntheticEvent, ScrollView, type ScrollViewInstance, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, withTiming } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pressable } from '@/components/ui/pressable';
import { ChallengeTab } from '@/components/challenge/challenge-tab';
import { useBlockedNames } from '@/components/common/report-sheet';
import { checkScrollLock, ScrollLock } from '@/components/common/scroll-lock';
import { guardMember } from '@/components/common/trial-guide';
import { BranchSelect, branchList, branchValue } from '@/components/lounge/branch-select';
import { CreateSheet, type CreateKind } from '@/components/lounge/create-sheet';
import { LgIcon } from '@/components/lounge/icons';
import { MiniMapCard } from '@/components/lounge/korea-map';
import { LgIn } from '@/components/lounge/lg-in';
import { go } from '@/components/lounge/nav';
import { AbroadCard, PostCard } from '@/components/lounge/post-card';
import { RecChalCard, RecMeetCard } from '@/components/lounge/rec-cards';
import { Section } from '@/components/lounge/section';
import { StoryRow } from '@/components/lounge/story-row';
import { AbroadRegSheet, PeopleRow, PersonSheet, TripCard, TripMakeSheet, WorldMapCard } from '@/components/lounge/trip';
import { MeetTab } from '@/components/meet/meet-tab';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { ALL_SUBS, type AbroadPerson, branchOk, COM_SUBS, type FeedItem, LG_TABS, type LoungeTab, TRIP_SUBS } from '@/data/lounge';
import { setAllSub, setBranches, setComSub, setLoungeTab, setTripMode, useLounge } from '@/data/lounge-store';
import { EASE } from '@/lib/motion';

/**
 * 라운지 (docs/pages/04-lounge.md · 프로토타입 renderLounge · bindLounge, 탭 id azit).
 * 위에서부터: 제목 → 밑줄 탭 → 스토리 줄(추천 · 커뮤니티) → 지점 선택 + 서브 칩 → 탭별 피드. 오른쪽 아래 노랑 + 와 맨 위로.
 * 챌린지 · 번개 · 동아리 탭 본문은 각 담당 컴포넌트를 그대로 넣어요.
 */
/** 비회원이 볼 수 있는 탭 아래 높이 (스토리 줄 + 카드 1~2개) */
const LOUNGE_PEEK = 720;

export default function LoungeScreen() {
  const tab = useLounge((s) => s.tab);
  // /lounge?tab=all|com|chal|meet|trip 로 탭을 바로 열 수 있어요 (랭킹의 챌린지 카드 → ?tab=chal)
  const params = useLocalSearchParams<{ tab?: string }>();
  // 화면에 올 때마다 다시 봐요 (같은 주소로 다시 와도 그 탭으로 — 챌린지를 연 뒤 ?tab=chal 로 돌아올 때)
  useFocusEffect(
    useCallback(() => {
      const t = LG_TABS.find(([k]) => k === params.tab);
      if (!t) return;
      setLoungeTab(t[0]);
      // 한 번 고른 뒤엔 주소에서 지워요 (다른 탭을 보다가 스토리에서 돌아와도 그대로 있게)
      router.setParams({ tab: undefined });
    }, [params.tab]),
  );
  const brs = useLounge((s) => s.brs);
  const region = useLounge((s) => s.region);
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollViewInstance>(null);
  const tabsY = useRef(0);
  const [scrolled, setScrolled] = useState(false);
  const [sheet, setSheetRaw] = useState<null | 'create' | 'trip' | 'abroad'>(null);
  // 동행 · 해외 시트는 열 때마다 입력칸을 새로 비우려고 새로 그려요. 닫히는 움직임이 끝날 때까지는 남겨 둬요
  const [kept, setKept] = useState<null | 'trip' | 'abroad'>(null);
  const setSheet = useCallback((k: null | 'create' | 'trip' | 'abroad') => {
    setSheetRaw(k);
    if (k === 'trip' || k === 'abroad') setKept(k);
  }, []);
  const branch = branchValue(brs);
  const branchBtn = <BranchSelect value={branch} onChange={(v) => setBranches(branchList(v))} />;

  const pickTab = (k: LoungeTab) => {
    setLoungeTab(k);
    // 보던 자리가 탭보다 아래면 탭이 보이는 곳까지 올려요 (프로토타입 lgTab)
    if (scrolled) scroll.current?.scrollTo({ y: Math.max(0, tabsY.current - 8), animated: false });
  };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    if (y > 360 !== scrolled) setScrolled(y > 360);
    checkScrollLock('lounge');
  };
  // 고른 칸은 시트가 다 닫힌 뒤에 열어요. 닫히는 중에 다른 화면 · 시트를 열면 아이폰에서 아무 일도 안 일어나요
  const picked = useRef<CreateKind | null>(null);
  const onCreate = (k: CreateKind) => {
    picked.current = k;
    setSheet(null);
  };
  const afterCreateClosed = () => {
    const k = picked.current;
    picked.current = null;
    if (!k) return;
    if (k === 'plane') return setSheet('trip');
    if (k === 'abroad') return setSheet('abroad');
    go({ photo: '/compose', story: '/story/new', bolt: '/meet/new', club: '/club/new', chal: '/challenge/new' }[k]);
  };

  const fabBottom = Math.max(insets.bottom, 12) + 62 + 26;
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView ref={scroll} onScroll={onScroll} scrollEventThrottle={64} contentContainerStyle={styles.page}>
        <View style={styles.hd}>
          <PText variant="headline" accessibilityRole="header" style={styles.h1}>
            라운지
          </PText>
        </View>
        <View onLayout={(e) => (tabsY.current = e.nativeEvent.layout.y)}>
          <Tabs tab={tab} onPick={pickTab} />
        </View>
        {/* 비회원은 모든 탭에서 위쪽(카드 1~2개)까지만 · 아래는 잠김 칸 (components/common/scroll-lock) */}
        <ScrollLock key={tab} screen="lounge" peek={LOUNGE_PEEK}>
          {tab === 'all' || tab === 'com' ? <StoryRow /> : null}
          {tab === 'chal' ? (
            <ChallengeTab branch={branch} header={branchBtn} />
          ) : tab === 'meet' ? (
            <MeetTab branch={branch} header={branchBtn} region={region} />
          ) : (
            <>
              <SubRow tab={tab} branchBtn={branchBtn} />
              <Feed tab={tab} brs={brs} onMakeTrip={() => guardMember(() => setSheet('trip'), '동행을 구하려면')} onRegAbroad={() => guardMember(() => setSheet('abroad'), '내 카드를 올리려면')} />
            </>
          )}
        </ScrollLock>
      </ScrollView>

      <ToTop show={scrolled} bottom={fabBottom + 60 + 14} onPress={() => scroll.current?.scrollTo({ y: 0, animated: true })} />
      <Pressable onPress={() => guardMember(() => setSheet('create'), '글을 올리려면')} accessibilityRole="button" accessibilityLabel="만들기 (글 · 스토리 · 번개 · 동아리 · 동행)" style={[styles.fabHit, { bottom: fabBottom }]}>
        {({ pressed }) => (
          <View style={[styles.fab, pressed && styles.fabDown]}>
            <LgIcon name="plus" size={28} sw={2.8} />
          </View>
        )}
      </Pressable>

      <CreateSheet open={sheet === 'create'} tab={tab} onClose={() => setSheet(null)} onPick={onCreate} onClosed={afterCreateClosed} />
      {kept === 'trip' ? <TripMakeSheet open={sheet === 'trip'} onClose={() => setSheet(null)} onClosed={() => setKept(null)} /> : null}
      {kept === 'abroad' ? <AbroadRegSheet open={sheet === 'abroad'} onClose={() => setSheet(null)} onClosed={() => setKept(null)} /> : null}
    </SafeAreaView>
  );
}

/** 밑줄 탭 · 오른쪽 끝을 흐리게 해서 더 넘길 수 있다는 표시 (프로토타입 #lgTabs) */
function Tabs({ tab, onPick }: { tab: LoungeTab; onPick: (k: LoungeTab) => void }) {
  return (
    <View style={styles.tabsWrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs} accessibilityRole="tablist">
        {LG_TABS.map(([k, l]) => {
          const on = tab === k;
          return (
            <Pressable key={k} onPress={() => onPick(k)} accessibilityRole="tab" accessibilityState={{ selected: on }} hitSlop={{ top: 4, bottom: 4 }} style={[styles.tab, on && styles.tabOn]}>
              <PText style={[styles.tabText, on && { color: Colors.ink }]}>{l}</PText>
            </Pressable>
          );
        })}
      </ScrollView>
      <LinearGradient colors={['rgba(251,246,234,0)', Colors.cream]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.fade} pointerEvents="none" />
    </View>
  );
}

/** 지점 선택(해외 동행 탭은 빼요) + 탭별 세부 칩 (프로토타입 #lgSub) */
function SubRow({ tab, branchBtn }: { tab: LoungeTab; branchBtn: ReactNode }) {
  const sub = useLounge((s) => s.sub);
  const chips: { v: string; l: string; on: boolean; pick: () => void }[] =
    tab === 'com'
      ? COM_SUBS.map(([v, l]) => ({ v, l, on: sub.com === v, pick: () => setComSub(v) }))
      : tab === 'trip'
        ? TRIP_SUBS.map(([v, l]) => ({ v, l, on: sub.trip === v, pick: () => setTripMode(v) }))
        : ALL_SUBS.map(([v, l]) => ({ v, l, on: sub.all === v, pick: () => setAllSub(v) }));
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subs}>
      {tab === 'trip' ? null : (
        <>
          {branchBtn}
          <View style={styles.subSep} />
        </>
      )}
      {chips.map((c) => (
        <Pressable key={c.v} onPress={c.pick} accessibilityRole="button" accessibilityState={{ selected: c.on }} hitSlop={7} style={({ pressed }) => [styles.chip, c.on && styles.chipOn, pressed && { transform: [{ scale: 0.96 }] }]}>
          <PText style={[styles.chipText, c.on && { color: Colors.purple }]}>{c.l}</PText>
        </Pressable>
      ))}
    </ScrollView>
  );
}

/** 탭별 피드 (프로토타입 lgBody: 추천 · 커뮤니티 · 해외 동행) */
function Feed({ tab, brs, onMakeTrip, onRegAbroad }: { tab: LoungeTab; brs: string[]; onMakeTrip: () => void; onRegAbroad: () => void }) {
  const feed = useLounge((s) => s.feed);
  const blocked = useBlockedNames();
  const hidden = useLounge((s) => s.hidden);
  const sub = useLounge((s) => s.sub);
  const cc = useLounge((s) => s.cc);
  const people = useLounge((s) => s.people);
  const [person, setPerson] = useState<AbroadPerson | null>(null);
  const vis = (p: FeedItem) => !('who' in p && (blocked.includes(p.who) || hidden[p.who]));
  const F = feed.filter((p) => vis(p) && (tab === 'trip' || branchOk(brs, 'br' in p ? p.br : undefined)));

  if (tab === 'trip') {
    const inCc = (p: { cc: string }) => !cc || p.cc === cc;
    if (sub.trip === 'trip') {
      const ts = F.flatMap((p) => (p.k === 'trip' && inCc(p) ? [p] : []));
      const off = (p: (typeof ts)[number]) => (p.closed || p.cur >= p.cap ? 1 : 0);
      ts.sort((a, b) => off(a) - off(b) || a.from.localeCompare(b.from));
      return (
        <View style={styles.feed}>
          <WorldMapCard mode="trip" />
          <Section title="모집 중인 동행" sub={`${ts.filter((p) => !p.closed && p.cur < p.cap).length}개`} action={{ label: '동행 구하기', onPress: onMakeTrip }} />
          {ts.length ? (
            ts.map((p, i) => (
              <LgIn key={p.id} delay={Math.min(i, 4) * 50}>
                <TripCard p={p} />
              </LgIn>
            ))
          ) : (
            <Empty text={'이 나라 동행이 아직 없어요.\n먼저 동행을 구해 보세요!'} />
          )}
        </View>
      );
    }
    const ppl = people.filter(inCc);
    const ab = F.flatMap((p) => (p.k === 'abroad' && inCc(p) ? [p] : []));
    return (
      <View style={styles.feed}>
        <WorldMapCard mode="live" />
        <Section title="해외에 있는 PALLO 사람들" sub={`${ppl.length}명`} />
        <PeopleRow people={ppl} onAdd={onRegAbroad} onPick={setPerson} />
        <Section title="해외살이 이야기" />
        {ab.length ? (
          ab.map((p, i) => (
            <LgIn key={p.id} delay={Math.min(i, 4) * 50}>
              <AbroadCard p={p} />
            </LgIn>
          ))
        ) : (
          <Empty text="이 나라 이야기가 아직 없어요." />
        )}
        <PersonSheet p={person} onClose={() => setPerson(null)} />
      </View>
    );
  }

  const items =
    tab === 'com'
      ? F.filter((p) => p.k === 'post' && (sub.com === 'all' || (sub.com === 'club' && (!!p.club || p.cat === 'club')) || p.cat === sub.com))
      : F.filter((p) => 'rec' in p && p.rec && (sub.all === 'all' || (p.k !== 'map' && ((p.k === 'post' || p.k === 'abroad' ? p.likes >= 60 : false) || p.k === 'meet'))));
  if (!items.length) return <View style={styles.feed}>{tab === 'com' ? <Empty text={'아직 글이 없어요.\n위 + 버튼으로 첫 글을 올려 보세요.'} /> : null}</View>;
  return (
    <View style={styles.feed}>
      {items.map((p, i) => (
        <LgIn key={p.id} delay={Math.min(i, 4) * 50}>
          <FeedCard p={p} />
        </LgIn>
      ))}
    </View>
  );
}

function FeedCard({ p }: { p: FeedItem }) {
  switch (p.k) {
    case 'post':
      return <PostCard p={p} />;
    case 'abroad':
      return <AbroadCard p={p} />;
    case 'meet':
      return <RecMeetCard p={p} />;
    case 'chal':
      return <RecChalCard p={p} />;
    case 'map':
      return <MiniMapCard />;
    case 'trip':
      return <TripCard p={p} />;
  }
}

function Empty({ text }: { text: string }) {
  return <PText style={styles.empty}>{text}</PText>;
}

/** 맨 위로 — + 버튼 바로 위 14px, 가운데를 맞춰서 (프로토타입 .to-top.up) */
function ToTop({ show, bottom, onPress }: { show: boolean; bottom: number; onPress: () => void }) {
  const still = useReducedMotion();
  const a = useAnimatedStyle(() => {
    const d = still ? 0 : 200;
    return { opacity: withTiming(show ? 1 : 0, { duration: d, easing: EASE }), transform: [{ translateY: withTiming(show ? 0 : 16, { duration: d, easing: EASE }) }, { scale: withTiming(show ? 1 : 0.8, { duration: d, easing: EASE }) }] };
  });
  return (
    <Animated.View style={[styles.toTopWrap, { bottom }, a]} pointerEvents={show ? 'auto' : 'none'}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="맨 위로 가기" style={({ pressed }) => [styles.toTop, pressed && styles.toTopDown]}>
        <LgIcon name="up" size={22} sw={2.6} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  page: { paddingTop: 24, paddingBottom: 190 },
  hd: { paddingHorizontal: 16, paddingBottom: 10, height: 54, justifyContent: 'center' },
  h1: { lineHeight: 37 },
  tabsWrap: { borderBottomWidth: 2, borderColor: Colors.line },
  tabs: { gap: 16, paddingTop: 2, paddingLeft: 16, paddingRight: 40 },
  tab: { paddingTop: 6, paddingBottom: 9, marginBottom: -2, borderBottomWidth: 3, borderColor: 'transparent' },
  tabOn: { borderColor: Colors.purple },
  tabText: { fontFamily: Font.body900, fontSize: 14.5, lineHeight: 21, color: '#6E6780' },
  fade: { position: 'absolute', top: 0, bottom: 0, right: 0, width: '18%' },
  subs: { paddingTop: 12, paddingHorizontal: 16, paddingBottom: 4, gap: 6, alignItems: 'center' },
  subSep: { width: 1.5, height: 22, marginHorizontal: 2, backgroundColor: '#DCD4C4' },
  chip: { height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: '#CFC6B4', paddingHorizontal: 12, justifyContent: 'center' },
  chipOn: { backgroundColor: Colors.lavender, borderColor: Colors.purple },
  chipText: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 17, color: Colors.inkSub },
  feed: { paddingTop: 12, paddingHorizontal: 16, gap: 22 },
  empty: { textAlign: 'center', paddingVertical: 30, paddingHorizontal: 10, fontFamily: Font.body700, fontSize: 14, lineHeight: 22, color: Colors.inkSub },
  fabHit: { position: 'absolute', right: 16 },
  fab: { width: 60, height: 60, borderRadius: 30, borderWidth: 2.5, borderColor: Colors.ink, backgroundColor: Colors.yellow, alignItems: 'center', justifyContent: 'center', boxShadow: `0px 5px 0px ${Colors.ink}` },
  fabDown: { transform: [{ translateY: 4 }], boxShadow: `0px 1px 0px ${Colors.ink}` },
  toTopWrap: { position: 'absolute', right: 22 },
  toTop: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: Colors.ink, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', boxShadow: `3px 3px 0px ${Colors.ink}` },
  toTopDown: { transform: [{ translateX: 3 }, { translateY: 3 }], boxShadow: `0px 0px 0px ${Colors.ink}` },
});
