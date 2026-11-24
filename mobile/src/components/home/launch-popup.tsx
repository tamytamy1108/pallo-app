import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { popupsQuery } from '@/api/queries';
import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import type { LaunchPopup as Popup } from '@/data/home';
import { createStore } from '@/lib/store';
import { LayerModal } from '@/components/ui/sheet-stack';

import { nowDate } from './attendance';

/*
 * 앱을 열 때 팝업 공지 (프로토타입 POPS · popShow · .pop-wrap · .pop-c).
 * 본사 관리자가 올린 공지를 0.9초 뒤 보여 줘요. 여러 개면 옆으로 밀거나 포스터 양옆 ‹ › 로 넘겨요. '오늘은 그만 보기'를 누르면 오늘은 다시 안 떠요.
 * 만드는 화면은 관리자용이라 나중에 (여기선 보여 주기만). 데이터: A1 GET /popups (받기 전 · 실패면 안 떠요).
 */

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
  // 처음 받은 목록으로 한 번 정해요 (보는 중에 '오늘은 그만 보기'를 눌러도 목록이 줄지 않게)
  const [list] = useState(() => popups.filter((p) => p.until >= today() && hiddenStore.get()[p.id] !== today()));
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const fade = useSharedValue(0);

  useEffect(() => {
    if (shownOnce || !list.length) return;
    const t = setTimeout(() => {
      shownOnce = true;
      setOpen(true);
      fade.set(withTiming(1, { duration: still ? 0 : 200 }));
    }, 900);
    return () => clearTimeout(t);
  }, [list.length, still, fade]);

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
          <View style={styles.card}>
            <Pager list={list} i={i} setI={setI} still={still} />
            <Pressable
              onPress={() => {
                close();
                router.push(p.href as Href);
              }}
              accessibilityRole="button"
              accessibilityLabel={p.cta}>
              {({ pressed }) => (
                <View style={styles.goBox}>
                  {!pressed && <View style={styles.goShadow} />}
                  <View style={StyleSheet.flatten([styles.go, pressed && styles.goPressed])}>
                    <PText style={styles.goText}>{p.cta}</PText>
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

/** 손가락을 이만큼(포스터 너비 비율) 넘게 끌거나 빠르게 튕기면 넘어가요 */
const SWIPE_RATIO = 0.18;
const SWIPE_SPEED = 0.45;
const SLIDE = { duration: 240, easing: Easing.out(Easing.cubic) };

/**
 * 공지 포스터 칸: 여러 개면 옆으로 나란히 놓고 넘겨요.
 * - 옆으로 끌면 손가락을 따라오고, 놓으면 다음 · 이전 공지로 미끄러져요 (끝에서는 처음 · 마지막으로 돌아가요)
 * - ‹ › 는 포스터 양옆 가운데 (누르면 같은 미끄러짐) · 위 오른쪽에 몇 번째인지
 * - 움직임 줄이기면 미끄러짐 없이 바로 바꿔요
 */
function Pager({ list, i, setI, still }: { list: Popup[]; i: number; setI: (i: number) => void; still: boolean }) {
  const [w, setW] = useState(0);
  const many = list.length > 1;
  /** 줄 전체의 왼쪽 위치 (px) — 지금 공지가 i 면 -i × 너비 */
  const x = useSharedValue(0);
  const now = useRef({ i, w, n: list.length, still });
  useEffect(() => {
    now.current = { i, w, n: list.length, still };
  });
  const [go] = useState(() => (to: number) => {
    const { w: ww, n, still: st } = now.current;
    const k = (to + n) % n;
    setI(k);
    x.set(st ? -k * ww : withTiming(-k * ww, SLIDE));
  });
  // ref 는 손가락 이벤트가 올 때만 읽어요 (그리는 중엔 안 읽어요) — 컴파일러가 이걸 구분하지 못해서 이 줄만 규칙을 꺼요
  // eslint-disable-next-line react-hooks/refs
  const [pan] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => now.current.n > 1 && Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, g) => {
        const { i: k, w: ww } = now.current;
        x.set(-k * ww + g.dx);
      },
      onPanResponderRelease: (_, g) => {
        const { i: k, w: ww } = now.current;
        const far = Math.abs(g.dx) > ww * SWIPE_RATIO || Math.abs(g.vx) > SWIPE_SPEED;
        if (far && g.dx !== 0) go(k + (g.dx < 0 ? 1 : -1));
        else x.set(withTiming(-k * ww, SLIDE));
      },
      onPanResponderTerminate: () => {
        const { i: k, w: ww } = now.current;
        x.set(withTiming(-k * ww, SLIDE));
      },
    }),
  );
  const row = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));

  return (
    <View
      style={styles.im}
      onLayout={(e) => {
        const ww = e.nativeEvent.layout.width;
        setW(ww);
        x.set(-now.current.i * ww);
      }}
      {...pan.panHandlers}>
      {w > 0 && (
        <Animated.View style={[styles.row, { width: w * list.length }, row]}>
          {list.map((p) => (
            <Poster key={p.id} p={p} w={w} />
          ))}
        </Animated.View>
      )}
      {many && (
        <>
          <View style={styles.n} pointerEvents="none">
            <PText style={styles.nText} color={Colors.white}>
              {i + 1} / {list.length}
            </PText>
          </View>
          <View style={styles.nav} pointerEvents="box-none">
            <Pressable onPress={() => go(i - 1)} accessibilityRole="button" accessibilityLabel="이전" hitSlop={8} style={styles.nx}>
              <PText style={styles.nxText} color={Colors.white}>
                ‹
              </PText>
            </Pressable>
            <Pressable onPress={() => go(i + 1)} accessibilityRole="button" accessibilityLabel="다음" hitSlop={8} style={styles.nx}>
              <PText style={styles.nxText} color={Colors.white}>
                ›
              </PText>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

/** 공지 포스터 한 장 */
function Poster({ p, w }: { p: Popup; w: number }) {
  return (
    <LinearGradient colors={p.bg} start={{ x: 0.33, y: 0 }} end={{ x: 0.67, y: 1 }} style={[styles.poster, { width: w }]}>
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: 'rgba(30,26,43,0.55)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  cardBox: { width: '100%', maxWidth: 330 },
  cardShadow: { position: 'absolute', left: 5, top: 5, right: -5, bottom: -5, borderRadius: 24, backgroundColor: Colors.ink },
  card: { backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.ink, borderRadius: 24, overflow: 'hidden' },
  im: { height: 320, overflow: 'hidden' },
  row: { flexDirection: 'row', height: '100%' },
  poster: { height: '100%', paddingVertical: 22, paddingHorizontal: 20, overflow: 'hidden' },
  nav: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 },
  n: { position: 'absolute', right: 12, top: 12, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.4)' },
  nText: { fontFamily: Font.body900, fontSize: 11, lineHeight: 15 },
  k: { fontFamily: Font.display, fontSize: 11, lineHeight: 14, letterSpacing: 2 },
  t: { marginTop: 10, fontFamily: Font.display, fontSize: 28, lineHeight: 31.4 },
  s: { marginTop: 10, fontFamily: Font.body800, fontSize: 13, lineHeight: 18, opacity: 0.9 },
  char: { position: 'absolute', right: -12, bottom: -10, width: 150, height: (150 * 306) / 480 },
  // 화살표만 (동그란 바탕 없이) · 밝은 포스터에서도 보이게 옅은 그림자
  nx: { width: 34, height: 44, alignItems: 'center', justifyContent: 'center' },
  nxText: { fontFamily: Font.body900, fontSize: 30, lineHeight: 34, textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
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
