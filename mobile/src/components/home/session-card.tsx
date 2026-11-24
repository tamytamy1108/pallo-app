import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { css, cubicBezier, useAnimatedProps, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { ClipPath, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { QR_BEFORE, SLOTS } from '@/data/home';
import { kf, SPRING, useLoop } from '@/lib/motion';
import { createStore } from '@/lib/store';

import { countOf, fmtMin, heroOf, useAttend, useClock, type Hero } from './attendance';
import { ARROW_PATH, CHECK_PATH, LineIcon, QR_PATH } from './icons';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * 클래퍼보드 줄무늬 팔 (프로토타입 .hero-arm: repeating-linear-gradient(-55deg, ink 0 22px, cream 22px 44px)).
 * SVG Pattern + 회전은 아이폰에서 삼각형처럼 깨져 보여서, 줄마다 평행사변형으로 직접 그려요.
 */
const ARM_H = 32;
const STRIPE = 22;
// CSS -55deg: 색이 바뀌어 가는 방향 (화면 좌표, y 는 아래로)
const DX = Math.sin((-55 * Math.PI) / 180);
const DY = -Math.cos((-55 * Math.PI) / 180);
function ClapperArm() {
  const [w, setW] = useState(0);
  // p = x·DX + y·DY 가 [k·44, k·44+22) 인 띠가 잉크색. 띠 경계선 위에서 y 를 알 때 x 를 구해요
  const xAt = (p: number, y: number) => (p - y * DY) / DX;
  const bands: string[] = [];
  if (w) {
    const ps = [0, w * DX, ARM_H * DY, w * DX + ARM_H * DY];
    const lo = Math.floor(Math.min(...ps) / (STRIPE * 2)) - 1;
    const hi = Math.ceil(Math.max(...ps) / (STRIPE * 2)) + 1;
    for (let k = lo; k <= hi; k++) {
      const a = k * STRIPE * 2;
      const b = a + STRIPE;
      const y0 = -2;
      const y1 = ARM_H + 2;
      bands.push(`M${xAt(a, y0).toFixed(2)},${y0} L${xAt(b, y0).toFixed(2)},${y0} L${xAt(b, y1).toFixed(2)},${y1} L${xAt(a, y1).toFixed(2)},${y1} Z`);
    }
  }
  return (
    <View style={styles.arm} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w ? (
        <Svg width={w} height={ARM_H}>
          <Rect width={w} height={ARM_H} fill={Colors.cream} />
          <Path d={bands.join(' ')} fill={Colors.ink} />
        </Svg>
      ) : null}
    </View>
  );
}

/**
 * 오늘 스터디 카드 (프로토타입 홈의 클래퍼보드 hero).
 * 위 칸: 스터디 시각 · 시작까지 · 날짜 / 아래 분홍 칸: ACTION! · 출석체크 하기 · 캐릭터.
 */
/**
 * 카드 제목 · 보라 팔로 포즈: 홈에 들어올 때마다 차례로 바뀌어요 (프로토타입 STAGE_LINES · 기본 → 기울이기 → 점프).
 * 앱을 다시 켜도 다음 차례부터 — 마지막 차례를 기기에 남겨요 (프로토타입 `pallo-stage-line`)
 */
const STAGE_LINES = ['Take the stage.', 'Your stage is ready.', 'The stage is yours.'];
const stageTurn = createStore(-1, { persist: { key: 'stage-line' } });

export function SessionCard({ onOpen }: { onOpen: (mode: 'rsvp' | 'checkin') => void }) {
  const [stage, setStage] = useState(0);
  useFocusEffect(
    useCallback(() => {
      stageTurn.set((n) => (n + 1) % STAGE_LINES.length);
      setStage(stageTurn.get());
    }, []),
  );
  const now = useClock();
  const attend = useAttend();
  const hero = heroOf(attend, now);
  const count = countOf(attend, now);
  // 출석하고 스터디가 시작되면 제목이 바뀌어요 (포즈는 그대로)
  const title = hero.kind === 'onair' ? "You're on stage." : STAGE_LINES[stage];

  return (
    <View style={styles.wrap}>
      <ClapperArm />
      <View style={styles.shadowBox}>
        <View style={styles.shadow} />
        <View style={styles.body}>
          <View style={styles.fields}>
            <Field label="스터디" value={count.time} big />
            <Field label={count.label} value={count.value} big divider />
            <Field label="DATE" value={`${now.getMonth() + 1}.${pad(now.getDate())}`} divider narrow />
          </View>
          <View style={styles.main}>
            <HeroChar pose={POSES[stage]} />
            <View style={styles.live}>
              <LiveDot live={hero.live} />
              <PText style={styles.liveText}>{hero.badge}</PText>
            </View>
            <SwapTitle text={title} />
            <HeroActions hero={hero} slot={attend.slot} onOpen={onOpen} />
          </View>
        </View>
      </View>
    </View>
  );
}

/** 상태마다 버튼 (프로토타입 #heroActions: .hero-btn · .go · [disabled] · .done · .hero-link) */
function HeroActions({ hero, slot, onOpen }: { hero: Hero; slot: number; onOpen: (mode: 'rsvp' | 'checkin') => void }) {
  if (hero.kind === 'onair' || hero.kind === 'entered') {
    const label = hero.kind === 'onair' ? '입장 완료 · 무대 위' : '입장 완료!';
    return (
      <View style={styles.actions} accessible accessibilityLabel={label}>
        <View style={StyleSheet.flatten([styles.btn, styles.btnWhite])}>
          <QrBadge d={CHECK_PATH} />
          <PText style={styles.btnText}>{label}</PText>
        </View>
      </View>
    );
  }
  if (hero.kind === 'rsvp') {
    const from = `${fmtMin(SLOTS[slot].start - QR_BEFORE)}부터 출석`;
    return (
      <View style={styles.actions}>
        <View style={StyleSheet.flatten([styles.btn, styles.btnWhite, styles.btnFlat])} accessible accessibilityLabel={from} accessibilityState={{ disabled: true }}>
          <QrBadge d={QR_PATH} />
          <PText style={styles.btnText}>{from}</PText>
        </View>
        <Pressable onPress={() => onOpen('rsvp')} accessibilityRole="button" accessibilityLabel="사전 출석 변경" hitSlop={4}>
          {({ pressed }) => (
            <View style={StyleSheet.flatten([styles.link, pressed && styles.linkPressed])}>
              <PText style={styles.linkText}>변경</PText>
            </View>
          )}
        </Pressable>
      </View>
    );
  }
  const go = hero.kind === 'action';
  const label = go ? '출석체크 하기' : hero.kind === 'off' ? '그래도 갈래요' : '사전 출석체크';
  return (
    <View style={styles.actions}>
      <Pressable onPress={() => onOpen(go ? 'checkin' : 'rsvp')} accessibilityRole="button" accessibilityLabel={label}>
        {({ pressed }) => (
          <View style={StyleSheet.flatten([styles.btn, pressed && styles.btnPressed])}>
            {go && <Shine />}
            <QrBadge d={QR_PATH} />
            <PText style={styles.btnText}>{label}</PText>
            <LineIcon d={ARROW_PATH} size={20} width={2.4} />
          </View>
        )}
      </Pressable>
    </View>
  );
}

/** 버튼 왼쪽 보라 동그라미 아이콘 (.qi) */
function QrBadge({ d }: { d: string }) {
  return (
    <View style={styles.qr}>
      <LineIcon d={d} size={20} width={2.2} color={Colors.white} />
    </View>
  );
}

/* ───────── 움직임 (프로토타입 .hero-*) ───────── */

/** 제목 문구가 바뀔 때마다 아래에서 톡 올라와요 (lineIn .55초) */
function SwapTitle({ text }: { text: string }) {
  const still = useReducedMotion();
  const p = useSharedValue(1);
  useEffect(() => {
    if (still) return;
    p.set(0);
    p.set(withTiming(1, { duration: 550, easing: SPRING }));
  }, [text, still, p]);
  const style = useAnimatedStyle(() => ({ opacity: Math.min(p.get() * 1.4, 1), transform: [{ translateY: 8 * (1 - p.get()) }] }));
  return (
    <Animated.View style={style}>
      <PText variant="title" style={styles.heroTitle}>
        {text}
      </PText>
    </Animated.View>
  );
}

const SHINE_EASE = cubicBezier(0.45, 0, 0.25, 1);

/** ACTION! 빨간 점: 둘레로 빨간 빛이 퍼지며 사라져요 (liveDot 1.4초 ease-out · CSS 애니메이션) */
const liveRing = css.keyframes({
  '0%': { opacity: 0.7, transform: [{ scale: 1 }] },
  '70%, 100%': { opacity: 0, transform: [{ scale: 2.6 }] },
});
function LiveDot({ live }: { live: Hero['live'] }) {
  const still = useReducedMotion();
  // 대기: 흰 점 · 출석 가능 / 스터디 중: 빨간 점 + 퍼지는 빛 · 입장 완료: 잉크 점 (.hero-live · .on · .done)
  const fill = live === 'on' ? '#FF4D4D' : live === 'done' ? Colors.ink : Colors.white;
  return (
    <View>
      {live === 'on' && !still && (
        <Animated.View
          style={[styles.liveRing, { opacity: 0, animationName: liveRing, animationDuration: '1.4s', animationIterationCount: 'infinite', animationTimingFunction: 'ease-out' }]}
        />
      )}
      <View style={StyleSheet.flatten([styles.liveDot, { backgroundColor: fill }])} />
    </View>
  );
}

/** 출석 버튼 위로 흰 빛이 5초마다 스쳐 지나가요 (btnShine 5초 · 1초 뒤 시작 · CSS 애니메이션) */
function Shine() {
  const still = useReducedMotion();
  const [w, setW] = useState(0);
  const kf = useMemo(
    () =>
      css.keyframes({
        '0%, 40%': { transform: [{ translateX: -0.7 * w }, { skewX: '-18deg' }], animationTimingFunction: SHINE_EASE },
        '100%': { transform: [{ translateX: 1.35 * w }, { skewX: '-18deg' }] },
      }),
    [w],
  );
  return (
    <View style={styles.shineBox} pointerEvents="none" onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w > 0 && !still && (
        <Animated.View
          style={[
            styles.shine,
            { width: w * 0.46, transform: [{ translateX: -0.7 * w }, { skewX: '-18deg' }] },
            { animationName: kf, animationDuration: '5s', animationDelay: '1s', animationIterationCount: 'infinite', animationTimingFunction: 'linear' },
          ]}>
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient id="shine" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#fff" stopOpacity={0} />
                <Stop offset="0.3" stopColor="#FFEC8C" stopOpacity={0.22} />
                <Stop offset="0.5" stopColor="#fff" stopOpacity={0.9} />
                <Stop offset="0.7" stopColor="#FFEC8C" stopOpacity={0.22} />
                <Stop offset="1" stopColor="#fff" stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#shine)" />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}

/** cornerBreathe 3초: 숨 쉬듯 살짝 눌렸다 펴져요 (아래 기준) */
const breathe = css.keyframes({
  '0%, 100%': { transform: [{ scaleX: 1 }, { scaleY: 1 }] },
  '50%': { transform: [{ scaleX: 1.03 }, { scaleY: 0.97 }] },
});

type Pose = 'standard' | 'tilt' | 'jump';
const POSES: Pose[] = ['standard', 'tilt', 'jump'];
/** 포즈마다 이미지 · 크기 · 자리 · 눈 위치 [가운데 x, y, 가로 반지름, 세로 반지름, 기울기°] (원본 픽셀 · 프로토타입 HERO_EYES) */
const POSE = {
  standard: { src: require('@/assets/characters/c-purple-standard-3d.png'), W: 480, H: 335, width: 150, right: -22, bottom: -26, eyes: [[172.5, 69.6, 33.3, 47.2, -4.1], [251.0, 68.0, 33.4, 47.5, -5.2]] },
  tilt: { src: require('@/assets/characters/c-purple-tilt-3d.png'), W: 480, H: 352, width: 124, right: -12, bottom: -20, eyes: [[180.9, 69.1, 33.5, 47.6, 7.8], [258.5, 83.9, 33.5, 47.6, 6.7]] },
  jump: { src: require('@/assets/characters/c-purple-jump-3d.png'), W: 480, H: 484, width: 96, right: -2, bottom: -12, eyes: [[179.9, 68.6, 33.4, 47.4, 5.8], [256.4, 80.5, 33.4, 47.4, 4.9]] },
} as const;

/** 보라 팔로: 숨 쉬듯 살짝 눌렸다 펴지고(cornerBreathe 3초), 3초마다 눈을 깜빡여요 (avBlink) */
function HeroChar({ pose }: { pose: Pose }) {
  const p = POSE[pose];
  const h = (p.width * p.H) / p.W;
  const still = useReducedMotion();
  const body = still ? {} : { animationName: breathe, animationDuration: '3s', animationIterationCount: 'infinite' as const, animationTimingFunction: 'ease-in-out' as const };
  const [delay] = useState(() => Math.round(Math.random() * 3000));
  const blink = useLoop(3000, { delay });
  const ry0 = p.eyes[0][3];
  const ry1 = p.eyes[1][3];
  const lid0 = useAnimatedProps(() => ({ height: (ry0 * 2 + 4) * kf(blink.get(), [0, 90, 93, 95, 100], [0, 0, 1, 1, 0]) }));
  const lid1 = useAnimatedProps(() => ({ height: (ry1 * 2 + 4) * kf(blink.get(), [0, 90, 93, 95, 100], [0, 0, 1, 1, 0]) }));
  const lids = [lid0, lid1];
  return (
    <Animated.View style={[styles.char, { width: p.width, height: h, right: p.right, bottom: p.bottom, transformOrigin: 'center bottom' }, body]} pointerEvents="none">
      <Image source={p.src} style={StyleSheet.absoluteFill} contentFit="contain" accessibilityIgnoresInvertColors />
      <Svg width={p.width} height={h} viewBox={`0 0 ${p.W} ${p.H}`} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={`lid-${pose}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#8B73E3" />
            <Stop offset="0.7" stopColor="#6C4FD6" />
            <Stop offset="1" stopColor="#5B40C0" />
          </LinearGradient>
          {p.eyes.map(([x, y, rx, ry], i) => (
            <ClipPath key={i} id={`eye-${pose}-${i}`}>
              <Ellipse cx={x} cy={y} rx={rx} ry={ry} />
            </ClipPath>
          ))}
        </Defs>
        {p.eyes.map(([x, y, rx, ry, a], i) => (
          <G key={i} transform={`rotate(${a} ${x} ${y})`} clipPath={`url(#eye-${pose}-${i})`}>
            <AnimatedRect x={x - rx - 2} y={y - ry - 2} width={rx * 2 + 4} fill={`url(#lid-${pose})`} animatedProps={lids[i]} />
          </G>
        ))}
      </Svg>
    </Animated.View>
  );
}

function Field({ label, value, big, divider, narrow }: { label: string; value: string; big?: boolean; divider?: boolean; narrow?: boolean }) {
  return (
    <View style={StyleSheet.flatten([styles.field, divider && styles.fieldDivider, { flex: narrow ? 0.8 : 1 }])}>
      <PText style={styles.fieldLabel} color={Colors.inkSub}>
        {label}
      </PText>
      <PText style={big ? styles.fieldBig : styles.fieldValue}>{value}</PText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 4, paddingTop: 35 },
  arm: { position: 'absolute', left: 0, right: 0, top: 0, height: 32, borderWidth: 2.5, borderColor: Colors.ink, borderTopLeftRadius: 10, borderTopRightRadius: 10, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, overflow: 'hidden' },
  shadowBox: { marginRight: 4, marginBottom: 4 },
  shadow: { position: 'absolute', top: 4, left: 4, right: -4, bottom: -4, backgroundColor: Colors.ink, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  body: { borderWidth: 2.5, borderColor: Colors.ink, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: 'hidden', backgroundColor: Colors.rosePink },
  fields: { flexDirection: 'row', backgroundColor: Colors.cream, borderBottomWidth: 2, borderColor: Colors.ink },
  field: { paddingTop: 9, paddingBottom: 10, paddingHorizontal: 12 },
  fieldDivider: { borderLeftWidth: 2, borderColor: Colors.ink },
  fieldLabel: { fontFamily: Font.display, fontSize: 9.5, lineHeight: 12, letterSpacing: 1.5 },
  fieldBig: { marginTop: 2, fontFamily: Font.display, fontSize: 25, lineHeight: 30, letterSpacing: -0.3, fontVariant: ['tabular-nums'] },
  fieldValue: { marginTop: 2, fontFamily: Font.body900, fontSize: 15, lineHeight: 30 },
  main: { paddingTop: 14, paddingHorizontal: 14, paddingBottom: 16, minHeight: 150 },
  char: { position: 'absolute' },
  liveRing: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF4D4D' },
  shineBox: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 28, overflow: 'hidden' },
  shine: { position: 'absolute', top: -2, bottom: -2, left: 0 },
  live: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  liveDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: Colors.ink, backgroundColor: '#FF4D4D' },
  liveText: { fontFamily: Font.display, fontSize: 13, lineHeight: 16, letterSpacing: 1.5 },
  heroTitle: { marginTop: 6, fontSize: 22, lineHeight: 25, letterSpacing: -0.8 },
  actions: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  btn: { height: 52, paddingLeft: 6, paddingRight: 18, borderRadius: 28, borderWidth: 2.5, borderColor: Colors.ink, backgroundColor: Colors.cream, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 6 },
  btnPressed: { transform: [{ translateY: 4 }], borderBottomWidth: 2.5 },
  // 입장 완료 · 출석 전(잠김): 흰 바탕 (.hero-btn.done · [disabled] 는 그림자도 없이)
  btnWhite: { backgroundColor: Colors.white },
  btnFlat: { borderBottomWidth: 2.5 },
  link: { height: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, justifyContent: 'center', boxShadow: '2px 2px 0 #1E1A2B' },
  linkPressed: { transform: [{ translateX: 2 }, { translateY: 2 }], boxShadow: '0 0 0 #1E1A2B' },
  linkText: { fontFamily: Font.body800, fontSize: 13.5, lineHeight: 18 },
  qr: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.purple, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontFamily: Font.body900, fontSize: 16, lineHeight: 22 },
});
