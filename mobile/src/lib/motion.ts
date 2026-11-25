import { useIsFocused } from 'expo-router';
import { useEffect } from 'react';
import { cancelAnimation, Easing, interpolate, useReducedMotion, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';

/*
 * 움직임 공통 (프로토타입 :root 의 --ease · --spring 과 @keyframes 를 옮긴 것).
 * 움직임 줄이기를 켠 사람에게는 반복 움직임을 멈춰요.
 */

/**
 * 반복 움직임을 멈출 때: 움직임 줄이기를 켰거나 · 이 화면이 지금 안 보여요 (다른 탭 · 위에 다른 화면).
 * 숨은 홈의 눈송이 · 반짝이가 계속 돌면 화면 스레드를 써서 라이브러리 3D 가 버벅였어요.
 * 화면(navigator 안)에서만 써요.
 */
export function useStill() {
  const reduced = useReducedMotion();
  const focused = useIsFocused();
  return reduced || !focused;
}

/** --ease: cubic-bezier(.16,1,.3,1) — 빠르게 시작해 부드럽게 멈춤 */
export const EASE = Easing.bezier(0.16, 1, 0.3, 1);
/** --spring: cubic-bezier(.2,.9,.3,1.3) — 살짝 넘쳤다 돌아옴 */
export const SPRING = Easing.bezier(0.2, 0.9, 0.3, 1.3);

/**
 * 반복 시계: 0 → 1 을 ms 동안 계속 되풀이해요 (CSS animation: … infinite).
 * 화면에서 interpolate 로 @keyframes 의 % 를 그대로 옮겨 써요.
 */
export function useLoop(ms: number, { delay = 0, enabled = true }: { delay?: number; enabled?: boolean } = {}) {
  const still = useStill();
  const t = useSharedValue(0);
  useEffect(() => {
    if (!enabled || still) {
      cancelAnimation(t);
      t.set(0);
      return;
    }
    t.set(withDelay(delay, withRepeat(withTiming(1, { duration: ms, easing: Easing.linear }), -1, false)));
    return () => cancelAnimation(t);
  }, [ms, delay, enabled, still, t]);
  return t;
}

/** @keyframes 한 줄: 시계 t(0~1) 에서 stops(%) 사이 값을 이어요 */
export function kf(t: number, stops: number[], values: number[]) {
  'worklet';
  return interpolate(t * 100, stops, values, 'clamp');
}

/**
 * @keyframes 에서 구간마다 animation-timing-function 이 다를 때: eases[i] 가 stops[i] → stops[i+1] 구간의 속도 곡선.
 */
export function kfe(t: number, stops: number[], values: number[], eases: ((x: number) => number)[]) {
  'worklet';
  const x = Math.min(Math.max(t * 100, stops[0]), stops[stops.length - 1]);
  for (let i = 0; i < stops.length - 1; i++) {
    if (x <= stops[i + 1]) {
      const span = stops[i + 1] - stops[i];
      const f = span === 0 ? 1 : (x - stops[i]) / span;
      const e = eases[i] ? eases[i](f) : f;
      return values[i] + (values[i + 1] - values[i]) * e;
    }
  }
  return values[values.length - 1];
}

/**
 * CSS 처럼 animation-timing-function 하나를 키프레임 구간마다 따로 적용해요.
 * 시계 t 는 선형(Easing.linear)으로 돌려야 해요 — 곡선을 시계 전체에 걸면 정점 시점이 어긋나고 넘침이 사라져요.
 */
export function kfc(t: number, stops: number[], values: number[], ease: (x: number) => number) {
  'worklet';
  const x = Math.min(Math.max(t * 100, stops[0]), stops[stops.length - 1]);
  for (let i = 0; i < stops.length - 1; i++) {
    if (x <= stops[i + 1]) {
      const span = stops[i + 1] - stops[i];
      const f = span === 0 ? 1 : (x - stops[i]) / span;
      return values[i] + (values[i + 1] - values[i]) * ease(f);
    }
  }
  return values[values.length - 1];
}

/*
 * 나타나는 움직임들 (@keyframes 를 0~1 진행값으로 옮긴 것). <Appear kind="…"> 로 써요.
 * Reanimated 의 entering(Keyframe)은 웹에서 끝난 뒤 자리가 틀어지는 문제가 있어서, 공유 값으로 직접 돌려요.
 */
type Frame = { opacity?: number; translateY?: number; scale?: number; scaleX?: number; scaleY?: number };
type Kind = { duration: number; easing: (x: number) => number; stops: number[]; frames: Frame[]; origin?: 'bottom' };

const SPRING_FN = Easing.bezierFn(0.2, 0.9, 0.3, 1.3);
const EASE_FN = Easing.bezierFn(0.16, 1, 0.3, 1);
const HOP_FN = Easing.bezierFn(0.3, 1.5, 0.5, 1);
const WORD_FN = Easing.bezierFn(0.3, 1.6, 0.5, 1);

export const APPEAR = {
  /** .rise — 아래에서 살짝 올라오며 (홈 각 칸 · 0.6초) */
  rise: {
    duration: 600,
    easing: SPRING_FN,
    stops: [0, 100],
    frames: [
      { opacity: 0, translateY: 14, scale: 0.97 },
      { opacity: 1, translateY: 0, scale: 1 },
    ],
  },
  /** shIn — 섞인 단어 카드가 처음 나타날 때 (0.3초) */
  popIn: {
    duration: 300,
    easing: SPRING_FN,
    stops: [0, 100],
    frames: [
      { opacity: 0, scale: 0.85 },
      { opacity: 1, scale: 1 },
    ],
  },
  /** shUp — 카드가 줄로 올라가 이어질 때 (0.35초) */
  linkUp: {
    duration: 350,
    easing: SPRING_FN,
    stops: [0, 100],
    frames: [
      { opacity: 0, translateY: 26, scale: 0.9 },
      { opacity: 1, translateY: 0, scale: 1 },
    ],
  },
  /** tkRise — 완성 문장 카드 (0.4초) */
  tkRise: {
    duration: 400,
    easing: EASE_FN,
    stops: [0, 100],
    frames: [
      { opacity: 0, translateY: 18, scale: 0.94 },
      { opacity: 1, translateY: 0, scale: 1 },
    ],
  },
  /** reactHop — 반응 캐릭터가 아래에서 통 (0.7초) */
  reactHop: {
    duration: 700,
    easing: HOP_FN,
    origin: 'bottom',
    stops: [0, 45, 70, 100],
    frames: [
      { translateY: 14, scaleX: 0.6, scaleY: 0.6 },
      { translateY: -12, scaleX: 1.06, scaleY: 0.95 },
      { translateY: 0, scaleX: 0.97, scaleY: 1.04 },
      { translateY: 0, scaleX: 1, scaleY: 1 },
    ],
  },
  /** reactWord — 반응 글자가 톡 커지며 (0.5초) */
  reactWord: {
    duration: 500,
    easing: WORD_FN,
    stops: [0, 100],
    frames: [
      { opacity: 0, scale: 0.4 },
      { opacity: 1, scale: 1 },
    ],
  },
} satisfies Record<string, Kind>;

export type AppearKind = keyof typeof APPEAR;

/** 진행값 p(0~1)에서 한 동작의 모양 */
export function appearStyle(kind: Kind, p: number) {
  'worklet';
  // CSS 처럼 곡선(easing)은 구간마다 따로 적용해요
  const eases = kind.stops.slice(1).map(() => kind.easing);
  const pick = (key: keyof Frame, base: number) =>
    kfe(
      p,
      kind.stops,
      kind.frames.map((f) => f[key] ?? base),
      eases,
    );
  const sx = pick('scaleX', 1) * pick('scale', 1);
  const sy = pick('scaleY', 1) * pick('scale', 1);
  return {
    opacity: pick('opacity', 1),
    transform: [{ translateY: pick('translateY', 0) }, { scaleX: sx }, { scaleY: sy }],
  };
}
