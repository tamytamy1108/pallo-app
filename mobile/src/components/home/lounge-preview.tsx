import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';

import { Raised } from '@/components/ui/raised';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { LANG_CHIP, LOUNGE_HIGHLIGHTS, type LoungeHighlight, type Poster } from '@/data/home';
import { EASE } from '@/lib/motion';

import { ARROW_PATH, LineIcon } from './icons';
import { MemberFace } from './member-face';

const GAP = 12;
const ROTATE_MS = 2500;

/**
 * 홈 라운지 미리보기 (프로토타입 .azit-feed · afItems · setAzit).
 * 내 지점 · 해외살이 · 동아리 인기 글이 2.5초마다 넘어가는 순환 슬라이드. 가운데 카드 78% · 양옆은 작고 흐리게.
 * 손으로 밀기 · 옆 카드 누르기 · 아래 점 누르기로도 넘어가고, 가운데 카드를 누르면 그 글(상세)로 가요.
 */
export function LoungePreview() {
  const items = LOUNGE_HIGHLIGHTS;
  const n = items.length;
  const still = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [w, setW] = useState(0);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const trackH = Math.max(0, ...Object.values(heights));

  // 2.5초마다 다음 카드 (넘길 때마다 다시 2.5초 · 움직임 줄이기면 멈춰요)
  useEffect(() => {
    if (still) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % n), ROTATE_MS);
    return () => clearInterval(t);
  }, [idx, n, still]);

  // 좌우로 밀어서 넘기기 (30px 넘게 밀면) · 민 직후의 누름은 카드 열기로 치지 않아요
  const [swipe] = useState(() => {
    let moved = false;
    const pan = PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dx) > 30) {
          moved = true;
          setIdx((i) => (i + (g.dx < 0 ? 1 : -1) + n) % n);
          setTimeout(() => (moved = false), 50);
        }
      },
    });
    return { handlers: pan.panHandlers, justSwiped: () => moved };
  });

  const cardW = w * 0.78;

  return (
    <View style={styles.wrap} accessibilityLabel="라운지 새 소식">
      <Pressable onPress={() => router.push('/lounge')} accessibilityRole="button" accessibilityLabel="라운지 입장하기">
        {({ pressed }) => (
          <Raised radius={20} pressed={pressed}>
            <View style={styles.head}>
              <PText style={styles.headT} color={Colors.white}>
                라운지
              </PText>
              <PText style={styles.headS} color="#CFC9DA" numberOfLines={1}>
                피드 · 번개 · 동아리 · 해외살이
              </PText>
              <View style={styles.go}>
                <LineIcon d={ARROW_PATH} size={18} width={2.8} />
              </View>
            </View>
          </Raised>
        )}
      </Pressable>

      <View style={styles.view} onLayout={(e) => setW(e.nativeEvent.layout.width)} {...swipe.handlers}>
        <View style={{ height: trackH || 380 }}>
          {w > 0 &&
            items.map((it, k) => {
              let d = (((k - idx) % n) + n) % n;
              if (d > n / 2) d -= n;
              return (
                <SlideCard
                  key={it.id}
                  item={it}
                  d={d}
                  w={w}
                  cardW={cardW}
                  still={still}
                  onLayout={(h) => setHeights((s) => (s[it.id] === h ? s : { ...s, [it.id]: h }))}
                  onPress={() => {
                    if (swipe.justSwiped()) return;
                    if (d !== 0) setIdx(k);
                    else router.push(it.href as Href);
                  }}
                />
              );
            })}
        </View>
      </View>

      <View style={styles.dots}>
        {items.map((it, k) => (
          <Pressable key={it.id} onPress={() => setIdx(k)} accessibilityRole="button" accessibilityLabel={`${k + 1}번째 게시물 보기`} accessibilityState={{ selected: k === idx }} style={styles.dotHit}>
            <Dot on={k === idx} still={still} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/** 아래 점: 지금 카드는 길쭉한 잉크 막대 (.nb-dots · width .4초) */
function Dot({ on, still }: { on: boolean; still: boolean }) {
  const v = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    v.set(withTiming(on ? 1 : 0, { duration: still ? 0 : 400, easing: EASE }));
  }, [on, still, v]);
  const style = useAnimatedStyle(() => ({ width: 8 + 14 * v.get(), backgroundColor: v.get() > 0.5 ? Colors.ink : Colors.white }));
  return <Animated.View style={[styles.dot, style]} />;
}

/**
 * 카드 하나: 가운데에서의 거리(d)만큼 옆으로 (100% + 12px) · 가운데가 아니면 90% 크기 · 반투명.
 * 반대쪽으로 넘어가는 카드는 순간이동 후 서서히 나타나요 (transform .7초 · opacity .5초).
 */
function SlideCard({ item, d, w, cardW, still, onLayout, onPress }: { item: LoungeHighlight; d: number; w: number; cardW: number; still: boolean; onLayout: (h: number) => void; onPress: () => void }) {
  const x = useSharedValue(d * (cardW + GAP));
  const sc = useSharedValue(d === 0 ? 1 : 0.9);
  const op = useSharedValue(Math.abs(d) > 1 ? 0 : d === 0 ? 1 : 0.55);
  const prev = useRef(d);

  useEffect(() => {
    const jump = Math.abs(d - prev.current) > 1;
    prev.current = d;
    const targetOp = Math.abs(d) > 1 ? 0 : d === 0 ? 1 : 0.55;
    const tx = d * (cardW + GAP);
    const ts = d === 0 ? 1 : 0.9;
    if (jump || still) {
      x.set(tx);
      sc.set(ts);
      op.set(jump && !still ? 0 : targetOp);
      if (jump && !still) op.set(withTiming(targetOp, { duration: 500 }));
      return;
    }
    x.set(withTiming(tx, { duration: 700, easing: EASE }));
    sc.set(withTiming(ts, { duration: 700, easing: EASE }));
    op.set(withTiming(targetOp, { duration: 500 }));
  }, [d, cardW, still, x, sc, op]);

  const style = useAnimatedStyle(() => ({ opacity: op.get(), transform: [{ translateX: x.get() }, { scale: sc.get() }] }));

  return (
    <Animated.View style={[styles.slide, { left: (w - cardW) / 2, width: cardW, zIndex: d === 0 ? 2 : 1 }, style]} onLayout={(e) => onLayout(e.nativeEvent.layout.height)}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${item.channel} 게시물: ${item.text}`} accessibilityElementsHidden={d !== 0} importantForAccessibility={d === 0 ? 'auto' : 'no-hide-descendants'}>
        <View style={styles.cardShadow} />
        <View style={styles.card}>
          <PosterArt poster={item.poster} />
          <View style={StyleSheet.flatten([styles.badge, { backgroundColor: item.channelColor }])}>
            <PText style={styles.badgeText}>{item.channel}</PText>
          </View>
          {item.photos > 1 && (
            <View style={styles.count}>
              <PText style={styles.countText}>1/{item.photos}</PText>
            </View>
          )}
          <View style={styles.body}>
            <View style={styles.who}>
              <MemberFace size={28} bg={item.face.bg} body={item.face.body} />
              <PText style={styles.whoName}>{item.who}</PText>
              <PText style={styles.whoTime} color={Colors.inkSub}>
                · {item.time}
              </PText>
            </View>
            <View style={styles.hostRow}>
              <View style={StyleSheet.flatten([styles.chip, styles.chipBranch])}>
                <PText style={styles.chipBranchText}>{item.branch}</PText>
              </View>
              {item.langs.map((l) => (
                <View key={l} style={StyleSheet.flatten([styles.chip, { backgroundColor: LANG_CHIP[l] ?? Colors.ink }])}>
                  <PText style={styles.chipText} color={Colors.white}>
                    {l}
                  </PText>
                </View>
              ))}
            </View>
            <PText style={styles.text} numberOfLines={2}>
              {item.text}
            </PText>
            {item.likes !== null && (
              <View style={styles.react}>
                <Svg width={16} height={16} viewBox="0 0 24 24">
                  <Path
                    d="M12 20s-7.5-4.6-9.2-9.4C1.6 7 4 4 7.2 4c2 0 3.6 1.2 4.8 2.8C13.2 5.2 14.8 4 16.8 4 20 4 22.4 7 21.2 10.6 19.5 15.4 12 20 12 20z"
                    fill={Colors.rosePink}
                    stroke={Colors.ink}
                    strokeWidth={1.8}
                    strokeLinejoin="round"
                  />
                </Svg>
                <PText style={styles.reactText} color={Colors.inkSub}>
                  {item.likes}
                </PText>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/* ───────── 사진 자리 (프로토타입 LG_PICS · af-big) — 실제 앱은 올린 사진 ───────── */

const G160 = { start: { x: 0.33, y: 0 }, end: { x: 0.67, y: 1 } };

function PosterArt({ poster }: { poster: Poster }) {
  if (poster.kind === 'party') {
    return (
      <View style={StyleSheet.flatten([styles.ph, { backgroundColor: Colors.purple }])}>
        <PText style={styles.partyText} color={Colors.yellow}>
          {'HALLO\nWEEN\nNIGHT'}
        </PText>
        <PText style={styles.partyMeta} color={Colors.white}>
          영등포 · 10.31
        </PText>
        <View style={styles.partyBig} />
        <View style={styles.partySmall} />
      </View>
    );
  }
  if (poster.kind === 'ramen') {
    return (
      <View style={StyleSheet.flatten([styles.ph, { backgroundColor: Colors.rosePink }])}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <Pattern id="ramenStripe" width={36 * Math.SQRT2} height={36 * Math.SQRT2} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <Rect x={18 * Math.SQRT2} width={18 * Math.SQRT2} height={36 * Math.SQRT2} fill="rgba(255,255,255,0.18)" />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#ramenStripe)" />
        </Svg>
        <PText style={styles.ramenText} color={Colors.white}>
          {'RAMEN\nIN FUKUOKA'}
        </PText>
        <View style={styles.bowl} />
        <View style={styles.rim} />
      </View>
    );
  }
  return (
    <LinearGradient colors={poster.bg} start={G160.start} end={G160.end} style={styles.ph}>
      <View style={styles.bigWrap}>
        {poster.kind === 'quote' && (
          <PText style={styles.big} color={Colors.white}>
            {poster.text}
          </PText>
        )}
        {poster.kind === 'date' && (
          <>
            <PText style={styles.big} color={Colors.white}>
              {poster.day}
            </PText>
            <PText style={styles.bigSmall} color={Colors.white}>
              {poster.sub}
            </PText>
          </>
        )}
        {poster.kind === 'kicker' && (
          <PText style={StyleSheet.flatten([styles.big, styles.bigK])} color={Colors.white}>
            {poster.text}
          </PText>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, marginTop: 6 },
  head: { minHeight: 58, paddingLeft: 18, paddingRight: 9, borderRadius: 20, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.ink, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headT: { fontFamily: Font.display, fontSize: 18, lineHeight: 23, letterSpacing: -0.3 },
  headS: { flex: 1, minWidth: 0, fontFamily: Font.body700, fontSize: 12, lineHeight: 16 },
  go: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.yellow, borderWidth: 2, borderColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  view: { marginHorizontal: -16, paddingTop: 4, paddingBottom: 12, overflow: 'hidden' },
  slide: { position: 'absolute', top: 0 },
  cardShadow: { position: 'absolute', top: 4, left: 4, right: -4, bottom: -4, borderRadius: 24, backgroundColor: Colors.ink },
  card: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 24, backgroundColor: Colors.white, overflow: 'hidden', marginRight: 4, marginBottom: 4 },
  ph: { height: 214, borderBottomWidth: 2, borderColor: Colors.ink, overflow: 'hidden' },
  badge: { position: 'absolute', left: 12, top: 12, height: 28, paddingHorizontal: 12, borderRadius: 14, borderWidth: 2, borderColor: Colors.ink, justifyContent: 'center' },
  badgeText: { fontFamily: Font.body900, fontSize: 12, lineHeight: 16 },
  count: { position: 'absolute', right: 12, top: 214 - 12 - 24, height: 24, paddingHorizontal: 9, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.9)', borderWidth: 1.5, borderColor: Colors.ink, justifyContent: 'center' },
  countText: { fontFamily: Font.display, fontSize: 10, lineHeight: 13 },
  body: { paddingTop: 12, paddingHorizontal: 14, paddingBottom: 14, gap: 8 },
  who: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  whoName: { fontFamily: Font.body800, fontSize: 13, lineHeight: 18 },
  whoTime: { fontFamily: Font.body500, fontSize: 13, lineHeight: 18 },
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  chip: { height: 24, paddingHorizontal: 9, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.ink, justifyContent: 'center' },
  chipBranch: { backgroundColor: Colors.white },
  chipBranchText: { fontFamily: Font.display, fontSize: 10, lineHeight: 14 },
  chipText: { fontFamily: Font.body800, fontSize: 11, lineHeight: 15 },
  text: { fontFamily: Font.body700, fontSize: 15, lineHeight: 21 },
  react: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reactText: { fontFamily: Font.body800, fontSize: 12, lineHeight: 16 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
  dotHit: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  dot: { height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: Colors.ink },
  // 포스터 글씨: 프로토타입 홈 카드에서는 .w 자리 규칙이 안 걸려 왼쪽 위부터 본문 글꼴로 흘러요 (보이는 그대로)
  partyBig: { position: 'absolute', right: -30, top: -30, width: 170, height: 170, borderRadius: 85, backgroundColor: Colors.rosePink, borderWidth: 2, borderColor: Colors.ink },
  partySmall: { position: 'absolute', right: 40, top: 62, width: 62, height: 62, borderRadius: 31, backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.ink },
  partyText: { fontFamily: Font.body500, fontSize: 36, lineHeight: 52 },
  partyMeta: { fontFamily: Font.body500, fontSize: 11, lineHeight: 16 },
  bowl: { position: 'absolute', left: '21%', top: '42%', marginTop: -48, width: '58%', height: 96, borderBottomLeftRadius: 100, borderBottomRightRadius: 100, backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.ink },
  rim: { position: 'absolute', left: '17%', top: '27%', width: '66%', height: 15, borderRadius: 8, backgroundColor: Colors.yellow, borderWidth: 2, borderColor: Colors.ink },
  ramenText: { fontFamily: Font.body500, fontSize: 26, lineHeight: 38, textShadowColor: Colors.ink, textShadowRadius: 1, textShadowOffset: { width: 0, height: 0 } },
  bigWrap: { position: 'absolute', left: 16, right: 16, top: 0, bottom: 0, justifyContent: 'center' },
  big: { fontFamily: Font.display, fontSize: 22, lineHeight: 26.4, textAlign: 'center' },
  bigSmall: { marginTop: 6, fontFamily: Font.body800, fontSize: 13, lineHeight: 18, textAlign: 'center', opacity: 0.9 },
  bigK: { fontSize: 18, lineHeight: 21.6, letterSpacing: 0.5 },
});
