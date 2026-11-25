import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/js-stack';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from '@/components/ui/safe-area';
import Svg, { Path, Rect } from 'react-native-svg';

import { bookShelfQuery, situationMapsQuery } from '@/api/queries';
import { Pressable } from '@/components/ui/pressable';
import { SCREEN } from '@/lib/transitions';
import { LR_ORD, LR_SPD, NEXT, listenPrefs, setListenPrefs } from '@/components/library/listen-prefs';
import { useListenPlayer } from '@/components/library/listen-player';
import { BookmarkIcon, CheckIcon, CloseIcon } from '@/components/lesson/icons';
import { ProgressBar, SoundButton } from '@/components/lesson/lesson-top';
import { Raised } from '@/components/ui/raised';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { findLevel, lessonName, listenItemsOf, listenItemsOfLevel, listenItemsOfMap, parseUnitId, type ListenItem } from '@/data/library';
import { findScene, localSceneListenItems } from '@/data/situation';
import { sfx } from '@/lib/feedback';
import { toggleExpression, useSavedExpressions } from '@/state/expressions';
import { setNoListen, useLearnPrefs } from '@/state/learn-prefs';
import { ChipScroll } from '@/components/ui/chip-scroll';
import { stopSpeaking } from '@/lib/tts';
import { seeAt, SEE } from '@/lib/see';

/**
 * 리스닝 룸 (프로토타입 openListen · lrRender): 붙어 있는 보라 재생 카드 · 설정 칩 · 재생 목록 칩 · 문장 줄.
 * 주소: ?unit=1-1 (그 과) · ?level=1 (그 레벨 전체) · ?map=travel (상황 맵 전체) · ?key=travel-1 (그 장면 · 상황 장면 화면에서)
 * 제목은 받아 둔 책장(17) · 맵(16)에서, 문장은 아직 앱에 든 값 (24 `/lessons/:id/listen-items` 를 옮기기 전)
 */
function useSource() {
  const p = useLocalSearchParams<{ unit?: string; level?: string; map?: string; key?: string }>();
  const shelf = useQuery(bookShelfQuery()).data;
  const maps = useQuery(situationMapsQuery()).data?.maps;
  return useMemo(() => {
    if (p.unit) {
      const { lv, no } = parseUnitId(p.unit);
      const L = shelf && findLevel(shelf, lv);
      const ls = L?.lessons.find((x) => x.no === no);
      return { title: L && ls ? lessonName(L, ls) : '', items: listenItemsOf(p.unit) };
    }
    if (p.level) {
      const L = shelf && findLevel(shelf, Number(p.level));
      return { title: L ? `Lv.${L.lv} ${L.series}` : '', items: L ? listenItemsOfLevel(L) : [] };
    }
    if (p.map) {
      const m = maps?.find((x) => x.id === p.map);
      return { title: m ? `${m.title} 맵` : '', items: m ? listenItemsOfMap(m) : [] };
    }
    if (p.key) {
      const f = maps ? findScene(maps, p.key) : null;
      return { title: f ? `${f.map.title} · ${f.scene.title}` : '', items: f ? localSceneListenItems(f.scene) : [] };
    }
    return { title: '', items: [] as ListenItem[] };
  }, [p.unit, p.level, p.map, p.key, shelf, maps]);
}

/** 섞기: 같은 seed 면 늘 같은 순서 (그리는 중에도 · 재생 중에도 같은 목록이 되게) */
const shuffle = (n: number, seed: number) => {
  let x = seed || 1;
  const rnd = () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x / 2147483648;
  };
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export default function ListeningScreen() {
  const { title, items: all } = useSource();
  const P = listenPrefs.useStore();
  const { noListen } = useLearnPrefs();
  const saved = useSavedExpressions();
  const [filter, setFilter] = useState('all');
  const [seed, setSeed] = useState(() => 1 + Math.floor(Math.random() * 1e9));
  // 다시 섞기: 지금 seed 로 다음 seed 를 만들어요 (그리는 중에 무작위 함수를 부르지 않게)
  const reshuffle = () => setSeed((x) => (x * 48271) % 2147483647 || 1);
  // 듣기가 어려우면(소리 끄기) 영어를 늘 보여 줘요
  useEffect(() => {
    if (noListen && listenPrefs.get().blind) setListenPrefs({ blind: false });
  }, [noListen]);

  const listOf = (): ListenItem[] => {
    let l: ListenItem[] = filter === 'mark' ? listenPrefsSaved(saved) : all.filter((x) => filter === 'all' || x.tag === filter);
    if (listenPrefs.get().shuf) {
      const o = shuffle(l.length, seed);
      l = o.map((i) => l[i]);
    }
    return l;
  };
  const list = listOf();
  const n = list.length;
  const player = useListenPlayer(listOf);
  const { state } = player;
  // 목록이 줄어 지금 번호가 넘치면 처음 문장을 보여 줘요 (재생기 값은 그대로 두고)
  const at = state.i >= n ? 0 : state.i;
  const cur = list[at];
  const tags = [...new Set(all.map((x) => x.tag))];
  const mins = Math.max(1, Math.round((n * (P.rep * 2.4 + P.gap * P.rep + (P.order === 'en' ? 0 : 2))) / 60));

  // 지금 문장 줄이 보이게 (프로토타입 lrScroll)
  const scroll = useRef<ScrollViewInstance>(null);
  const rowY = useRef<number[]>([]);
  const scrollY = useRef(0);
  const viewH = useRef(0);
  useEffect(() => {
    if (!state.playing) return;
    const y = rowY.current[state.i];
    if (y === undefined) return;
    if (y < scrollY.current + 260 || y + 60 > scrollY.current + viewH.current) scroll.current?.scrollTo({ y: Math.max(0, y - 300), animated: true });
  }, [state.i, state.playing]);

  const toggle = () => {
    if (state.playing) {
      player.stop();
      player.set({ phase: '' });
    } else if (n) player.play(state.i);
  };
  const go = (d: 1 | -1) => {
    if (!n) return;
    const i = (state.i + d + n) % n;
    if (state.playing) player.play(i);
    else player.set({ i, reveal: false });
  };
  const pickFilter = (k: string) => {
    const was = state.playing;
    player.stop();
    setFilter(k);
    reshuffle();
    player.set({ i: 0, phase: '' });
    if (was) setTimeout(() => player.play(0), 0);
  };
  const chip = (k: keyof typeof P, label: string, val: string, on: boolean) => (
    <Pressable
      key={k}
      accessibilityRole="button"
      onPress={() => {
        if (k === 'auto') {
          setListenPrefs({ auto: !P.auto });
          showToast(!P.auto ? '다음 문장으로 이어서 재생해요' : '한 문장 듣고 멈춰요');
        }
        if (k === 'order') setListenPrefs({ order: NEXT.order(P.order) });
        if (k === 'gap') setListenPrefs({ gap: NEXT.gap(P.gap) });
        if (k === 'rep') setListenPrefs({ rep: NEXT.rep(P.rep) });
        if (k === 'rate') setListenPrefs({ rate: NEXT.rate(P.rate) });
        if (k === 'blind') setListenPrefs({ blind: !P.blind });
        if (k === 'shuf') {
          setListenPrefs({ shuf: !P.shuf });
          reshuffle();
          player.set({ i: 0 });
          if (state.playing) setTimeout(() => player.play(0), 0);
        }
        sfx('tap');
      }}
      style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && styles.pressed]}>
      <PText style={[styles.chipText, on && { color: Colors.ink }]}>
        {label}
        {val ? <PText style={styles.chipB}> {val}</PText> : null}
      </PText>
    </Pressable>
  );
  const blur = P.blind && !state.reveal;
  const phase = state.phase || (state.playing ? '재생 중' : P.auto ? '재생을 누르면 차례로 들려줘요' : '한 문장씩 듣고 멈춰요');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={SCREEN.rise} />
      <View style={styles.top}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/library'))} accessibilityRole="button" accessibilityLabel="그만하기" style={styles.close} hitSlop={6}>
          <CloseIcon />
        </Pressable>
        <ProgressBar value={n ? Math.min(1, state.heard.size / n) : 0} />
        <PText style={styles.count}>{n ? `${state.i + 1}/${n}` : '0/0'}</PText>
        <SoundButton
          off={noListen}
          onPress={() => {
            stopSpeaking();
            sfx('toggle');
            setNoListen(!noListen);
            showToast(noListen ? '소리를 다시 켰어요' : '15분 동안 소리를 꺼요');
          }}
        />
      </View>
      <PText style={styles.kick}>리스닝 룸 · {title}</PText>
      <ScrollView
        ref={scroll}
        style={styles.bodyBox}
        contentContainerStyle={styles.body}
        stickyHeaderIndices={[0]}
        onScroll={(e) => {
          scrollY.current = e.nativeEvent.contentOffset.y;
        }}
        onLayout={(e) => {
          viewH.current = e.nativeEvent.layout.height;
        }}
        scrollEventThrottle={64}>
        {/* 붙어 있는 재생 카드 (.lr-np) */}
        <View style={styles.stick}>
          <Raised radius={24} style={styles.tight}>
            <View style={styles.np}>
              <View style={styles.npH}>
                <PText style={styles.npHText}>{cur ? cur.tag : ''}</PText>
                <PText style={styles.npHText}>
                  약 {mins}분 · 들은 문장 {state.heard.size}
                </PText>
              </View>
              <Pressable onPress={() => blur && player.set({ reveal: true })} disabled={!blur} accessibilityLabel={blur ? '영어 보기' : undefined}>
                <PText style={[styles.npE, blur && styles.npEBlur]}>{cur ? cur.en : filter === 'mark' ? '아직 저장한 문장이 없어요' : '문장이 없어요'}</PText>
              </Pressable>
              <PText style={styles.npK}>{cur ? cur.ko : '문장 옆 책갈피를 누르면 나만의 재생 목록이 생겨요'}</PText>
              <View style={styles.phase}>
                <Eq on={state.playing} color={Colors.yellow} />
                <PText style={styles.phaseText}>{phase}</PText>
              </View>
              <View style={styles.ctl}>
                <Pressable onPress={() => go(-1)} accessibilityRole="button" accessibilityLabel="이전 문장" style={styles.ctlBtn}>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill={Colors.white}>
                    <Path d="M6 5h2v14H6zM20 5.5v13a1 1 0 0 1-1.5.86l-10-6.5a1 1 0 0 1 0-1.72l10-6.5A1 1 0 0 1 20 5.5z" />
                  </Svg>
                </Pressable>
                <Pressable onPress={toggle} accessibilityRole="button" accessibilityLabel={state.playing ? '멈춤' : '재생'} style={({ pressed }) => [styles.play, pressed && styles.playPressed]}>
                  {state.playing ? (
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill={Colors.ink}>
                      <Rect x={6} y={4} width={4} height={16} rx={1.5} />
                      <Rect x={14} y={4} width={4} height={16} rx={1.5} />
                    </Svg>
                  ) : (
                    <Svg width={26} height={26} viewBox="0 0 24 24" fill={Colors.ink}>
                      <Path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z" />
                    </Svg>
                  )}
                </Pressable>
                <Pressable onPress={() => go(1)} accessibilityRole="button" accessibilityLabel="다음 문장" style={styles.ctlBtn}>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill={Colors.white}>
                    <Path d="M16 5h2v14h-2zM4 5.5v13a1 1 0 0 0 1.5.86l10-6.5a1 1 0 0 0 0-1.72l-10-6.5A1 1 0 0 0 4 5.5z" />
                  </Svg>
                </Pressable>
              </View>
            </View>
          </Raised>
        </View>

        {/* 설정 칩 (기기에 남음) */}
        <ChipScroll horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow} contentContainerStyle={styles.chips} accessibilityLabel="듣기 설정">
          {chip('auto', '자동 재생', P.auto ? '켬' : '끔', !P.auto)}
          {chip('order', '순서', LR_ORD[P.order], P.order !== 'en-ko')}
          {chip('gap', '따라 말하기', P.gap ? `${P.gap}초` : '끔', !!P.gap)}
          {chip('rep', '반복', `${P.rep}번`, P.rep > 1)}
          {chip('rate', '속도', LR_SPD[String(P.rate)], P.rate !== 0.92)}
          {chip('blind', '영어 가리기', '', P.blind)}
          {chip('shuf', '섞기', '', P.shuf)}
        </ChipScroll>
        {/* 재생 목록 칩 */}
        <ChipScroll horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow} contentContainerStyle={styles.chips} accessibilityLabel="재생 목록">
          {['all', ...tags].map((k) => (
            <Pressable key={k} onPress={() => pickFilter(k)} accessibilityRole="button" accessibilityState={{ selected: filter === k }} style={({ pressed }) => [styles.chip, filter === k && styles.chipSel, pressed && styles.pressed]}>
              <PText style={[styles.chipText, filter === k && { color: Colors.white }]}>{k === 'all' ? `전체 ${all.length}` : k}</PText>
            </Pressable>
          ))}
          <Pressable onPress={() => pickFilter('mark')} accessibilityRole="button" accessibilityState={{ selected: filter === 'mark' }} style={({ pressed }) => [styles.chip, filter === 'mark' && styles.chipSel, pressed && styles.pressed]}>
            <PText style={[styles.chipText, filter === 'mark' && { color: Colors.white }]}>저장한 문장 {saved.length}</PText>
          </Pressable>
        </ChipScroll>

        {/* 문장 줄 */}
        <View style={styles.list}>
          {list.map((x, i) => {
            const now = i === state.i;
            const done = state.heard.has(x.en) && !now;
            return (
              <View
                key={`${x.en}-${i}`}
                onLayout={(e) => {
                  rowY.current[i] = e.nativeEvent.layout.y;
                }}
                style={[styles.row, now && styles.rowNow]}>
                {/* 누르면 거기서부터 재생 (책갈피는 따로 눌러요) */}
                <Pressable onPress={() => player.play(i)} accessibilityRole="button" accessibilityLabel={`${i + 1}번 문장 재생`} style={styles.rowMain}>
                  <View style={[styles.rn, now && styles.rnNow, done && styles.rnDone]}>
                    {now && state.playing ? <Eq on color={Colors.white} small /> : done ? <CheckIcon size={16} w={3.4} /> : <PText style={[styles.rnText, now && { color: Colors.white }]}>{i + 1}</PText>}
                  </View>
                  <View style={styles.rt}>
                    <PText style={[styles.rtB, P.blind && !now && styles.rtBlur]}>{x.en}</PText>
                    <PText style={styles.rtS}>{x.ko}</PText>
                  </View>
                </Pressable>
                <MarkButton en={x.en} ko={x.ko} source={`리스닝 룸 · ${title}`} />
              </View>
            );
          })}
        </View>
      </ScrollView>
      {/* 아래로 흐려지며 끝나요 */}
      <LinearGradient pointerEvents="none" colors={['rgba(251,246,234,0)', Colors.cream]} style={styles.fade} />
    </SafeAreaView>
  );
}

/** 저장한 문장 재생 목록 (내 표현함) */
function listenPrefsSaved(saved: ReturnType<typeof useSavedExpressions>): ListenItem[] {
  return saved.map((m) => ({ en: m.en, ko: m.ko, tag: '저장한 문장' }));
}

/** 책갈피: 내 표현함에 저장 ↔ 빼기 (프로토타입 markSpan · .st-ib) */
function MarkButton({ en, ko, source }: { en: string; ko: string; source: string }) {
  const saved = useSavedExpressions().some((x) => x.en === en);
  return (
    <Pressable
      onPress={() => {
        const on = toggleExpression({ en, ko, source });
        sfx(on ? 'save' : 'tap');
        if (on) showToast('내 표현함에 저장했어요', seeAt(SEE.expressions));
        else showToast('표현함에서 뺐어요');
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: saved }}
      accessibilityLabel={saved ? '표현함에서 빼기' : '내 표현함에 저장'}
      hitSlop={4}
      style={({ pressed }) => [styles.ib, saved && styles.ibOn, pressed && styles.ibPressed]}>
      <BookmarkIcon filled={saved} />
    </Pressable>
  );
}

/** 재생 중 막대 4개 (프로토타입 .lr-eq · lrEq .9s) */
function Eq({ on, color, small = false }: { on: boolean; color: string; small?: boolean }) {
  return (
    <View style={[styles.eq, small && { height: 12 }]}>
      {[0, 200, 400, 100].map((d, i) => (
        <EqBar key={i} delay={d} on={on} color={color} max={small ? 12 : 14} />
      ))}
    </View>
  );
}
function EqBar({ delay, on, color, max }: { delay: number; on: boolean; color: string; max: number }) {
  const still = useReducedMotion();
  const h = useSharedValue(3);
  useEffect(() => {
    if (!on || still) {
      h.set(still && on ? 8 : 3);
      return;
    }
    h.set(withDelay(delay, withRepeat(withSequence(withTiming(max, { duration: 450, easing: Easing.inOut(Easing.ease) }), withTiming(3, { duration: 450, easing: Easing.inOut(Easing.ease) })), -1)));
  }, [on, still, delay, max, h]);
  const style = useAnimatedStyle(() => ({ height: h.value }));
  return <Animated.View style={[styles.eqBar, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 44, marginTop: 16, paddingHorizontal: 16 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  count: { fontFamily: Font.display, fontSize: 13, lineHeight: 16 },
  kick: { marginTop: 20, paddingHorizontal: 20, fontFamily: Font.body800, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  bodyBox: { marginTop: 14 },
  body: { paddingHorizontal: 20, paddingBottom: 40, gap: 14 },
  stick: { backgroundColor: Colors.cream },
  tight: { marginBottom: 0 },
  np: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 24, backgroundColor: Colors.purple, paddingVertical: 14, paddingHorizontal: 16, gap: 8 },
  npH: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  npHText: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16, color: 'rgba(255,255,255,0.8)' },
  npE: { minHeight: 56, fontFamily: Font.body900, fontSize: 21, lineHeight: 28.35, letterSpacing: -0.3, color: Colors.white },
  npEBlur: { color: 'transparent', textShadowColor: 'rgba(255,255,255,0.85)', textShadowRadius: 10, textShadowOffset: { width: 0, height: 0 } },
  npK: { fontFamily: Font.body600, fontSize: 13.5, lineHeight: 19.6, color: 'rgba(255,255,255,0.8)' },
  phase: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 18 },
  phaseText: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 18, color: Colors.yellow },
  eq: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 14 },
  eqBar: { width: 3, borderRadius: 2 },
  ctl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 22, marginTop: 2 },
  ctlBtn: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  play: { width: 64, height: 64, borderRadius: 32, borderWidth: 2.5, borderColor: Colors.ink, backgroundColor: Colors.yellow, alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 0 ${Colors.ink}` },
  playPressed: { transform: [{ translateY: 3 }], boxShadow: `0 1px 0 ${Colors.ink}` },
  chipsRow: { marginHorizontal: -20, flexGrow: 0 },
  chips: { gap: 7, paddingHorizontal: 20, paddingBottom: 2 },
  chip: { height: 34, paddingHorizontal: 12, borderRadius: 17, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, justifyContent: 'center' },
  chipOn: { backgroundColor: Colors.yellow },
  chipSel: { backgroundColor: Colors.ink },
  chipText: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 17, color: Colors.inkSub },
  chipB: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 17, color: Colors.ink },
  list: { gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, paddingRight: 8, paddingLeft: 10, borderRadius: 16, borderWidth: 2, borderColor: 'transparent' },
  rowNow: { backgroundColor: '#FFF8C2', borderColor: Colors.ink },
  rowMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rn: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  rnNow: { backgroundColor: Colors.purple },
  rnDone: { backgroundColor: Colors.yellow },
  rnText: { fontFamily: Font.display, fontSize: 10.5, lineHeight: 13 },
  rt: { flex: 1, minWidth: 0 },
  rtB: { fontFamily: Font.body800, fontSize: 14.5, lineHeight: 20.3 },
  rtBlur: { color: 'transparent', textShadowColor: 'rgba(30,26,43,0.7)', textShadowRadius: 7, textShadowOffset: { width: 0, height: 0 } },
  rtS: { marginTop: 1, fontFamily: Font.body600, fontSize: 12, lineHeight: 16.8, color: Colors.inkSub },
  ib: { width: 36, height: 36, borderRadius: 12, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  ibOn: { backgroundColor: Colors.yellow },
  ibPressed: { transform: [{ scale: 0.92 }] },
  pressed: { transform: [{ scale: 0.96 }] },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 48 },
});
