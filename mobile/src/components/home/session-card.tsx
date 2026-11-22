import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { css, cubicBezier, useAnimatedProps, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { ClipPath, Defs, Ellipse, G, LinearGradient, Path, Pattern, Rect, Stop } from 'react-native-svg';

import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { TODAY_SESSION } from '@/data/mock';
import { kf, SPRING, useLoop } from '@/lib/motion';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const pad = (n: number) => String(n).padStart(2, '0');

/** 세션 시작까지 남은 시간 (1초마다 다시 계산). 시작한 뒤엔 null. */
function useCountdown(hour: number, minute: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const start = new Date(now);
  start.setHours(hour, minute, 0, 0);
  const left = Math.floor((start.getTime() - now) / 1000);
  if (left <= 0) return null;
  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  return h > 0 ? `${pad(h)}:${pad(m)}` : `${pad(m)}:${pad(left % 60)}`;
}

/** 클래퍼보드 줄무늬 팔 */
function ClapperArm() {
  return (
    <View style={styles.arm}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="stripe" width={44} height={44} patternUnits="userSpaceOnUse" patternTransform="rotate(-55)">
            <Rect width={22} height={44} fill={Colors.ink} />
            <Rect x={22} width={22} height={44} fill={Colors.cream} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#stripe)" />
      </Svg>
    </View>
  );
}

/**
 * 오늘 스터디 카드 (프로토타입 홈의 클래퍼보드 hero).
 * 위 칸: 스터디 시각 · 시작까지 · 날짜 / 아래 분홍 칸: ACTION! · 출석체크 하기 · 캐릭터.
 */
/**
 * 카드 제목 · 보라 팔로 포즈: 홈에 들어올 때마다 차례로 바뀌어요 (프로토타입 STAGE_LINES · 기본 → 기울이기 → 점프).
 * TODO: 앱을 다시 켜도 다음 차례부터 — 기기 저장소(AsyncStorage) 붙일 때
 */
const STAGE_LINES = ['Take the stage.', 'Your stage is ready.', 'The stage is yours.'];
let stageTurn = -1;

export function SessionCard({ onCheckIn }: { onCheckIn: () => void }) {
  const { startHour, startMinute } = TODAY_SESSION;
  const [stage, setStage] = useState(0);
  useFocusEffect(
    useCallback(() => {
      stageTurn = (stageTurn + 1) % STAGE_LINES.length;
      setStage(stageTurn);
    }, []),
  );
  const countdown = useCountdown(startHour, startMinute);
  const today = new Date();

  return (
    <View style={styles.wrap}>
      <ClapperArm />
      <View style={styles.shadowBox}>
        <View style={styles.shadow} />
        <View style={styles.body}>
          <View style={styles.fields}>
            <Field label="스터디" value={`${pad(startHour)}:${pad(startMinute)}`} big />
            <Field label={countdown ? '시작까지' : '지금'} value={countdown ?? '진행 중'} big={!!countdown} divider />
            <Field label="DATE" value={`${today.getMonth() + 1}.${pad(today.getDate())}`} divider narrow />
          </View>
          <View style={styles.main}>
            <HeroChar pose={POSES[stage]} />
            <View style={styles.live}>
              <LiveDot />
              <PText style={styles.liveText}>ACTION!</PText>
            </View>
            <SwapTitle text={STAGE_LINES[stage]} />
            <Pressable onPress={onCheckIn} accessibilityRole="button" accessibilityLabel="출석체크 하기" style={styles.btnWrap}>
              {({ pressed }) => (
                <View style={StyleSheet.flatten([styles.btn, pressed && styles.btnPressed])}>
                  <Shine />
                  <View style={styles.qr}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={Colors.white} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M8 12h8" />
                    </Svg>
                  </View>
                  <PText style={styles.btnText}>출석체크 하기</PText>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={Colors.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M5 12h14M13 6l6 6-6 6" />
                  </Svg>
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </View>
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
function LiveDot() {
  const still = useReducedMotion();
  return (
    <View>
      {!still && (
        <Animated.View
          style={[styles.liveRing, { opacity: 0, animationName: liveRing, animationDuration: '1.4s', animationIterationCount: 'infinite', animationTimingFunction: 'ease-out' }]}
        />
      )}
      <View style={styles.liveDot} />
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
  btnWrap: { marginTop: 14, alignSelf: 'flex-start' },
  btn: { height: 52, paddingLeft: 6, paddingRight: 18, borderRadius: 28, borderWidth: 2.5, borderColor: Colors.ink, backgroundColor: Colors.cream, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 6 },
  btnPressed: { transform: [{ translateY: 4 }], borderBottomWidth: 2.5 },
  qr: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.purple, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontFamily: Font.body900, fontSize: 16, lineHeight: 22 },
});
