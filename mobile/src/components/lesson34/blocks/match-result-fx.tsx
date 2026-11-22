import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { css, cubicBezier, useReducedMotion, type CSSKeyframesRule } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Colors } from '@/constants/theme';

import { IMG } from '../ui';

/*
 * 짝 맞추기 결과 화면 꾸밈.
 * - HopStage: 무대 위를 캐릭터가 발판 사이로 통통 뛰어다녀요 (웅크렸다 · 길쭉하게 · 착지 납작). 끝에서 홱 돌아서요.
 *   다 맞히면 노란 캐릭터 + 색종이 · 반짝이, 못 다 맞히면 기운 캐릭터가 느릿느릿 + 먼지만 둥둥.
 * - PopStars: 별이 하나씩 말랑하게 튀어나와요.
 * - useCountUp: 숫자가 0부터 올라가요.
 * 움직임은 모두 CSS 애니메이션 (웹 · 폰 모두 화면 스레드가 그려요). 움직임 줄이기면 멈춘 그림만.
 */

const ioe = 'ease-in-out' as const;
const POP = cubicBezier(0.2, 0.8, 0.3, 1);
const RISE = cubicBezier(0.15, 0.7, 0.35, 1);
const FALL = cubicBezier(0.6, 0, 0.9, 0.5);
const SPRING = cubicBezier(0.3, 1.5, 0.5, 1);

/* ───────── 무대 위 캐릭터 길 ───────── */

type Ease = typeof ioe | 'ease-out' | 'linear' | ReturnType<typeof cubicBezier>;
type Pose = { x: number; y: number; sx: number; sy: number; face: 1 | -1 };
type Frame = Pose & { t: number; ease: Ease };
/** 길 한 토막: 제자리 숨쉬기 · 뛰기(to · 높이) · 돌아서기 */
type Step = { k: 'idle'; ms: number } | { k: 'hop'; ms: number; to: number; amp: number } | { k: 'turn'; ms: number };

/** 길(토막 목록)을 시간 순 자세 목록으로 */
function walk(steps: Step[]) {
  const out: Frame[] = [];
  let at: Pose = { x: 0, y: 0, sx: 1, sy: 1, face: 1 };
  let t = 0;
  const put = (dt: number, p: Partial<Pose>, ease: Ease) => {
    at = { ...at, ...p };
    out.push({ ...at, t: t + dt, ease });
  };
  out.push({ ...at, t: 0, ease: ioe });
  for (const s of steps) {
    const { ms } = s;
    if (s.k === 'idle') {
      put(ms * 0.5, { sx: 1.05, sy: 0.95 }, ioe);
      put(ms, { sx: 1, sy: 1 }, ioe);
    } else if (s.k === 'turn') {
      // 작게 뛰면서 좌우 반전 (가운데에서 납작해졌다 반대쪽을 봐요)
      const face = at.face === 1 ? -1 : 1;
      put(ms * 0.3, { y: 2, sx: 1.12, sy: 0.88 }, POP);
      put(ms * 0.65, { y: -10, sx: 1, sy: 1.06, face }, FALL);
      put(ms, { y: 0, sx: 1, sy: 1 }, 'ease-out');
    } else {
      const x0 = at.x;
      const mid = (x0 + s.to) / 2;
      // 웅크림 → 길쭉하게 솟음 → 꼭대기 → 착지 납작 → 제자리
      put(ms * 0.16, { y: 3, sx: 1.18, sy: 0.82 }, POP);
      put(ms * 0.24, { x: x0 + (s.to - x0) * 0.12, y: -s.amp * 0.4, sx: 0.86, sy: 1.18 }, RISE);
      put(ms * 0.5, { x: mid, y: -s.amp, sx: 0.96, sy: 1.05 }, FALL);
      put(ms * 0.78, { x: s.to, y: 0, sx: 0.92, sy: 1.1 }, 'ease-out');
      put(ms * 0.86, { y: 2, sx: 1.22, sy: 0.78 }, SPRING);
      put(ms, { y: 0, sx: 1, sy: 1 }, 'ease-out');
    }
    t += ms;
  }
  return out;
}

/** 자세 목록 → 캐릭터 · 바닥 그림자 키프레임 */
function route(steps: Step[], maxAmp: number) {
  const frames = walk(steps);
  const total = frames[frames.length - 1].t;
  const body: Record<string, object> = {};
  const shade: Record<string, object> = {};
  for (const f of frames) {
    const key = `${Math.round((f.t / total) * 10000) / 100}%`;
    body[key] = { transform: [{ translateX: f.x }, { translateY: f.y }, { scaleX: f.face * f.sx }, { scaleY: f.sy }], animationTimingFunction: f.ease };
    const up = Math.min(1, Math.max(0, -f.y / maxAmp));
    const sc = 1 - up * 0.55;
    shade[key] = { transform: [{ translateX: f.x }, { scaleX: sc * (f.sx > 1.1 ? 1.15 : 1) }, { scaleY: sc }], opacity: 1 - up * 0.6, animationTimingFunction: f.ease };
  }
  return { body: css.keyframes(body), shade: css.keyframes(shade), ms: total };
}

/** 발판 자리 (가운데 기준) */
const PAD = 92;
/** 신나게: 제자리 통 → 오른쪽 발판 → 통통 → 돌아서 가운데 → 왼쪽 → 통 → 돌아서 가운데 (6초) */
const HAPPY = route(
  [
    { k: 'idle', ms: 600 },
    { k: 'hop', ms: 450, to: 0, amp: 16 },
    { k: 'hop', ms: 750, to: PAD, amp: 46 },
    { k: 'hop', ms: 450, to: PAD, amp: 18 },
    { k: 'hop', ms: 450, to: PAD, amp: 14 },
    { k: 'turn', ms: 320 },
    { k: 'hop', ms: 750, to: 0, amp: 46 },
    { k: 'hop', ms: 750, to: -PAD, amp: 46 },
    { k: 'hop', ms: 450, to: -PAD, amp: 16 },
    { k: 'turn', ms: 320 },
    { k: 'hop', ms: 750, to: 0, amp: 46 },
    { k: 'idle', ms: 400 },
  ],
  46,
);
/** 아쉽게: 느릿느릿 작게 · 오래 쉬어요 */
const SAD_PAD = 60;
const SAD = route(
  [
    { k: 'idle', ms: 1300 },
    { k: 'hop', ms: 900, to: SAD_PAD, amp: 12 },
    { k: 'idle', ms: 1000 },
    { k: 'turn', ms: 450 },
    { k: 'hop', ms: 900, to: 0, amp: 12 },
    { k: 'hop', ms: 900, to: -SAD_PAD, amp: 12 },
    { k: 'idle', ms: 1000 },
    { k: 'turn', ms: 450 },
    { k: 'hop', ms: 900, to: 0, amp: 12 },
  ],
  12,
);

/** 반복 애니메이션 한 벌 */
const loop = (name: CSSKeyframesRule, ms: number, delay = 0, timing: 'linear' | 'ease-in-out' | 'ease-out' = 'linear') => ({
  animationName: name,
  animationDuration: `${ms}ms`,
  animationDelay: `${delay}ms`,
  animationIterationCount: 'infinite' as const,
  animationTimingFunction: timing,
  animationFillMode: 'backwards' as const,
});

/* ───────── 색종이 · 반짝이 · 먼지 ───────── */

const STAGE_H = 196;
const fallL = css.keyframes({
  '0%': { transform: [{ translateY: -24 }, { translateX: 0 }, { rotate: '0deg' }], opacity: 0 },
  '8%': { opacity: 1 },
  '50%': { transform: [{ translateY: STAGE_H * 0.45 }, { translateX: -14 }, { rotate: '200deg' }] },
  '85%': { opacity: 1 },
  '100%': { transform: [{ translateY: STAGE_H - 30 }, { translateX: 6 }, { rotate: '400deg' }], opacity: 0 },
});
const fallR = css.keyframes({
  '0%': { transform: [{ translateY: -24 }, { translateX: 0 }, { rotate: '0deg' }], opacity: 0 },
  '8%': { opacity: 1 },
  '50%': { transform: [{ translateY: STAGE_H * 0.45 }, { translateX: 14 }, { rotate: '-180deg' }] },
  '85%': { opacity: 1 },
  '100%': { transform: [{ translateY: STAGE_H - 30 }, { translateX: -6 }, { rotate: '-380deg' }], opacity: 0 },
});
const twinkle = css.keyframes({
  '0%, 60%, 100%': { transform: [{ scale: 0 }, { rotate: '0deg' }], opacity: 0 },
  '20%': { transform: [{ scale: 1.15 }, { rotate: '45deg' }], opacity: 1 },
  '40%': { transform: [{ scale: 0.6 }, { rotate: '90deg' }], opacity: 0.6 },
});
const drift = css.keyframes({
  '0%': { transform: [{ translateY: 0 }, { translateX: 0 }], opacity: 0 },
  '20%': { opacity: 0.55 },
  '100%': { transform: [{ translateY: -90 }, { translateX: 10 }], opacity: 0 },
});

const BITS: { l: number; d: number; ms: number; c: string; w: number; h: number; r?: boolean }[] = [
  { l: 6, d: 0, ms: 3600, c: Colors.yellow, w: 8, h: 12 },
  { l: 15, d: 1400, ms: 4200, c: '#F59AB0', w: 7, h: 7, r: true },
  { l: 24, d: 600, ms: 3900, c: Colors.sky, w: 6, h: 11 },
  { l: 33, d: 2200, ms: 4400, c: '#7FD49B', w: 8, h: 8 },
  { l: 43, d: 300, ms: 3700, c: '#F59AB0', w: 6, h: 12 },
  { l: 52, d: 1800, ms: 4100, c: Colors.yellow, w: 7, h: 7, r: true },
  { l: 61, d: 900, ms: 3800, c: '#7FD49B', w: 6, h: 11 },
  { l: 70, d: 2600, ms: 4300, c: Colors.sky, w: 8, h: 8, r: true },
  { l: 79, d: 200, ms: 4000, c: Colors.yellow, w: 6, h: 12 },
  { l: 88, d: 1600, ms: 3600, c: '#F59AB0', w: 8, h: 8 },
  { l: 94, d: 1000, ms: 4500, c: Colors.sky, w: 6, h: 10 },
];
const SPARKS = [
  { l: '12%', t: 34, d: 400, s: 18 },
  { l: '82%', t: 26, d: 1300, s: 22 },
  { l: '30%', t: 70, d: 2100, s: 14 },
  { l: '68%', t: 80, d: 700, s: 14 },
] as const;
const DUST = [
  { l: '20%', d: 0, s: 8 },
  { l: '44%', d: 1700, s: 6 },
  { l: '63%', d: 900, s: 9 },
  { l: '82%', d: 2600, s: 7 },
] as const;

const Spark = ({ s }: { s: number }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24">
    <Path d="M12 1.5c.9 5.6 4.9 9.6 10.5 10.5c-5.6.9-9.6 4.9-10.5 10.5c-.9-5.6-4.9-9.6-10.5-10.5C7.1 11.1 11.1 7.1 12 1.5z" fill={Colors.yellow} stroke={Colors.ink} strokeWidth={1.8} strokeLinejoin="round" />
  </Svg>
);

/* ───────── 무대 ───────── */

const CHAR_W = 100;
const CHAR_H = (112 * CHAR_W) / 130;
const FLOOR_H = 42;

/** 캐릭터가 뛰어다니는 무대. good: 다 맞힘 (노랑 · 색종이) / 아니면 기운 캐릭터 · 느릿느릿 */
export function HopStage({ good }: { good: boolean }) {
  const still = useReducedMotion();
  const R = good ? HAPPY : SAD;
  const pad = good ? PAD : SAD_PAD;
  // 한 바퀴(가운데로 돌아와 쉬는 순간)마다 40% 확률로 길을 좌우로 뒤집어요 → 다음엔 왼쪽부터
  const [mirror, setMirror] = useState(false);
  const chance = useCallback(() => {
    if (Math.random() < 0.4) setMirror((m) => !m);
  }, []);
  return (
    <View style={[styles.stage, good ? styles.stageGood : styles.stageSad]} pointerEvents="none" accessible={false}>
      {/* 무대 뒤 꾸밈 */}
      {!still &&
        good &&
        SPARKS.map((p, i) => (
          <Animated.View key={`s${i}`} style={[styles.abs, { left: p.l, top: p.t }, loop(twinkle, 2600, p.d, ioe)]}>
            <Spark s={p.s} />
          </Animated.View>
        ))}
      {!still &&
        good &&
        BITS.map((b, i) => (
          <Animated.View
            key={`b${i}`}
            style={[styles.bit, { left: `${b.l}%`, width: b.w, height: b.h, borderRadius: b.r ? b.w / 2 : 2, backgroundColor: b.c }, loop(i % 2 ? fallL : fallR, b.ms, b.d)]}
          />
        ))}
      {!still &&
        !good &&
        DUST.map((p, i) => <Animated.View key={`d${i}`} style={[styles.dust, { left: p.l, width: p.s, height: p.s, borderRadius: p.s / 2 }, loop(drift, 3600, p.d, 'ease-out')]} />)}

      {/* 바닥 · 발판 */}
      <View style={[styles.floor, good ? styles.floorGood : styles.floorSad]} />
      {[-pad, 0, pad].map((x) => (
        <View key={x} style={[styles.pad, { transform: [{ translateX: x }] }, good ? styles.padGood : styles.padSad]} />
      ))}

      {/* 캐릭터 + 그림자 (길 뒤집기는 .38초 동안 부드럽게) */}
      <Animated.View style={[styles.actor, { transform: [{ scaleX: mirror ? -1 : 1 }] }, flipEase]}>
        <Animated.View style={[styles.shade, !still && loop(R.shade, R.ms)]} />
        <Animated.View style={[styles.char, !still && loop(R.body, R.ms)]} onCSSAnimationIteration={chance}>
          <Image source={good ? IMG.yellow : IMG.tilted} style={styles.img} contentFit="contain" />
        </Animated.View>
      </Animated.View>
    </View>
  );
}
const flipEase = css.create({ t: { transitionProperty: 'transform', transitionDuration: '380ms', transitionTimingFunction: cubicBezier(0.4, 0, 0.2, 1) } }).t;

/* ───────── 별 ───────── */

const starPop = css.keyframes({
  '0%': { transform: [{ scale: 0 }, { rotate: '-40deg' }], opacity: 0, animationTimingFunction: POP },
  '55%': { transform: [{ scale: 1.35 }, { rotate: '12deg' }], opacity: 1, animationTimingFunction: ioe },
  '75%': { transform: [{ scale: 0.9 }, { rotate: '-4deg' }], animationTimingFunction: ioe },
  '100%': { transform: [{ scale: 1 }, { rotate: '0deg' }], opacity: 1 },
});
const starDim = css.keyframes({
  '0%': { transform: [{ scale: 0.4 }], opacity: 0, animationTimingFunction: POP },
  '100%': { transform: [{ scale: 1 }], opacity: 1 },
});
/** 받은 별은 가끔 반짝 (살짝 커졌다 돌아와요) */
const starGlint = css.keyframes({
  '0%, 82%, 100%': { transform: [{ scale: 1 }, { rotate: '0deg' }] },
  '88%': { transform: [{ scale: 1.14 }, { rotate: '-8deg' }] },
  '94%': { transform: [{ scale: 0.97 }, { rotate: '3deg' }] },
});
const STAR = 'M12 2.6l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17.2l-5.9 3.2 1.3-6.5L2.5 9.4l6.6-.8z';

/** 별 3개가 하나씩 튀어나와요 (가운데 별은 조금 크고 위로) */
export function PopStars({ n, delay = 0 }: { n: number; delay?: number }) {
  const still = useReducedMotion();
  return (
    <View style={styles.stars} accessibilityLabel={`별 ${n}개`}>
      {[0, 1, 2].map((i) => {
        const on = i < n;
        const size = i === 1 ? 44 : 36;
        const at = delay + i * 220;
        const enter = still
          ? null
          : { animationName: on ? starPop : starDim, animationDuration: on ? '620ms' : '320ms', animationDelay: `${at}ms`, animationFillMode: 'backwards' as const, animationTimingFunction: 'linear' as const };
        return (
          <Animated.View key={i} style={[i === 1 && styles.starMid, enter]}>
            <Animated.View style={!still && on ? loop(starGlint, 3200, at + 900 + i * 400) : null}>
              <Svg width={size} height={size} viewBox="0 0 24 24">
                <Path d={STAR} fill={on ? Colors.yellow : '#E3DCCB'} stroke={Colors.ink} strokeWidth={1.4} strokeLinejoin="round" />
              </Svg>
            </Animated.View>
          </Animated.View>
        );
      })}
    </View>
  );
}

/* ───────── 숫자 올라가기 ───────── */

/** 0 → to 로 delay 뒤 ms 동안 올라가요 (움직임 줄이기면 바로 끝 값) */
export function useCountUp(to: number, delay = 0, ms = 700) {
  const still = useReducedMotion();
  const [v, setV] = useState(0);
  useEffect(() => {
    if (still || to <= 0) return;
    let raf = 0;
    let t0 = 0;
    const tick = (now: number) => {
      if (!t0) t0 = now;
      const p = Math.min(1, (now - t0) / ms);
      setV(Math.round(to * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    const start = setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(start);
      cancelAnimationFrame(raf);
    };
  }, [to, delay, ms, still]);
  return still || to <= 0 ? to : v;
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  stage: { width: '100%', height: STAGE_H, borderRadius: 24, borderWidth: 2, borderColor: Colors.ink, overflow: 'hidden', boxShadow: `0px 4px 0px ${Colors.ink}` },
  stageGood: { backgroundColor: Colors.skyMist },
  stageSad: { backgroundColor: '#EEEAF3' },
  floor: { position: 'absolute', left: 0, right: 0, bottom: 0, height: FLOOR_H, borderTopWidth: 2, borderColor: Colors.ink },
  floorGood: { backgroundColor: '#FFEE8A' },
  floorSad: { backgroundColor: '#DCD6E6' },
  pad: { position: 'absolute', left: '50%', marginLeft: -34, bottom: FLOOR_H - 9, width: 68, height: 18, borderRadius: 9, borderWidth: 2, borderColor: Colors.ink },
  padGood: { backgroundColor: Colors.white },
  padSad: { backgroundColor: '#F6F3FA' },
  actor: { position: 'absolute', left: '50%', marginLeft: -CHAR_W / 2, bottom: FLOOR_H + 2, width: CHAR_W, height: CHAR_H },
  char: { width: CHAR_W, height: CHAR_H, transformOrigin: 'center bottom' },
  img: { width: CHAR_W, height: CHAR_H },
  shade: { position: 'absolute', left: CHAR_W / 2 - 26, bottom: -7, width: 52, height: 10, borderRadius: 26, backgroundColor: 'rgba(30, 26, 43, 0.22)' },
  bit: { position: 'absolute', top: 0, borderWidth: 1.5, borderColor: Colors.ink },
  dust: { position: 'absolute', bottom: FLOOR_H + 6, backgroundColor: '#B9B0CC' },
  stars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 6 },
  starMid: { marginBottom: 6 },
});
