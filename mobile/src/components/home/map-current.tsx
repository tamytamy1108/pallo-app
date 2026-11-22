import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { css, cubicBezier, useReducedMotion, type CSSKeyframesRule } from 'react-native-reanimated';
import Svg, { ClipPath, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

/*
 * 지금 할 정류장 꾸밈 (프로토타입 .cur-fx · .node.current · #qmapInner .ride).
 * 모두 정류장 가운데(0, 0)를 기준으로 놓여요.
 *
 * 움직임은 프로토타입 @keyframes 를 그대로 옮긴 'CSS 애니메이션'으로 돌려요.
 * 웹에서는 브라우저가, 폰에서는 화면 담당 스레드가 직접 그려서 자바스크립트가 바빠도 끊기지 않아요.
 */

const ioe = 'ease-in-out' as const;
const POP = cubicBezier(0.2, 0.8, 0.3, 1);
const RISE = cubicBezier(0.15, 0.7, 0.35, 1);
const FALL = cubicBezier(0.6, 0, 0.9, 0.5);
const HOP = cubicBezier(0.3, 1.4, 0.5, 1);

const T = (y: number, r: number, sx: number, sy: number) => [{ translateY: y }, { rotate: `${r}deg` }, { scaleX: sx }, { scaleY: sy }];

/** rideJump 1.4초: 움찔 웅크렸다 → 길쭉하게 뛰어 → 꼭대기에서 잠깐 떠서 기울고 → 착지하며 납작 → 작게 한 번 더 통 */
const rideJump = css.keyframes({
  '0%, 12%': { transform: T(0, 0, 1, 1), animationTimingFunction: ioe },
  '20%': { transform: T(5, 0, 1.18, 0.8), animationTimingFunction: POP },
  '27%': { transform: T(-24, -3, 0.84, 1.2), animationTimingFunction: RISE },
  '48%': { transform: T(-72, -7, 1, 1), animationTimingFunction: ioe },
  '56%': { transform: T(-70, 5, 1, 1), animationTimingFunction: FALL },
  '74%': { transform: T(0, 0, 0.9, 1.12), animationTimingFunction: 'ease-out' },
  '78%': { transform: T(4, 0, 1.26, 0.74), animationTimingFunction: POP },
  '86%': { transform: T(-14, 0, 0.94, 1.07), animationTimingFunction: FALL },
  '92%': { transform: T(0, 0, 1.08, 0.93), animationTimingFunction: 'ease-out' },
  '100%': { transform: T(0, 0, 1, 1) },
});

const S = (sx: number, sy: number) => [{ scaleX: sx }, { scaleY: sy }];
/** rideSh: 뛰어오르면 바닥 그림자가 작고 옅어져요 */
const rideSh = css.keyframes({
  '0%, 12%': { transform: S(1, 1), opacity: 1, animationTimingFunction: ioe },
  '20%': { transform: S(1.2, 1.1), opacity: 1 },
  '27%': { transform: S(0.8, 0.8), opacity: 0.7, animationTimingFunction: RISE },
  '48%, 56%': { transform: S(0.42, 0.42), opacity: 0.3, animationTimingFunction: FALL },
  '74%': { transform: S(1, 1), opacity: 0.9 },
  '78%': { transform: S(1.3, 1.15), opacity: 1 },
  '86%': { transform: S(0.8, 0.8), opacity: 0.75, animationTimingFunction: FALL },
  '92%, 100%': { transform: S(1, 1), opacity: 1 },
});

/** nodeHop: 정류장이 말랑하게 통통 */
const nodeHop = css.keyframes({
  '0%, 100%': { transform: [{ translateY: 0 }, { scaleX: 1 }, { scaleY: 1 }], animationTimingFunction: HOP },
  '15%': { transform: [{ translateY: 0 }, { scaleX: 1.1 }, { scaleY: 0.9 }], animationTimingFunction: HOP },
  '45%': { transform: [{ translateY: -10 }, { scaleX: 0.95 }, { scaleY: 1.06 }], animationTimingFunction: HOP },
  '70%': { transform: [{ translateY: 0 }, { scaleX: 1.06 }, { scaleY: 0.95 }], animationTimingFunction: HOP },
});

/** spotGlow: 스포트라이트가 숨 쉬듯 */
const spotGlow = css.keyframes({
  '0%, 100%': { transform: [{ scale: 0.9 }], opacity: 0.75 },
  '50%': { transform: [{ scale: 1.08 }], opacity: 1 },
});

/** raysSpin: 빛살이 천천히 한 바퀴 */
const raysSpin = css.keyframes({ from: { transform: [{ rotate: '0deg' }] }, to: { transform: [{ rotate: '360deg' }] } });

/** floorShrink: 정류장이 뜨면 바닥 그림자가 작아져요 */
const floorShrink = css.keyframes({
  '0%, 100%': { transform: [{ scale: 1 }], opacity: 1, animationTimingFunction: HOP },
  '45%': { transform: [{ scale: 0.7 }], opacity: 0.6, animationTimingFunction: HOP },
});

/** 반복 애니메이션 한 벌 (움직임 줄이기면 멈춰요) */
function loop(name: CSSKeyframesRule, duration: string, timing: 'linear' | 'ease' | 'ease-in-out' = 'linear', still = false, delay = '0ms') {
  if (still) return {};
  return { animationName: name, animationDuration: duration, animationDelay: delay, animationIterationCount: 'infinite' as const, animationTimingFunction: timing };
}

/*
 * 한 박자(1.4초) 맞추기: 정류장 통통 · 바닥 그림자 · 캐릭터 점프 · 캐릭터 그림자가 늘 같은 순간에 시작해요.
 * (프로토타입은 한 번에 그려져서 저절로 맞아요. 앱은 따로 그려지니 시계 기준으로 맞춰요)
 * 정류장이 눌렸다(15%) 튀어 오르는 반동에 맞춰 캐릭터가 웅크렸다(20%) 뛰어올라요(27%).
 */
const BEAT = 1400;
const onBeat = (lead = 0) => `-${(Date.now() + lead) % BEAT}ms`;
/** 재 보니 캐릭터가 정류장보다 40ms 늦게 웅크려서, 프로토타입처럼 정류장이 튀어 오르는 순간 웅크리게 40ms 앞당겨요 */
const RIDER_LEAD = 40;

/** 정류장 뒤: 노란 스포트라이트(숨 쉬듯) · 천천히 도는 빛살 · 바닥 그림자 */
export function CurrentFx() {
  const still = useReducedMotion();
  const [beat] = useState(() => onBeat());
  // repeating-conic-gradient: 30도마다 12도 폭 빛살. CSS 의 radial-gradient(circle …) 는 반지름이 상자 '모서리'까지라 66√2 ≈ 93px
  const R = 66 * Math.SQRT2;
  const wedges = Array.from({ length: 12 }, (_, i) => {
    const a0 = ((i * 30 - 90) * Math.PI) / 180;
    const a1 = ((i * 30 + 12 - 90) * Math.PI) / 180;
    return `M66 66 L${66 + R * Math.cos(a0)} ${66 + R * Math.sin(a0)} A${R} ${R} 0 0 1 ${66 + R * Math.cos(a1)} ${66 + R * Math.sin(a1)} Z`;
  });
  return (
    <View style={styles.origin} pointerEvents="none">
      <Animated.View style={[styles.spot, loop(spotGlow, '2s', 'ease-in-out', still)]}>
        <Svg width={120} height={120}>
          {/* radial-gradient(circle, …) 는 상자 모서리까지가 100% → 반지름 60√2 */}
          <Defs>
            <RadialGradient id="curSpot" cx={60} cy={60} r={60 * Math.SQRT2} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#FFF7C4" />
              <Stop offset="0.45" stopColor="#FFFAE0" />
              <Stop offset="0.7" stopColor="#FFF8D0" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width={120} height={120} rx={60} fill="url(#curSpot)" />
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.rays, loop(raysSpin, '14s', 'linear', still)]}>
        <Svg width={132} height={132}>
          {/* 빛살 색(노랑 .28)에 가운데 · 바깥이 비는 둥근 가림막을 곱한 값 */}
          <Defs>
            <RadialGradient id="raysFill" cx={66} cy={66} r={R} gradientUnits="userSpaceOnUse">
              <Stop offset="0.28" stopColor="#FFE200" stopOpacity={0} />
              <Stop offset="0.38" stopColor="#FFE200" stopOpacity={0.28} />
              <Stop offset="0.55" stopColor="#FFE200" stopOpacity={0.168} />
              <Stop offset="0.7" stopColor="#FFE200" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          {wedges.map((d, i) => (
            <Path key={i} d={d} fill="url(#raysFill)" />
          ))}
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.floor, loop(floorShrink, '1.4s', 'linear', still, beat)]} />
    </View>
  );
}

/** 지금 정류장은 말랑하게 통통 (nodeHop 1.4초 · 아래를 기준으로) */
export function NodeHop({ on, style, children }: { on: boolean; style: ViewStyle; children: ReactNode }) {
  const still = useReducedMotion();
  // 눌렀다 떼면 다시 시작하니, 그때마다 박자를 새로 맞춰요
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const beat = useMemo(() => onBeat(), [on]);
  return <Animated.View style={[style, styles.bottomOrigin, loop(nodeHop, '1.4s', 'linear', still || !on, beat)]}>{children}</Animated.View>;
}

/*
 * 맵 위에서 뛰는 '내 캐릭터' (프로토타입 rideHTML · .ride.me.tall).
 * 마이 꾸미기를 만들기 전이라, 프로토타입 기본 캐릭터(노랑 · 비니 · 나비넥타이 · 깃발 · 보라 신발)를 그린 이미지를 써요.
 * 이미지는 캐릭터 몸(520×332)보다 모자 · 깃발만큼 커요 → 몸 기준으로 자리를 맞춰요.
 */
const BODY_W = 58; // .ride.me.tall: 모자처럼 위로 솟는 아이템이면 58px
const K = BODY_W / 520;
const BODY_H = 332 * K;
const IMG = { w: 543.4 * K, h: 448.2 * K, top: -116.2 * K };

/** 정류장 앞의 내 캐릭터: 통통 뛰어올라요 + 바닥 그림자 (rideJump · rideSh 1.4초) · 가끔 공중에서 좌우로 홱 */
export function Rider() {
  const still = useReducedMotion();
  const [beat] = useState(() => onBeat(RIDER_LEAD));
  const [flip, setFlip] = useState(false);
  // 프로토타입과 똑같이: 점프 한 번이 끝날 때마다(animationiteration) 35% 확률로,
  // 다음 점프의 0.42초(1.4초 × 0.3 · 막 뛰어올라 공중에 있을 때) 뒤에 좌우를 홱 바꿔요
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  const chance = () => {
    if (Math.random() < 0.35) timer.current = setTimeout(() => setFlip((f) => !f), 1400 * 0.3);
  };
  // 프로토타입에선 캐릭터 눈꺼풀 두 개의 깜빡임(3초)도 같은 이벤트로 올라와서, 깜빡일 때마다 눈마다 한 번씩 더 기회가 있어요
  const onBlink = () => {
    chance();
    chance();
  };
  return (
    <View style={styles.origin} pointerEvents="none">
      <Animated.View style={[styles.rideSh, loop(rideSh, '1.4s', 'ease', still, beat)]} />
      <Animated.View style={[styles.ride, { transform: [{ scaleX: flip ? -1 : 1 }] }, flipEase]}>
        <Animated.View style={[styles.body, styles.bottomOrigin, loop(rideJump, '1.4s', 'ease', still, beat)]} onCSSAnimationIteration={chance}>
          <Image source={require('@/assets/characters/my-default.png')} style={styles.rideImg} contentFit="contain" />
          {!still && <AvatarBlink onBlink={onBlink} />}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// 좌우 반전은 .38초 동안 cubic-bezier(.4,0,.2,1) 로
const flipEase = css.create({ t: { transitionProperty: 'transform', transitionDuration: '380ms', transitionTimingFunction: cubicBezier(0.4, 0, 0.2, 1) } }).t;

/*
 * 내 캐릭터 눈 깜빡임 (프로토타입 avBlink · avLids): 3초마다 눈꺼풀이 위에서 내려왔다 올라가요.
 * 좌표는 캐릭터 몸 그림(520×332) 기준 · 노랑 몸 색 눈꺼풀 + 아래 속눈썹 선.
 */
const AV_EYES = [258.5, 339.5].map((x, i) => ({ x, y: [64, 65.5][i], ix: [260, 341][i], iy: [64.5, 65.5][i] }));
const LID_H = 16; // 눈 위 끝 ~ 눈꺼풀 아래 끝 (몸 상자 px)
const avBlink = css.keyframes({ '0%, 90%, 100%': { height: 0 }, '93%, 95%': { height: LID_H } });
function AvatarBlink({ onBlink }: { onBlink: () => void }) {
  const [delay] = useState(() => `${Math.round(Math.random() * 3000)}ms`);
  return (
    <Animated.View
      style={[styles.lidBox, { animationName: avBlink, animationDuration: '3s', animationDelay: delay, animationIterationCount: 'infinite', animationTimingFunction: 'linear' }]}
      onCSSAnimationIteration={onBlink}
      pointerEvents="none">
      <Svg width={BODY_W} height={BODY_H} viewBox="0 0 520 332">
        <Defs>
          <LinearGradient id="avLid" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFEA47" />
            <Stop offset="0.7" stopColor="#FFE200" />
            <Stop offset="1" stopColor="#E0C606" />
          </LinearGradient>
          {AV_EYES.map((e, i) => (
            <ClipPath key={i} id={`avEye${i}`}>
              <Ellipse cx={e.ix} cy={e.iy} rx={25.5} ry={44} />
            </ClipPath>
          ))}
        </Defs>
        {AV_EYES.map((e, i) => {
          const t = e.y - 57.5 - 3;
          const b = e.y - 57.5 + 2 * 57.5 * 1.04;
          return (
            <G key={i} clipPath={`url(#avEye${i})`}>
              <Path d={`M${e.x - 42} ${t} L${e.x + 42} ${t} L${e.x + 42} ${b} Q${e.x} ${b + 12} ${e.x - 42} ${b}Z`} fill="url(#avLid)" />
              <Path d={`M${e.x + 42} ${b} Q${e.x} ${b + 12} ${e.x - 42} ${b}`} fill="none" stroke="#1E1A2B" strokeWidth={7} />
            </G>
          );
        })}
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  origin: { position: 'absolute', left: 0, top: 0, width: 0, height: 0 },
  bottomOrigin: { transformOrigin: 'center bottom' },
  spot: { position: 'absolute', left: -60, top: -60, width: 120, height: 120 },
  rays: { position: 'absolute', left: -66, top: -66, width: 132, height: 132 },
  floor: { position: 'absolute', left: -35, top: 44, width: 70, height: 12, borderRadius: 35, backgroundColor: 'rgba(30, 26, 43, 0.16)' },
  // 프로토타입 .ride-sh: filter blur(1.5px) — 가장자리가 흐린 그림자
  rideSh: { position: 'absolute', left: -23, top: 13, width: 46, height: 10, borderRadius: 23, backgroundColor: 'rgba(30, 26, 43, 0.28)', filter: 'blur(1.5px)' },
  ride: { position: 'absolute', left: -BODY_W / 2, top: -20, width: BODY_W, height: BODY_H },
  body: { width: BODY_W, height: BODY_H },
  rideImg: { position: 'absolute', left: 0, top: IMG.top, width: IMG.w, height: IMG.h },
  // 눈꺼풀은 위에서부터 드러나요 (높이 0 → 16)
  lidBox: { position: 'absolute', left: 0, top: 0, width: BODY_W, height: 0, overflow: 'hidden' },
});
