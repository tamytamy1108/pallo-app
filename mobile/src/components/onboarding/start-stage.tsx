import { Image } from 'expo-image';
import { useEffect, useId, useState, type ComponentProps } from 'react';
import { StyleSheet, useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Defs, Ellipse, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';

import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { kf, kfc, SPRING } from '@/lib/motion';

import { OUT, POP, usePulse } from './fx-motion';
import { SparkBurst } from './fx-spark';

/** 첫 화면 포스터 색 (YOUR FIRST STAGE · (auth)/index.tsx 와 같은 값) */
export const STAGE = { bg: '#333033', yellow: '#E0D121', pink: '#DE7593', pinkLight: '#F2A3B8' } as const;

type Box = { l: number; t?: number; w: number; b: number; h?: number };
type Layout = {
  /** 프로토타입 카드 폭 · 높이 (폰 300px 시안 기준) */
  w: number;
  h: number;
  glow: Box;
  beam: Box;
  floor: Box;
  hero: Box & { ratio: number };
  /** 글씨 칸: 오른쪽 여백 · 최대 폭 · 한 줄일 때 · 두 줄일 때 글자 크기 */
  text: { r: number; max: number; big: number; small: number };
};

/**
 * 프로토타입 onboarding-options.html 의 .h4b (닉네임 · B 작은 무대) 와 .ch-st (캐릭터 고르기) 를 그대로 옮긴 자리 값.
 * 실제 폰에서는 카드 폭에 맞춰 같은 비율로 키워요.
 */
const LAYOUTS = {
  nickname: {
    w: 264,
    h: 132,
    glow: { l: -26, t: -10, w: 190, b: 10 },
    beam: { l: 14, t: -10, w: 110, b: 22 },
    floor: { l: 10, w: 118, h: 28, b: 8 },
    hero: { l: 14, w: 94, b: 22, ratio: 275 / 380 },
    text: { r: 14, max: 112, big: 30, small: 18 },
  },
  character: {
    w: 272,
    h: 176,
    glow: { l: -40, t: -10, w: 224, b: 12 },
    beam: { l: 6, t: -10, w: 132, b: 26 },
    floor: { l: 2, w: 140, h: 34, b: 9 },
    hero: { l: 12, w: 136, b: 24, ratio: 332 / 520 },
    text: { r: 16, max: 100, big: 30, small: 17 },
  },
} satisfies Record<string, Layout>;

export type StageKind = keyof typeof LAYOUTS;

/** 한글 1칸 · 영문 · 숫자 0.62칸 (spec: 글자 수가 아니라 글자 폭으로 크기를 정해요) */
const unitsOf = (s: string) => [...s].reduce((w, ch) => w + (/[\u0000-ɏ]/.test(ch) ? 0.62 : 1), 0);

/**
 * 무대 위 닉네임 줄 나누기: 폭 4칸까지는 한 줄로 크게, 그보다 길면 5자씩 두 줄로 작게.
 * 마지막 줄 끝에 '!' 를 붙여요.
 */
function nameLines(name: string) {
  const chars = [...name];
  if (unitsOf(name) <= 4) return { lines: [`${name}!`], big: true };
  const lines: string[] = [];
  for (let i = 0; i < chars.length; i += 5) lines.push(chars.slice(i, i + 5).join(''));
  lines[lines.length - 1] += '!';
  return { lines, big: false };
}

/** 조명 흔들기 · 팔로로 숨쉬기: 0 ↔ 1 을 왕복 (CSS animation … ease-in-out infinite alternate) */
function useSwing(ms: number, still: boolean) {
  const t = useSharedValue(0);
  useEffect(() => {
    if (still) {
      t.set(0);
      return;
    }
    t.set(withRepeat(withTiming(1, { duration: ms, easing: Easing.inOut(Easing.ease) }), -1, true));
  }, [ms, still, t]);
  return t;
}

/**
 * 작은 무대 카드 (닉네임 · 캐릭터 화면 위): 어두운 무대 · 흔들리는 노란 조명 · 분홍 무대 · 팔로로 + 분홍 'HELLO,' + 흰 닉네임.
 * 노란 글씨는 노란 조명 위에 두지 않아요 (닉네임은 흰색). 움직임 줄이기를 켜면 멈춰 있어요.
 * swapKey 가 바뀌면 (캐릭터 색을 바꾸면) 팔로로가 통 뛰며 뿅 커졌다 돌아오고, 조명이 휙 흔들리며 tint 색으로 물들어요.
 * cheer 가 켜지는 순간 (쓸 수 있는 닉네임이 되면) 닉네임이 톡 튀고 스파크가 터져요.
 * 처음 나타날 때 'HELLO,' 가 네온사인처럼 깜빡이며 켜져요.
 */
export function NameStage({
  kind,
  name,
  hero,
  label,
  swapKey,
  tint,
  cheer,
}: {
  kind: StageKind;
  name: string;
  hero: ComponentProps<typeof Image>['source'];
  label: string;
  swapKey?: string;
  /** 조명 색 (고른 팔로로 색). 없으면 무대 노랑 그대로 */
  tint?: string;
  cheer?: boolean;
}) {
  const L: Layout = LAYOUTS[kind];
  const { width: winW } = useWindowDimensions();
  // 처음엔 OnbScreen 좌우 여백(22)으로 어림잡고, 그린 뒤 실제 폭으로 맞춰요
  const [cardW, setCardW] = useState(winW - 44);
  const k = Math.min(cardW / L.w, 1.6);
  const s = (n: number) => n * k;
  // 그라데이션 이름은 카드마다 달라야 해요 (웹: 뒤에 쌓인 화면의 같은 이름을 가리키면 안 보여요)
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const glowId = `onbGlow${uid}`;
  const floorId = `onbFloor${uid}`;

  const still = useReducedMotion();
  const sway = useSwing(2800, still);
  const bob = useSwing(2600, still);
  const pop = useSharedValue(1);
  useEffect(() => {
    if (still || swapKey === undefined) return;
    pop.set(withSequence(withTiming(0.86, { duration: 90 }), withTiming(1, { duration: 380, easing: SPRING })));
  }, [swapKey, still, pop]);
  // 색을 바꾸면: 팔로로가 통 뛰고, 조명이 휙 쓸고 지나가요
  const hop = usePulse(swapKey, { duration: 560 });
  const sweep = usePulse(swapKey, { duration: 760 });
  const cheerP = usePulse(cheer, { duration: 520, fire: !!cheer });
  // 'HELLO,' 네온: 켜졌다 꺼졌다 몇 번 하다 켜져요 (처음 한 번)
  const neon = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (!still) neon.set(withDelay(320, withTiming(1, { duration: 900, easing: Easing.linear })));
  }, [still, neon]);

  const swayStyle = useAnimatedStyle(() =>
    still ? {} : { transform: [{ rotate: `${-1.6 + 3.2 * sway.get() + kfc(sweep.get(), [0, 28, 100], [0, 11, 0], OUT)}deg` }] },
  );
  const heroStyle = useAnimatedStyle(() => {
    if (still) return {};
    const h = hop.get();
    return {
      transform: [
        { translateY: -6 * k * bob.get() + kfc(h, [0, 40, 75, 100], [0, -16 * k, 0, 0], POP) },
        { rotate: `${-2 * bob.get()}deg` },
        { scale: pop.get() },
        { scaleX: kf(h, [0, 75, 86, 100], [1, 1, 1.08, 1]) },
        { scaleY: kf(h, [0, 75, 86, 100], [1, 1, 0.9, 1]) },
      ],
    };
  });
  const helloStyle = useAnimatedStyle(() => ({ opacity: kf(neon.get(), [0, 8, 14, 26, 32, 44, 50, 70, 100], [0.08, 1, 0.2, 0.9, 0.3, 1, 0.55, 1, 1]) }));
  const nameStyle = useAnimatedStyle(() => ({ transform: [{ scale: kfc(cheerP.get(), [0, 20, 58, 100], [1, 0.9, 1.2, 1], OUT) }] }));

  // 닉네임 글자 크기: 시안 크기를 넘지 않고, 글씨 칸 폭에도 맞게 (한글 10자 · 영문 10자 모두 칸 안에)
  const display = name.trim() ? nameLines(name.trim()) : { lines: ['…'], big: true };
  const maxW = s(L.text.max);
  const widest = Math.max(...display.lines.map(unitsOf));
  const nameSize = Math.min(s(display.big ? L.text.big : L.text.small), (maxW / (widest + 0.15)) * 0.98);
  const helloSize = s(24);

  const box = (b: Box) => ({ left: s(b.l), top: b.t !== undefined ? s(b.t) : undefined, width: s(b.w), bottom: s(b.b), height: b.h !== undefined ? s(b.h) : undefined });
  const heroW = s(L.hero.w);

  return (
    <View
      style={[styles.card, { height: s(L.h), borderRadius: s(22) }]}
      onLayout={(e: LayoutChangeEvent) => setCardW(e.nativeEvent.layout.width)}
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}>
      {/* 조명 번짐 (.h4b-glow) */}
      <Animated.View pointerEvents="none" style={[styles.abs, box(L.glow), swayStyle, styles.topOrigin]}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <Defs>
            <RadialGradient id={glowId} cx="50%" cy="0%" rx="34%" ry="100%" gradientUnits="objectBoundingBox">
              <Stop offset="0" stopColor={STAGE.yellow} stopOpacity={0.42} />
              <Stop offset="0.55" stopColor={STAGE.yellow} stopOpacity={0.18} />
              <Stop offset="0.82" stopColor={STAGE.yellow} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={100} height={100} fill={`url(#${glowId})`} />
        </Svg>
      </Animated.View>
      {/* 노란 조명 줄기 (.h4b-beam: 위가 좁은 사다리꼴) */}
      <Animated.View pointerEvents="none" style={[styles.abs, box(L.beam), swayStyle, styles.topOrigin]}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <Polygon points="42,0 58,0 88,100 12,100" fill={STAGE.yellow} />
        </Svg>
        {tint ? <BeamTint color={tint} /> : null}
      </Animated.View>
      {/* 분홍 무대 (.h4b-floor) */}
      <View pointerEvents="none" style={[styles.abs, box(L.floor)]}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <Defs>
            <RadialGradient id={floorId} cx="50%" cy="38%" rx="60%" ry="70%">
              <Stop offset="0" stopColor={STAGE.pinkLight} />
              <Stop offset="0.7" stopColor={STAGE.pink} />
            </RadialGradient>
          </Defs>
          <Ellipse cx={50} cy={50} rx={50} ry={50} fill={`url(#${floorId})`} />
        </Svg>
      </View>
      {/* 팔로로 (숨 쉬듯 위아래 · 발끝 기준) */}
      <Animated.View pointerEvents="none" style={[styles.abs, { left: s(L.hero.l), bottom: s(L.hero.b), width: heroW, height: heroW * L.hero.ratio }, heroStyle, styles.bottomOrigin]}>
        <Image source={hero} style={StyleSheet.absoluteFill} contentFit="contain" transition={0} accessibilityIgnoresInvertColors />
      </Animated.View>
      {/* HELLO, 닉네임! */}
      <View pointerEvents="none" style={[styles.text, { right: s(L.text.r), maxWidth: maxW }]}>
        <Animated.View style={helloStyle}>
          <PText style={[styles.hello, { fontSize: helloSize, lineHeight: helloSize * 1.02 }]}>HELLO,</PText>
        </Animated.View>
        <Animated.View style={[styles.nameBox, nameStyle]}>
          {display.lines.map((line, i) => (
            <PText
              key={i}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
              style={[styles.name, { fontSize: nameSize, lineHeight: nameSize * (display.big ? 1.08 : 1.18), letterSpacing: display.big ? -1 : -0.5 }]}>
              {line}
            </PText>
          ))}
          <SparkBurst trigger={cheer} fire={!!cheer} count={7} radius={s(40)} size={s(11)} style={styles.nameBurst} />
        </Animated.View>
      </View>
    </View>
  );
}

/**
 * 조명 줄기 위에 고른 색을 옅게 덮어요. 색이 바뀌면 새 색이 스르르 덮이고 앞 색은 스르르 빠져요 (두 겹만 남겨요).
 */
function BeamTint({ color }: { color: string }) {
  const [layers, setLayers] = useState(() => [{ color, id: 0, instant: true }]);
  if (layers[layers.length - 1].color !== color) {
    const last = layers[layers.length - 1];
    setLayers([last, { color, id: last.id + 1, instant: false }]);
  }
  return (
    <>
      {layers.map((l, i) => (
        <TintLayer key={l.id} color={l.color} active={i === layers.length - 1} instant={l.instant} />
      ))}
    </>
  );
}

const TINT = 0.82;

function TintLayer({ color, active, instant }: { color: string; active: boolean; instant: boolean }) {
  const still = useReducedMotion();
  const o = useSharedValue(instant || still ? TINT : 0);
  useEffect(() => {
    if (still) {
      o.set(active ? TINT : 0);
      return;
    }
    o.set(withTiming(active ? TINT : 0, { duration: 480, easing: Easing.out(Easing.quad) }));
  }, [active, still, o]);
  const anim = useAnimatedStyle(() => ({ opacity: o.get() }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, anim]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Polygon points="42,0 58,0 88,100 12,100" fill={color} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { position: 'relative', borderWidth: 2, borderColor: Colors.ink, backgroundColor: STAGE.bg, overflow: 'hidden' },
  abs: { position: 'absolute' },
  topOrigin: { transformOrigin: '50% 0%' },
  bottomOrigin: { transformOrigin: '50% 100%' },
  text: { position: 'absolute', top: 0, bottom: 0, justifyContent: 'center' },
  hello: { fontFamily: Font.poster, color: STAGE.pink, letterSpacing: 0.2 },
  nameBox: { transformOrigin: '30% 50%' },
  nameBurst: { left: '45%', top: '50%' },
  name: { marginTop: 2, fontFamily: Font.body900, color: Colors.white },
});
