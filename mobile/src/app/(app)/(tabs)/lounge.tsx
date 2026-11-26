import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { memo, type ReactNode, startTransition, useCallback, useEffect, useMemo, useRef, useState, useDeferredValue } from 'react';
import { type NativeScrollEvent, type NativeSyntheticEvent, ScrollView, type ScrollViewInstance, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from '@/components/ui/safe-area';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
import { BADGE_TABS, enterLoungeTab, leaveLoungeTab, useNewCounts } from '@/components/lounge/new-posts';
import { go } from '@/components/lounge/nav';
import { AbroadCard, PostCard } from '@/components/lounge/post-card';
import { RecChalCard, RecMeetCard } from '@/components/lounge/rec-cards';
import { Section } from '@/components/lounge/section';
import { StoryRow } from '@/components/lounge/story-row';
import { LAUNCH } from '@/constants/launch';
import { AbroadRegSheet, PeopleRow, PersonSheet, TripCard, TripMakeSheet, WorldMapCard } from '@/components/lounge/trip';
import { MeetTab } from '@/components/meet/meet-tab';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors, Spacing, TabHeadTop } from '@/constants/theme';
import { ALL_SUBS, type AbroadPerson, branchOk, COM_SUBS, type FeedItem, LG_TABS, type LoungeTab, TRIP_SUBS } from '@/data/lounge';
import { setAllSub, setBranches, setComSub, setLoungeTab, setTripMode, useLounge } from '@/data/lounge-store';
import { EASE } from '@/lib/motion';
import { useTabReselect } from '@/lib/tab-reselect';
import { useCenterChip } from '@/lib/center-chip';
import { usePullRefresh } from '@/components/ui/pull-refresh';

/**
 * 라운지 (docs/pages/04-lounge.md · 프로토타입 renderLounge · bindLounge, 탭 id azit).
 * 위에서부터: 제목 → 밑줄 탭 → 스토리 줄(추천 · 커뮤니티) → 지점 선택 + 서브 칩 → 탭별 피드. 오른쪽 아래 노랑 + 와 맨 위로.
 * 챌린지 · 번개 · 동아리 탭 본문은 각 담당 컴포넌트를 그대로 넣어요.
 */
/** 비회원이 볼 수 있는 탭 아래 높이 (스토리 줄 + 카드 1~2개) */
const LOUNGE_PEEK = 720;
/** 라운지가 뜬 뒤 다른 탭을 미리 그리기 시작하는 때 · 탭 사이 간격 (한꺼번에 그리면 스크롤이 잠깐 멈춰요) */
const PREWARM_MS = 900;
const PREWARM_STEP_MS = 350;

export default function LoungeScreen() {
  const pullRefresh = usePullRefresh();
  const tab = useLounge((s) => s.tab);
  // 탭 줄(밑줄 · 굵은 글자)은 누르자마자 바뀌고, 무거운 본문(피드 · 챌린지 · 동아리)은 그다음에 그려요 —
  // 본문을 한꺼번에 그리느라 누른 순간 화면이 멈춰서 탭 이동이 느리고 딱딱해 보였어요
  const shownTab = useDeferredValue(tab);
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
  // 새 글 배지: 탭을 열면 그 탭 배지를 지우고(남아 있던 수는 '새 글 N개' 버튼으로), 떠날 때 한 번 더 본 걸로 해요
  useFocusEffect(
    useCallback(() => {
      enterLoungeTab(tab);
      return () => leaveLoungeTab(tab);
    }, [tab]),
  );
  const counts = useNewCounts();
  const brs = useLounge((s) => s.brs);
  const region = useLounge((s) => s.region);
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollViewInstance>(null);
  useTabReselect('lounge', (animated) => scroll.current?.scrollTo({ y: 0, animated }));
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
  const onMakeTrip = useCallback(() => guardMember(() => setSheet('trip'), '동행을 구하려면'), [setSheet]);
  const onRegAbroad = useCallback(() => guardMember(() => setSheet('abroad'), '내 카드를 올리려면'), [setSheet]);

  // 그려 둔 탭: 지금 탭 + 한 번 연 탭. 라운지가 뜬 뒤 나머지 탭도 하나씩 미리 그려 둬요 (처음 누를 때도 바로 바뀌게)
  const [mountedTabs, setMountedTabs] = useState<LoungeTab[]>(() => [tab]);
  if (!mountedTabs.includes(shownTab)) setMountedTabs([...mountedTabs, shownTab]);
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    LG_TABS.forEach(([k], i) => {
      // 미리 그리기는 급하지 않은 일로 — 그리는 중에 탭을 누르면 누른 쪽이 먼저예요
      timers.push(setTimeout(() => startTransition(() => setMountedTabs((m) => (m.includes(k) ? m : [...m, k]))), PREWARM_MS + i * PREWARM_STEP_MS));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  // 탭을 바꾸면 새 내용이 그 방향(오른쪽 탭이면 오른쪽에서)으로 살짝 밀려 들어와요
  const [slideDir, setSlideDir] = useState(0);
  const pickTab = (k: LoungeTab) => {
    if (k === tab) return;
    const at = (t: LoungeTab) => LG_TABS.findIndex(([x]) => x === t);
    setSlideDir(at(k) > at(tab) ? 1 : -1);
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
      {/* 카드 안 댓글 창(Modal)도 이 스크롤 안에 그려져요 — 'handled' 가 없으면 키보드가 떠 있을 때 보내기 버튼을 처음 누르면 키보드만 내려가요 */}
      <ScrollView refreshControl={pullRefresh} ref={scroll} onScroll={onScroll} scrollEventThrottle={64} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
        <View style={styles.hd}>
          {/* 화면 제목은 영어 · 탭 버튼은 한국어 그대로 (2026-11-25) */}
          <PText variant="headline" accessibilityRole="header" accessibilityLabel="라운지">
            Lounge
          </PText>
        </View>
        <View style={styles.tabsAt} onLayout={(e) => (tabsY.current = e.nativeEvent.layout.y)}>
          <Tabs tab={tab} counts={counts} onPick={pickTab} />
        </View>
        {/* 비회원은 모든 탭에서 위쪽(카드 1~2개)까지만 · 아래는 잠김 칸 (components/common/scroll-lock) */}
        {/* 한 번 연 탭은 그려 둔 채로 숨겨만 둬요 — 탭을 바꿀 때마다 피드 · 챌린지 · 동아리를 처음부터 다시 그려서 느렸어요 (2026-11-26) */}
        <ScrollLock screen="lounge" peek={LOUNGE_PEEK} inset={16}>
          {/* 숨은 탭이 이 칸 맨 위에 겹쳐 있어요 */}
          <View>
          {LG_TABS.map(([k]) =>
            mountedTabs.includes(k) ? (
              <TabSwap key={k} dir={slideDir} active={k === shownTab}>
                <TabBody tab={k} branch={branch} brs={brs} region={region} onMakeTrip={onMakeTrip} onRegAbroad={onRegAbroad} />
              </TabSwap>
            ) : null,
          )}
          </View>
        </ScrollLock>
      </ScrollView>

      <ToTop show={scrolled} bottom={fabBottom + 60 + 14} onPress={() => scroll.current?.scrollTo({ y: 0, animated: true })} />
      <Pressable onPress={() => guardMember(() => setSheet('create'), '글을 올리려면')} accessibilityRole="button" accessibilityLabel="만들기" style={[styles.fabHit, { bottom: fabBottom }]}>
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

/**
 * 밑줄 탭 · 오른쪽 끝을 흐리게 해서 더 넘길 수 있다는 표시 (프로토타입 #lgTabs). 밑줄은 고른 탭으로 미끄러져 가요.
 * 흐림은 좁게 두고, 끝까지 넘겼거나 다 보이면 걷어요 — 마지막 탭(해외 동행)의 새 글 배지가 흐려지지 않게.
 */
function Tabs({ tab, counts, onPick }: { tab: LoungeTab; counts: Record<LoungeTab, number>; onPick: (k: LoungeTab) => void }) {
  const [rowRef, onRow, onChip, centerChip] = useCenterChip();
  const still = useReducedMotion();
  const [boxes, setBoxes] = useState<Partial<Record<LoungeTab, { x: number; w: number }>>>({});
  const ux = useSharedValue(-1);
  const uw = useSharedValue(0);
  const cur = boxes[tab];
  useEffect(() => {
    if (!cur) return;
    // 처음 자리를 잡을 때는 바로, 그다음부터는 미끄러지듯
    if (ux.get() < 0 || still) {
      ux.set(cur.x);
      uw.set(cur.w);
      return;
    }
    ux.set(withTiming(cur.x, { duration: 280, easing: EASE }));
    uw.set(withTiming(cur.w, { duration: 280, easing: EASE }));
  }, [cur, still, ux, uw]);
  const bar = useAnimatedStyle(() => ({ opacity: ux.get() < 0 ? 0 : 1, width: uw.get(), transform: [{ translateX: Math.max(0, ux.get()) }] }));
  // 줄 너비 · 내용 너비 · 넘긴 자리로 '끝에 닿았는지' 봐요
  const geo = useRef({ view: 0, content: 0, x: 0 });
  const [atEnd, setAtEnd] = useState(false);
  const checkEnd = () => {
    const { view, content, x } = geo.current;
    const end = view > 0 && content > 0 && x + view >= content - 4;
    setAtEnd((was) => (was === end ? was : end));
  };
  const fadeOn = useSharedValue(1);
  useEffect(() => {
    fadeOn.set(still ? (atEnd ? 0 : 1) : withTiming(atEnd ? 0 : 1, { duration: 160 }));
  }, [atEnd, still, fadeOn]);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fadeOn.get() }));
  return (
    <View style={styles.tabsWrap}>
      <ScrollView
        ref={rowRef}
        onLayout={(e) => {
          onRow(e);
          geo.current.view = e.nativeEvent.layout.width;
          checkEnd();
        }}
        onContentSizeChange={(w) => {
          geo.current.content = w;
          checkEnd();
        }}
        onScroll={(e) => {
          geo.current.x = e.nativeEvent.contentOffset.x;
          checkEnd();
        }}
        scrollEventThrottle={32}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
        accessibilityRole="tablist">
        {LG_TABS.map(([k, l]) => {
          const on = tab === k;
          const n = BADGE_TABS.includes(k) ? counts[k] : 0;
          // 새로 올라온 수 (번개 · 동아리도 다른 탭처럼 숫자)
          const badge = n ? (n > 9 ? '9+' : String(n)) : null;
          return (
            <Pressable
              key={k}
              onLayout={(e) => {
                onChip(k, e);
                const { x, width } = e.nativeEvent.layout;
                setBoxes((b) => (b[k]?.x === x && b[k]?.w === width ? b : { ...b, [k]: { x, w: width } }));
              }}
              onPress={() => {
                centerChip(k);
                onPick(k);
              }}
              accessibilityRole="tab"
              accessibilityLabel={badge ? `${l}, ${k === 'meet' ? '새 모임' : '새 글'} ${n}개` : l}
              accessibilityState={{ selected: on }}
              hitSlop={{ top: 4, bottom: 4 }}
              style={styles.tab}>
              <View>
                <PText style={[styles.tabText, on && { color: Colors.ink }]}>{l}</PText>
                {/* 글자 오른쪽 위에 작게 띄워요 — 탭 너비가 그대로라 밑줄 자리도 그대로 */}
                {badge ? (
                  <View pointerEvents="none" style={styles.badge}>
                    <PText style={styles.badgeText}>{badge}</PText>
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })}
        <Animated.View pointerEvents="none" style={[styles.tabBar, bar]} />
      </ScrollView>
      <Animated.View style={[styles.fade, fadeStyle]} pointerEvents="none">
        <LinearGradient colors={['rgba(251,246,234,0)', Colors.cream]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  );
}

/**
 * 한 탭의 본문. memo 로 감싸서 탭을 바꿀 때 다른 탭(피드 카드 · 챌린지 · 번개 지도)은 다시 그리지 않아요.
 * 전에는 탭을 누를 때마다 그려 둔 다섯 탭 본문이 전부 (두 번씩) 다시 그려져서 탭 이동이 끊겼어요 (2026-11-26).
 * 지점 버튼도 여기서 만들어요 — 부모에서 만든 요소를 넘기면 매번 새 요소라 memo 가 소용없어요.
 */
const TabBody = memo(function TabBody({ tab, branch, brs, region, onMakeTrip, onRegAbroad }: { tab: LoungeTab; branch: string; brs: string[]; region: string | undefined; onMakeTrip: () => void; onRegAbroad: () => void }) {
  const branchBtn = useMemo(() => <BranchSelect value={branch} onChange={(v) => setBranches(branchList(v))} />, [branch]);
  return (
    <>
      {LAUNCH.story && (tab === 'all' || tab === 'com') ? <StoryRow /> : null}
      {tab === 'chal' ? (
        <ChallengeTab branch={branch} header={branchBtn} />
      ) : tab === 'meet' ? (
        <MeetTab branch={branch} header={branchBtn} region={region} />
      ) : (
        <>
          <SubRow tab={tab} branchBtn={branchBtn} />
          <Feed tab={tab} brs={brs} onMakeTrip={onMakeTrip} onRegAbroad={onRegAbroad} />
        </>
      )}
    </>
  );
});

/** 탭 내용이 바뀔 때: 고른 쪽에서 살짝 밀려 들어오며 서서히 (0.3초) — 딱 끊겨 바뀌지 않게 */
function TabSwap({ dir, active, children }: { dir: number; active: boolean; children: ReactNode }) {
  const still = useReducedMotion();
  // 완전히 투명한 데서 시작하면 빈 화면이 잠깐 보여요 → 반쯤 보이는 데서 짧게 (.2초)
  const p = useSharedValue(1);
  const was = useRef(active);
  useEffect(() => {
    if (active && !was.current && !still && dir !== 0) {
      p.set(0.4);
      p.set(withTiming(1, { duration: 200, easing: EASE }));
    }
    was.current = active;
  }, [active, still, dir, p]);
  const st = useAnimatedStyle(() => ({ opacity: p.get(), transform: [{ translateX: (1 - p.get()) * 20 * dir }] }));
  // 숨은 탭은 겹쳐서 투명하게만 둬요 (자리 차지 X · 누름 X · 화면 읽기 X).
  // display: none 으로 숨기면 새 구조(Fabric)는 숨긴 탭의 화면 조각을 통째로 내렸다가 보일 때 다시 만들어요 —
  // 탭을 바꿀 때마다 카드 · 사진 · 지도를 처음부터 다시 띄우고, 너비 0 → 진짜 너비로 onLayout 이 다시 돌아서 버퍼링처럼 멈췄어요 (2026-11-26)
  return (
    <View style={!active && styles.hiddenTab} pointerEvents={active ? 'auto' : 'none'} accessibilityElementsHidden={!active} importantForAccessibility={active ? 'auto' : 'no-hide-descendants'}>
      <Animated.View style={st}>{children}</Animated.View>
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
  const [rowRef, onRow, onChip, centerChip] = useCenterChip();
  return (
    <ScrollView ref={rowRef} onLayout={onRow} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subs}>
      {tab === 'trip' ? null : (
        <>
          {branchBtn}
          <View style={styles.subSep} />
        </>
      )}
      {chips.map((c) => (
        <Pressable
          key={c.v}
          onLayout={(e) => onChip(c.v, e)}
          onPress={() => {
            centerChip(c.v);
            c.pick();
          }}
          accessibilityRole="button" accessibilityState={{ selected: c.on }} hitSlop={7} style={({ pressed }) => [styles.chip, c.on && styles.chipOn, pressed && { transform: [{ scale: 0.96 }] }]}>
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
  const vis = (p: FeedItem) => launched(p) && !('who' in p && (blocked.includes(p.who) || hidden[p.who]));
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

/** 출시 때 안 여는 기능의 카드는 추천에도 안 섞어요 (constants/launch) — 표현 챌린지 · 동행 · 해외살이 */
const launched = (p: FeedItem) => (p.k === 'chal' ? LAUNCH.exprChallenge : p.k === 'trip' || p.k === 'abroad' ? LAUNCH.trip : true);

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
  hiddenTab: { position: 'absolute', top: 0, left: 0, right: 0, opacity: 0 },
  page: { paddingTop: TabHeadTop, paddingBottom: 190 },
  // 첫 줄(제목) · 둘째 줄(탭) 자리는 다섯 탭이 같아요: 제목 줄 44 · 그 아래 Spacing.stack (홈 · 라이브러리 · 마이와 같게)
  hd: { paddingHorizontal: Spacing.gutter, height: 44, justifyContent: 'center', marginTop: Spacing.headDrop, marginBottom: -Spacing.headDrop },
  // 탭 밑줄이 라이브러리(스터디 맵 | 상황 맵) 밑줄과 같은 높이에 와요
  tabsAt: { marginTop: Spacing.stack + 1 },
  tabsWrap: { borderBottomWidth: 2, borderColor: Colors.line },
  // 오른쪽 여백은 마지막 탭의 배지(글자 오른쪽으로 ~22) + 흐림 폭보다 넓게
  tabs: { gap: 26, paddingTop: 2, paddingLeft: 16, paddingRight: 52 },
  tab: { paddingTop: 6, paddingBottom: 12 },
  // 고른 탭 밑줄 (탭 사이를 미끄러져 다녀요)
  tabBar: { position: 'absolute', left: 0, bottom: 0, height: 3, borderRadius: 2, backgroundColor: Colors.purple },
  tabText: { fontFamily: Font.body900, fontSize: 14.5, lineHeight: 21, color: '#6E6780' },
  // 새 글 수 (탭 글자 오른쪽 위)
  // 새 글 수: 작은 분홍 알약 · 크림 테두리로 배경에서 떼어 보여요
  badge: { position: 'absolute', top: -2, left: '100%', marginLeft: 3, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4, backgroundColor: '#E8577A', borderWidth: 1.5, borderColor: Colors.cream, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: Font.body900, fontSize: 9.5, lineHeight: 12, color: '#fff', fontVariant: ['tabular-nums'] },
  fade: { position: 'absolute', top: 0, bottom: 0, right: 0, width: 28 },
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
