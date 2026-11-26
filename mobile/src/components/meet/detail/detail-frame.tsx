import { router } from 'expo-router';
import { Stack } from 'expo-router/js-stack';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Keyboard, Platform, ScrollView, StyleSheet, useWindowDimensions, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance, type ViewInstance } from 'react-native';
import Animated, { useAnimatedKeyboard, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { Pressable } from '@/components/ui/pressable';
import { SCREEN } from '@/lib/transitions';
import { BottomBar } from '@/components/bottom-bar';
import { useKeyboardShown } from '@/lib/keyboard';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors, TAB_ROW_H } from '@/constants/theme';
import { EASE } from '@/lib/motion';
import { PhotoViewer } from '@/components/ui/photo-viewer';
import { KeepVisibleContext, useShowFocusedOnKeyboard } from '@/components/ui/form-scroll';

import type { MadeCard } from '@/data/poster-colors';

import { Poster, posterFg, posterSlides, type Slide } from '../poster';

/*
 * 상세 화면 공통 틀 (번개 · 동아리 · 이벤트 — 프로토타입 lgDetail · #lgDet · .dtop · .dbd · .lg-dcta).
 * 포스터가 맨 위부터 좌우 끝까지 꽉 차요(4:5). 2장 이상이면 3초마다 0.6초 페이드, 누르면 전체 화면 크게 보기.
 * 뒤로 · 공유는 포스터 위 아이콘만. 내려서 제목이 가려지면 위 막대에 크림 바탕 + 모임 이름이 0.25초에 나타나요.
 */

type Props = {
  id: string;
  club?: boolean;
  /** 내가 올린 포스터 사진들 */
  posters?: string[];
  /** 내가 만든 카드 (있으면 대표) */
  card?: MadeCard;
  title: string;
  kicker: ReactNode;
  heading: string;
  children: ReactNode;
  /** 아래 고정 바 안 (찜 · 금액 · 참여하기) */
  cta: ReactNode;
  /** 아래 고정 바 위 한 줄 (동아리 '최근 30일 동안 N명이 가입했어요') */
  ctaNote?: ReactNode;
  /** 제목 아래 붙는 것 (동아리 .lg-dmeta) */
  sub?: ReactNode;
  /** 위에 붙는 탭 (동아리 상세) — 지나가면 위 막대 아래에 붙어요 */
  tabs?: ReactNode;
  /** 탭 아래 본문 (tabs 가 있을 때) */
  tabBody?: ReactNode;
  /** 고른 탭 — 바뀌면 탭 줄이 위 막대 바로 아래로 올라가 붙고(이미 붙어 있으면 그대로) 새 탭을 처음부터 보여 줘요 */
  tabKey?: string;
  /** 아래 고정 바 대신 화면 맨 아래에 붙는 입력 줄 (동아리 채팅) — 키보드가 오면 바로 위로 따라 올라가요 */
  dock?: ReactNode;
};

const BAR = 44; // .dtop 안 높이 (아래 8) — 줄 가운데가 탭 화면 머리줄과 같게 위 여백은 없어요
/** 탭 줄 높이 (재기 전 어림값 — 탭 + 아래 선 1.5) */
const TAB_H = TAB_ROW_H + 1.5;
/** 칸을 눌러 키보드가 올라오면 칸 아래로 이만큼 띄워 보여요 */
const KB_ROOM = 28;

type ScrollToTarget = (target: ViewInstance | null) => void;
const DetailScrollContext = createContext<ScrollToTarget | null>(null);
/** 상세 본문 안의 칸을 위 막대 바로 아래로 올려 보여 줘요 (신청 직후 '내 신청' 카드 등). 상세 틀 밖이면 아무것도 안 해요 */
export const useDetailScrollTo = (): ScrollToTarget => useContext(DetailScrollContext) ?? (() => {});

export function DetailFrame({ id, club, posters, card, title, kicker, heading, children, cta, ctaNote, sub, tabs, tabBody, tabKey, dock }: Props) {
  const insets = useSafeAreaInsets();
  const kbShown = useKeyboardShown();
  const slides = posterSlides(id, club, posters, card);
  const fg = posterFg(slides[0].bg);
  const [w, setW] = useState(0);
  const [y, setY] = useState(0);
  // 제목 · 탭 자리 (본문 안에서) — 포스터 높이는 나중에 정해져서 그리면서 더해요
  const [h2Rel, setH2Rel] = useState(9999);
  const [tabRel, setTabRel] = useState(-1);
  const [tabH, setTabH] = useState(TAB_H);
  const { height: winH } = useWindowDimensions();
  const [scrollH, setScrollH] = useState(0);
  const [view, setView] = useState<number | null>(null);
  const topH = insets.top + BAR + 8;
  // 탭 줄이 붙을 때 위 막대 높이: 아래 여백 8 을 접어 제목 줄 바로 아래에 탭이 붙어요 (챌린지 상세와 같게)
  const dockH = insets.top + BAR;
  const posterH = w ? (w * 5) / 4 : 0;
  const h2Bottom = posterH + h2Rel;
  const tabY = tabRel < 0 ? -1 : posterH + tabRel;
  const solid = !posterH || y > posterH - topH * 2;
  const titled = y > h2Bottom - topH;
  const dockAt = tabY - dockH;
  const pinned = tabY >= 0 && y >= dockAt;
  // 탭 줄이 다가오면 위 막대 아래 여백이 스크롤을 따라 접혀서, 막대 아래 선이 탭 줄 윗선과 함께 움직여요 (붙는 순간 튀지 않게)
  const barH = tabY >= 0 ? Math.max(dockH, Math.min(topH, tabY - y)) : topH;

  const scroll = useRef<ScrollViewInstance>(null);
  const root = useRef<ViewInstance>(null);
  const yNow = useRef(0);
  const contentH = useRef(0);
  const dockKey = useRef<string | undefined>(undefined);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    yNow.current = e.nativeEvent.contentOffset.y;
    setY(e.nativeEvent.contentOffset.y);
  };
  // 인사 · 댓글 칸을 누르면: 키보드가 다 올라온 뒤 칸 전체가 키보드 위로 (여유 KB_ROOM) 보이게 — 아이폰 기본 맞춤은 칸 끝이 키보드에 딱 붙어요
  // 본문 안 자리(measureLayout)로 셈해서, 스크롤 알림이 늦게 와도 칸 아래 끝 + KB_ROOM 이 키보드 바로 위에 정확히 와요 (이미 보이면 그대로)
  const keepAboveKeyboard = (target: ViewInstance | null, animated: boolean) => {
    const inner = scroll.current?.getInnerViewRef();
    const kbTop = Platform.OS === 'web' ? undefined : Keyboard.metrics()?.screenY;
    if (!target || !inner || !root.current || kbTop == null) return;
    target.measureLayout(inner, (_x, ty, _w, th) => {
      root.current?.measureInWindow((_rx, ry) => {
        // 스크롤 칸은 화면(root) 맨 위에서 시작해요
        const want = ty + th + KB_ROOM - (kbTop - ry);
        if (want <= yNow.current + 1) return;
        yNow.current = want;
        scroll.current?.scrollTo({ y: want, animated });
      });
    });
  };
  // 아래 입력 줄(dock)이면: 줄은 키보드를 따라 올라가고, 본문은 맨 아래(새 메시지)를 보여 줘요
  useShowFocusedOnKeyboard(root, (target) => (dock ? scroll.current?.scrollToEnd({ animated: true }) : keepAboveKeyboard(target, true)));
  // 인사 칸이 길어져 한 줄 늘면 그 줄도 키보드 위로 (GrowInput 이 불러요)
  const keepGrowing = (target: ViewInstance | null) => {
    if (Keyboard.isVisible()) keepAboveKeyboard(target, false);
  };
  const scrollToTarget: ScrollToTarget = (target) => {
    const inner = scroll.current?.getInnerViewRef();
    if (!target || !inner) return;
    target.measureLayout(inner, (_x, ty) => scroll.current?.scrollTo({ y: Math.max(0, ty - topH - 12), animated: true }));
  };
  // 탭을 바꾸면: 탭 줄이 위 막대 바로 아래에 붙게 부드럽게 올려요. 이미 붙어 있으면 그대로 두고 새 탭 맨 위부터 보여요
  const dockRef = useRef(dockAt);
  useEffect(() => {
    dockRef.current = dockAt;
  });
  const lastTab = useRef(tabKey);
  useEffect(() => {
    if (lastTab.current === tabKey) return;
    lastTab.current = tabKey;
    const at = dockRef.current;
    if (at < 0) return;
    const docked = yNow.current >= at - 1;
    yNow.current = at;
    scroll.current?.scrollTo({ y: at, animated: !docked });
  }, [tabKey]);
  const ink = solid ? Colors.ink : fg;

  return (
    <View ref={root} collapsable={false} style={styles.root} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <Stack.Screen options={SCREEN.push} />
      <ScrollView
        ref={scroll}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onLayout={(e) => setScrollH(e.nativeEvent.layout.height)}
        // 아래 입력 줄(dock)로 새 메시지를 보내 본문이 길어지면: 맨 아래를 보고 있었으면 새 줄까지 따라 내려가요
        onContentSizeChange={(_w, h) => {
          const was = contentH.current;
          // 탭을 바꿔 길이가 바뀐 건 빼요 (같은 채팅 탭 안에서 늘어날 때만)
          const sameDock = dockKey.current === tabKey && !!dock;
          contentH.current = h;
          dockKey.current = dock ? tabKey : undefined;
          if (sameDock && h > was && yNow.current + (scrollH || winH) >= was - 80) scroll.current?.scrollToEnd({ animated: true });
        }}
        contentContainerStyle={{ paddingBottom: 24 }}
        // 인사 · 댓글 입력칸을 누르면 키보드 위로 올려 보여요 (iOS) · 끌어내리면 키보드가 내려가요
        // 아래 입력 줄(dock)이 있으면 그 줄이 키보드만큼 올라가며 본문 칸을 줄여요 (자동 여백까지 더하면 두 번 올라가요)
        automaticallyAdjustKeyboardInsets={!dock}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive">
        <PosterStack id={id} slides={slides} height={posterH} onOpen={(i) => setView(i)} />
        <View style={styles.dbd}>
          <View style={styles.dk}>{kicker}</View>
          <PText style={styles.h2} onLayout={(e: LayoutChangeEvent) => setH2Rel(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}>
            {heading}
          </PText>
          {sub}
          {tabs ? (
            <View
              onLayout={(e) => {
                setTabRel(e.nativeEvent.layout.y);
                setTabH(e.nativeEvent.layout.height);
              }}
              style={[styles.tabsIn, { opacity: pinned ? 0 : 1 }]}>
              {tabs}
            </View>
          ) : null}
          {/* 탭 본문이 짧아도 탭이 위 막대 아래에 붙을 수 있게: 스크롤 칸 높이 - 붙은 막대 - 탭 줄 - 아래 여백(본문 24 + 스크롤 24) 만큼은 둬요 */}
          <DetailScrollContext.Provider value={scrollToTarget}>
            <KeepVisibleContext.Provider value={Platform.OS === 'web' ? null : keepGrowing}>{tabs ? <View style={{ minHeight: Math.max(0, (scrollH || winH) - dockH - tabH - 48) }}>{tabBody}</View> : children}</KeepVisibleContext.Provider>
          </DetailScrollContext.Provider>
        </View>
      </ScrollView>

      {/* 위 막대: 뒤로 · (모임 이름) */}
      <View style={[styles.dtop, { paddingTop: insets.top, height: barH, paddingBottom: barH - dockH }, solid && styles.dtopSolid]} pointerEvents="box-none">
        <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} color={ink} />
        <FadeTitle show={titled} text={title} />
        {/* 공유 버튼은 웹 주소가 생기면 다시 (지금은 자리만 맞춰요) */}
        <View style={styles.ib} />
      </View>
      {tabs && pinned ? <View style={[styles.pinTabs, { top: dockH }]}>{tabs}</View> : null}

      {/* 인사 · 댓글을 쓰는 동안(키보드가 떠 있는 동안)은 아래 신청 바를 숨겨 입력칸 자리를 넓혀요 */}
      {dock ? (
        <DockBar>{dock}</DockBar>
      ) : (
        !kbShown && (
          <BottomBar>
            <View>
              {ctaNote}
              <View style={styles.cta}>{cta}</View>
            </View>
          </BottomBar>
        )
      )}

      <PosterViewer id={id} slides={slides} start={view} onClose={() => setView(null)} />
    </View>
  );
}

/**
 * 화면 맨 아래 입력 줄 (동아리 채팅). 키보드가 없으면 안전 영역(홈 바) 바로 위, 오면 키보드 바로 위 —
 * 아이폰은 키보드 움직임과 같은 프레임에 따라가요 (UI 스레드 · lib/keyboard useKeyboardLiftStyle 과 같은 방식).
 * 안드로이드는 키보드만큼 창이 줄어서 안전 영역만 둬요.
 */
const DOCK_GAP = 8;
function DockBar({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const kb = useAnimatedKeyboard();
  const ios = Platform.OS === 'ios';
  const bottom = insets.bottom;
  const lift = useAnimatedStyle(() => ({ paddingBottom: DOCK_GAP + Math.max(bottom, ios ? kb.height.value : 0) }));
  return <Animated.View style={[styles.dock, lift]}>{children}</Animated.View>;
}

function FadeTitle({ show, text }: { show: boolean; text: string }) {
  const still = useReducedMotion();
  const st = useAnimatedStyle(() => ({
    opacity: withTiming(show ? 1 : 0, { duration: still ? 0 : 250 }),
    transform: [{ translateY: withTiming(show ? 0 : 6, { duration: still ? 0 : 250 }) }],
  }));
  return (
    <Animated.View style={[styles.dttW, st]} pointerEvents="none">
      <PText numberOfLines={1} style={styles.dtt}>
        {text}
      </PText>
    </Animated.View>
  );
}

/** 포스터 여러 장: 3초마다 0.6초 페이드로 넘어가요 (프로토타입 lgPosterAuto · lgPfade) */
function PosterStack({ id, slides, height, onOpen }: { id: string; slides: Slide[]; height: number; onOpen: (i: number) => void }) {
  const [i, setI] = useState(0);
  const n = slides.length;
  const still = useReducedMotion();
  useEffect(() => {
    if (n < 2 || still) return;
    const t = setInterval(() => setI((k) => (k + 1) % n), 3000);
    return () => clearInterval(t);
  }, [n, still]);
  if (!height) return <View style={{ aspectRatio: 4 / 5 }} />;
  return (
    <Pressable onPress={() => onOpen(i)} accessibilityRole="button" accessibilityLabel={`포스터 ${n}장 크게 보기`} style={[styles.poster, { height }]}>
      <FadeIn key={i}>
        <Poster id={id} slide={slides[i]} height={height} wordSize={54} wordStyle={styles.pw} safeTop={56} />
      </FadeIn>
      {n > 1 ? <PText style={styles.ex}>{`${i + 1} / ${n}`}</PText> : null}
    </Pressable>
  );
}

/** 새 포스터가 .35 → 1 로 떠올라요 (프로토타입 lgPfade .6s var(--ease)) */
function FadeIn({ children }: { children: ReactNode }) {
  const still = useReducedMotion();
  const o = useSharedValue(still ? 1 : 0.35);
  useEffect(() => {
    if (!still) o.set(withTiming(1, { duration: 600, easing: EASE }));
  }, [still, o]);
  const st = useAnimatedStyle(() => ({ opacity: o.get() }));
  return <Animated.View style={[StyleSheet.absoluteFill, st]}>{children}</Animated.View>;
}

/**
 * 포스터 크게 보기 (프로토타입 lgPview): 위 ‹ · '1 / 2' · 옆으로 넘기는 포스터 · 아래 점.
 * 공용 PhotoViewer — 포스터 바깥 어두운 곳을 누르면 닫히고, 점을 누르면 그 장으로 가요.
 */
function PosterViewer({ id, slides, start, onClose }: { id: string; slides: Slide[]; start: number | null; onClose: () => void }) {
  return (
    <PhotoViewer
      count={slides.length}
      start={start}
      onClose={onClose}
      close="back"
      dots
      renderPhoto={(j, box) => (
        <View style={[styles.pvArt, { width: Math.min(box.width, box.height * 0.8) }]}>
          <Poster id={id} slide={slides[j]} aspectRatio={4 / 5} wordSize={54} wordStyle={styles.pw} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.cream },
  poster: { width: '100%', borderBottomWidth: 2, borderColor: Colors.ink, overflow: 'hidden' },
  pw: { left: 20, bottom: 22 },
  ex: { position: 'absolute', right: 12, bottom: 12, zIndex: 3, fontFamily: Font.display, fontSize: 10.5, lineHeight: 14, color: '#fff', backgroundColor: 'rgba(30,26,43,0.55)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
  dbd: { paddingTop: 18, paddingHorizontal: 18, paddingBottom: 24 },
  dk: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 19 },
  h2: { fontFamily: Font.body900, fontSize: 24, lineHeight: 31.2, letterSpacing: -0.5, marginTop: 6 },
  dtop: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, zIndex: 3 },
  dtopSolid: { backgroundColor: Colors.cream, borderBottomWidth: 2, borderColor: Colors.line },
  ib: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dttW: { flex: 1 },
  dtt: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  // 탭 줄: 위 16 띄우고 좌우 끝까지 (아래 선이 화면 끝까지 — 챌린지 상세 .lg-dtabs 와 같아요). 탭 쪽에서 좌우 18 을 줘요
  tabsIn: { marginTop: 16, marginHorizontal: -18 },
  pinTabs: { position: 'absolute', left: 0, right: 0, backgroundColor: Colors.cream, zIndex: 2 },
  cta: { flexDirection: 'row', alignItems: 'stretch', gap: 10 },
  dock: { paddingTop: 8, paddingHorizontal: 16, backgroundColor: Colors.cream, borderTopWidth: 1.5, borderColor: Colors.line },
  pvArt: { borderWidth: 2, borderColor: '#fff', borderRadius: 18, overflow: 'hidden' },
});
