import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { popupsQuery } from '@/api/queries';
import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import type { LaunchPopup as Popup } from '@/data/home';

import { nowDate } from './attendance';

/*
 * 앱을 열 때 팝업 공지 (프로토타입 POPS · popShow · .pop-wrap · .pop-c).
 * 본사 관리자가 올린 공지를 0.9초 뒤 보여 줘요. 여러 개면 ‹ › 로 넘겨요. '오늘은 그만 보기'를 누르면 오늘은 다시 안 떠요.
 * 만드는 화면은 관리자용이라 나중에 (여기선 보여 주기만). 데이터: A1 GET /popups (받기 전 · 실패면 안 떠요).
 */

const today = () => {
  const d = nowDate();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
// TODO: 기기 저장소(AsyncStorage) 붙이면 앱을 다시 켜도 '오늘은 그만 보기'가 남게
const hiddenOn: Record<string, string> = {};
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
  const [list] = useState(() => popups.filter((p) => p.until >= today() && hiddenOn[p.id] !== today()));
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
  const many = list.length > 1;
  const step = (by: number) => setI((k) => (k + by + list.length) % list.length);

  return (
    <Modal visible transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      <Animated.View style={[styles.wrap, dim]} accessibilityViewIsModal accessibilityLabel="공지 팝업">
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityRole="button" accessibilityLabel="닫기" />
        <View style={styles.cardBox}>
          <View style={styles.cardShadow} />
          <View style={styles.card}>
            <LinearGradient colors={p.bg} start={{ x: 0.33, y: 0 }} end={{ x: 0.67, y: 1 }} style={styles.im}>
              {many && (
                <View style={styles.n}>
                  <PText style={styles.nText} color={Colors.white}>
                    {i + 1} / {list.length}
                  </PText>
                </View>
              )}
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
              {many && (
                <>
                  <Pressable onPress={() => step(-1)} accessibilityRole="button" accessibilityLabel="이전" style={StyleSheet.flatten([styles.nx, styles.pv])}>
                    <PText style={styles.nxText} color={Colors.white}>
                      ‹
                    </PText>
                  </Pressable>
                  <Pressable onPress={() => step(1)} accessibilityRole="button" accessibilityLabel="다음" style={StyleSheet.flatten([styles.nx, styles.nn])}>
                    <PText style={styles.nxText} color={Colors.white}>
                      ›
                    </PText>
                  </Pressable>
                </>
              )}
            </LinearGradient>
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
                  list.forEach((x) => (hiddenOn[x.id] = today()));
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: 'rgba(30,26,43,0.55)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  cardBox: { width: '100%', maxWidth: 330 },
  cardShadow: { position: 'absolute', left: 5, top: 5, right: -5, bottom: -5, borderRadius: 24, backgroundColor: Colors.ink },
  card: { backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.ink, borderRadius: 24, overflow: 'hidden' },
  im: { height: 320, paddingVertical: 22, paddingHorizontal: 20, overflow: 'hidden' },
  n: { position: 'absolute', right: 12, top: 12, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.4)' },
  nText: { fontFamily: Font.body900, fontSize: 11, lineHeight: 15 },
  k: { fontFamily: Font.display, fontSize: 11, lineHeight: 14, letterSpacing: 2 },
  t: { marginTop: 10, fontFamily: Font.display, fontSize: 28, lineHeight: 31.4 },
  s: { marginTop: 10, fontFamily: Font.body800, fontSize: 13, lineHeight: 18, opacity: 0.9 },
  char: { position: 'absolute', right: -12, bottom: -10, width: 150, height: (150 * 306) / 480 },
  nx: { position: 'absolute', top: '50%', marginTop: -17, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  pv: { left: 8 },
  nn: { right: 8 },
  nxText: { fontFamily: Font.body900, fontSize: 22, lineHeight: 26 },
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
