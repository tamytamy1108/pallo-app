import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { popupsQuery } from '@/api/queries';
import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import type { PopupBackground, LaunchPopup as Popup } from '@/data/home';
import { createStore } from '@/lib/store';
import { LayerModal } from '@/components/ui/sheet-stack';

import { nowDate } from './attendance';
import { LineIcon } from './icons';
import { useRejectionPopupOpen } from './link-rejected-popup';

/** 포스터 양옆 넘김 화살표 — 글자(‹ ›)는 글꼴에 따라 끝이 뭉툭해서 선으로 그려요 (끝 · 꺾임 둥글게) */
const CHEVRON_L = 'M15 5l-7 7 7 7';
const CHEVRON_R = 'M9 5l7 7-7 7';

/*
 * 앱을 열 때 팝업 (프로토타입 POPS · popShow · .pop-wrap · .pop-c).
 * 본사 관리자가 app-hub '앱 팝업'에서 올린 팝업을 0.9초 뒤 보여 줘요. 여러 개면 옆으로 밀거나 포스터 양옆 ‹ › 로 넘겨요. '오늘은 그만 보기'를 누르면 오늘은 다시 안 떠요.
 * 데이터: GET /popups — 지금 띄울 것만 노출 순서대로 와요(받기 전 · 실패면 안 떠요). 배경은 키만 오고 색은 여기서 정해요.
 */

/** 템플릿 배경 프리셋 → 그라데이션 (위 → 아래) */
const GRADIENTS: Record<PopupBackground, [string, string]> = {
  PURPLE: [Colors.purple, Colors.ink],
  BLUE: [Colors.sky, Colors.purple],
  PINK: [Colors.rosePink, Colors.purple],
  SLATE: [Colors.inkSub, Colors.ink],
};

/** 버튼을 누르면 갈 화면 — 리소스 종류마다 */
function hrefOf(p: Popup): Href {
  switch (p.resourceType) {
    case 'NOTICE':
      return `/notice/${p.resourceId}`;
  }
}

const today = () => {
  const d = nowDate();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
// '오늘은 그만 보기': 팝업 id → 누른 날짜. 기기에 남아서 앱을 다시 켜도 오늘은 안 떠요 (프로토타입 `pallo-pop`)
const hiddenStore = createStore<Record<string, string>>({}, { persist: { key: 'popup-hidden' } });
function hideToday(ids: string[]) {
  const day = today();
  hiddenStore.set((h) => {
    // 지난 날짜는 지워요 (계속 쌓이지 않게)
    const keep = Object.fromEntries(Object.entries(h).filter(([, d]) => d === day));
    ids.forEach((id) => (keep[id] = day));
    return keep;
  });
}
// 앱을 켠 뒤 한 번만 떠요
let shownOnce = false;

export function LaunchPopup() {
  const { data } = useQuery(popupsQuery());
  if (!data) return null;
  return <PopupHost popups={data} />;
}

function PopupHost({ popups }: { popups: Popup[] }) {
  const still = useReducedMotion();
  // 처음 받은 목록으로 한 번 정해요 (보는 중에 '오늘은 그만 보기'를 눌러도 목록이 줄지 않게).
  // 기간은 서버가 이미 걸렀지만, 앱을 켜 둔 채 기간이 지난 경우(·가짜 서버)를 위해 한 번 더 봐요.
  const [list] = useState(() =>
    popups.filter((p) => Date.parse(p.publishUntil) > nowDate().getTime() && hiddenStore.get()[p.id] !== today()),
  );
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  /** 공지 카드 전체 높이 (포스터 · 버튼 · 아래 줄) — 넘김 화살표를 카드 한가운데 높이에 둬요 */
  const [cardH, setCardH] = useState(0);
  const fade = useSharedValue(0);
  // 연동 반려 팝업이 떠 있으면 닫힐 때까지 기다렸다가 떠요 (두 장이 겹치지 않게)
  const rejectionOpen = useRejectionPopupOpen();

  useEffect(() => {
    if (shownOnce || !list.length || rejectionOpen) return;
    const t = setTimeout(() => {
      shownOnce = true;
      setOpen(true);
      fade.set(withTiming(1, { duration: still ? 0 : 200 }));
    }, 900);
    return () => clearTimeout(t);
  }, [list.length, still, fade, rejectionOpen]);

  const close = () => {
    fade.set(withTiming(0, { duration: still ? 0 : 180 }));
    setTimeout(() => setOpen(false), still ? 0 : 180);
  };
  const dim = useAnimatedStyle(() => ({ opacity: fade.get() }));

  if (!open || !list.length) return null;
  const p = list[i];

  return (
    <LayerModal visible transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      <Animated.View style={[styles.wrap, dim]} accessibilityViewIsModal accessibilityLabel="공지 팝업">
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityRole="button" accessibilityLabel="닫기" />
        <View style={styles.cardBox}>
          <View style={styles.cardShadow} />
          <View style={styles.card} onLayout={(e) => setCardH(e.nativeEvent.layout.height)}>
            {/* 카드 테두리(2) 안쪽 기준이라 2 를 빼요 */}
            <Pager list={list} i={i} setI={setI} still={still} arrowY={cardH ? cardH / 2 - 2 : POSTER_H / 2} />
            <Pressable
              onPress={() => {
                close();
                router.push(hrefOf(p));
              }}
              accessibilityRole="button"
              accessibilityLabel={p.ctaLabel}>
              {({ pressed }) => (
                <View style={styles.goBox}>
                  {!pressed && <View style={styles.goShadow} />}
                  <View style={StyleSheet.flatten([styles.go, pressed && styles.goPressed])}>
                    <PText style={styles.goText}>{p.ctaLabel}</PText>
                  </View>
                </View>
              )}
            </Pressable>
            <View style={styles.ft}>
              <Pressable
                onPress={() => {
                  hideToday(list.map((x) => x.id));
                  close();
                  showToast('오늘은 다시 안 보여요');
                }}
                accessibilityRole="button"
                style={styles.ftBtn}>
                <PText style={styles.ftText} color={Colors.inkSub}>
                  오늘은 그만 보기
                </PText>
              </Pressable>
              <Pressable onPress={close} accessibilityRole="button" style={StyleSheet.flatten([styles.ftBtn, styles.ftClose])}>
                <PText style={styles.ftCloseText}>닫기</PText>
              </Pressable>
            </View>
          </View>
        </View>
      </Animated.View>
    </LayerModal>
  );
}

/** 포스터 높이 · 화살표 누르는 칸 높이 */
const POSTER_H = 320;
const ARROW_H = 44;

/**
 * 공지 포스터 칸: 여러 개면 옆으로 나란히 놓고 넘겨요.
 * - 옆으로 밀면 한 장씩 넘어가요 (가로 페이지 스크롤 — 아이폰 · 안드로이드 · 웹이 똑같이 움직여요. 라운지 글 사진과 같은 방식)
 * - ‹ › 는 포스터 양옆, 높이는 공지 카드 전체의 한가운데 (arrowY) · 끝에서 누르면 처음 · 마지막으로 돌아가요 · 위 오른쪽에 몇 번째인지
 * - 움직임 줄이기면 미끄러짐 없이 바로 바꿔요
 */
function Pager({ list, i, setI, still, arrowY }: { list: Popup[]; i: number; setI: (i: number) => void; still: boolean; arrowY: number }) {
  // 화살표가 포스터 밖으로 나가지 않게
  const navTop = Math.min(POSTER_H - ARROW_H, Math.max(0, arrowY - ARROW_H / 2));
  const [w, setW] = useState(0);
  const many = list.length > 1;
  const ref = useRef<ScrollViewInstance>(null);
  // ‹ › 로 넘기는 중인 목표 장 — 미끄러지는 동안 지나가는 자리로 번호를 되돌리지 않게 (한 번 눌렀는데 두 장 넘어가던 문제)
  const target = useRef<number | null>(null);
  const go = (to: number) => {
    const k = (to + list.length) % list.length;
    target.current = still ? null : k;
    setI(k);
    ref.current?.scrollTo({ x: k * w, animated: !still });
  };
  // 밀다가 멈춘 자리로 몇 번째인지 맞춰요
  const settle = (offset: number) => {
    if (!w) return;
    if (target.current !== null) {
      if (Math.abs(offset - target.current * w) < 1) target.current = null;
      return;
    }
    const k = Math.max(0, Math.min(list.length - 1, Math.round(offset / w)));
    if (k !== i) setI(k);
  };

  return (
    <View style={styles.im} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w > 0 && (
        <ScrollView
          ref={ref}
          horizontal
          pagingEnabled
          scrollEnabled={many}
          bounces={false}
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => settle(e.nativeEvent.contentOffset.x)}
          onScrollBeginDrag={() => (target.current = null)}
          scrollEventThrottle={32}
          accessibilityRole="adjustable"
          accessibilityLabel={`공지 ${i + 1} / ${list.length}`}
          accessibilityActions={many ? [{ name: 'increment' }, { name: 'decrement' }] : undefined}
          onAccessibilityAction={(e) => go(i + (e.nativeEvent.actionName === 'increment' ? 1 : -1))}>
          {list.map((p) => (
            <Poster key={p.id} p={p} w={w} />
          ))}
        </ScrollView>
      )}
      {many && (
        <>
          <View style={styles.n} pointerEvents="none">
            <PText style={styles.nText} color={Colors.white}>
              {i + 1} / {list.length}
            </PText>
          </View>
          <View style={[styles.nav, { top: navTop }]} pointerEvents="box-none">
            <Pressable onPress={() => go(i - 1)} accessibilityRole="button" accessibilityLabel="이전" hitSlop={8} style={styles.nx}>
              <LineIcon d={CHEVRON_L} size={26} color={Colors.white} width={2.6} />
            </Pressable>
            <Pressable onPress={() => go(i + 1)} accessibilityRole="button" accessibilityLabel="다음" hitSlop={8} style={styles.nx}>
              <LineIcon d={CHEVRON_R} size={26} color={Colors.white} width={2.6} />
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

/** 팝업 포스터 한 장 — TEMPLATE = 문구 + 배경 프리셋, IMAGE = 배너 이미지 (글자는 이미지 안) */
function Poster({ p, w }: { p: Popup; w: number }) {
  return (
    <LinearGradient colors={GRADIENTS[p.background]} start={{ x: 0.33, y: 0 }} end={{ x: 0.67, y: 1 }} style={[styles.poster, { width: w }]}>
      {p.design === 'IMAGE' && p.imageUrl ? (
        // 배경 그라데이션은 이미지를 불러오는 동안만 보여요
        <Image source={{ uri: p.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel={p.ctaLabel} />
      ) : (
        <>
          <PText style={styles.k} color={Colors.yellow}>
            {p.kicker}
          </PText>
          <PText style={styles.t} color={Colors.white}>
            {p.title}
          </PText>
          <PText style={styles.s} color={Colors.white}>
            {p.sub}
          </PText>
          <Image source={require('@/assets/characters/c-upright-yellow.png')} style={styles.char} contentFit="contain" />
        </>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: 'rgba(30,26,43,0.55)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  cardBox: { width: '100%', maxWidth: 330 },
  cardShadow: { position: 'absolute', left: 5, top: 5, right: -5, bottom: -5, borderRadius: 24, backgroundColor: Colors.ink },
  card: { backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.ink, borderRadius: 24, overflow: 'hidden' },
  im: { height: POSTER_H, overflow: 'hidden' },
  row: { flexDirection: 'row', height: '100%' },
  poster: { height: '100%', paddingVertical: 22, paddingHorizontal: 20, overflow: 'hidden' },
  nav: { position: 'absolute', left: 0, right: 0, height: ARROW_H, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 },
  n: { position: 'absolute', right: 12, top: 12, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.4)' },
  nText: { fontFamily: Font.body900, fontSize: 11, lineHeight: 15 },
  k: { fontFamily: Font.display, fontSize: 11, lineHeight: 14, letterSpacing: 2 },
  t: { marginTop: 10, fontFamily: Font.display, fontSize: 28, lineHeight: 31.4 },
  s: { marginTop: 10, fontFamily: Font.body800, fontSize: 13, lineHeight: 18, opacity: 0.9 },
  char: { position: 'absolute', right: -12, bottom: -10, width: 150, height: (150 * 306) / 480 },
  // 화살표만 (동그란 바탕 없이)
  nx: { width: 34, height: ARROW_H, alignItems: 'center', justifyContent: 'center' },
  goBox: { margin: 12 },
  goShadow: { position: 'absolute', left: 0, right: 0, top: 3, bottom: -3, borderRadius: 24, backgroundColor: Colors.ink },
  go: { height: 48, borderRadius: 24, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow, alignItems: 'center', justifyContent: 'center' },
  goPressed: { transform: [{ translateY: 3 }] },
  goText: { fontFamily: Font.body900, fontSize: 15, lineHeight: 20 },
  ft: { flexDirection: 'row', borderTopWidth: 1.5, borderColor: Colors.line },
  ftBtn: { flex: 1, height: 46, alignItems: 'center', justifyContent: 'center' },
  ftText: { fontFamily: Font.body800, fontSize: 13, lineHeight: 18 },
  ftClose: { borderLeftWidth: 1.5, borderColor: Colors.line },
  ftCloseText: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18 },
});
