import { Image } from 'expo-image';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Defs, Ellipse, Polygon, RadialGradient, Stop } from 'react-native-svg';

import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { kf, kfc, useLoop } from '@/lib/motion';

import { DONE_AT, useDoneClock } from './done-motion';
import { OUT, POP } from './fx-motion';
import { SparkBurst, SparkMark } from './fx-spark';
import { BODY_RATIO, useMyBody } from './start-palloro';

/** 첫 화면 포스터 색 (YOUR FIRST STAGE · welcome.tsx 와 같은 값) */
export const DONE_STAGE = { bg: '#333033', yellow: '#E0D121', pink: '#DE7593', pinkLight: '#F2A3B8' } as const;

/** 표가 무대 판 아래를 덮는 길이 (그만큼 판 아래쪽은 비워 둬요) */
export const STAGE_OVERLAP = 44;

const FALL = Easing.bezierFn(0.55, 0, 0.85, 0.4);

/**
 * 체험 예약 확정 › 위쪽 무대 판.
 * 어두운 판에 노란 조명이 켜지고, 분홍 무대에 팔로로가 떨어져 납작하게 착지하고, 'SEE YOU / ON STAGE.' 가 단어마다 올라와요.
 * 첫 화면(YOUR FIRST STAGE)의 무대를 그대로 가져와 '첫 무대 입장권'을 받는 느낌을 줘요.
 */
export function DoneStage({ width, hero: heroSrc }: { width: number; hero?: number }) {
  // 내 팔로로가 무대에 떨어져 내려요 (기본: 캐릭터 고르기에서 고른 몸 색 · 앱 안에서는 꾸민 몸 색을 넘겨요)
  const mine = useMyBody();
  const hero = heroSrc ?? mine;
  const height = Math.round(width * 0.7);
  const cx = width * 0.75;
  const floorW = width * 0.44;
  const floorH = 30;
  const floorY = height - STAGE_OVERLAP - 26;
  const heroW = width * 0.34;
  const heroH = heroW * BODY_RATIO;
  const poster = Math.round(width * 0.13);

  const light = useDoneClock(DONE_AT.light, DONE_AT.lightMs);
  const floor = useDoneClock(DONE_AT.floor, DONE_AT.floorMs);
  const drop = useDoneClock(DONE_AT.drop, DONE_AT.dropMs);
  const land = useDoneClock(DONE_AT.land, DONE_AT.landMs);
  const words = useDoneClock(DONE_AT.words, DONE_AT.wordsMs);
  const sub = useDoneClock(DONE_AT.sub, DONE_AT.subMs);
  // 다 들어온 뒤: 조명이 살살 흔들리고 팔로로가 숨 쉬어요 (움직임 줄이기면 멈춰요)
  const sway = useLoop(5600, { delay: 1400 });
  const breathe = useLoop(2800, { delay: DONE_AT.land + DONE_AT.landMs });

  // 불: 두어 번 깜빡이다 켜져요
  const beamStyle = useAnimatedStyle(() => ({
    opacity: kf(light.get(), [0, 25, 40, 55, 70, 100], [0, 0.85, 0.15, 0.9, 0.4, 1]),
    transform: [{ rotate: `${1.4 * Math.sin(sway.get() * Math.PI * 2)}deg` }],
  }));
  const floorStyle = useAnimatedStyle(() => ({ opacity: kf(floor.get(), [0, 40, 100], [0, 1, 1]), transform: [{ scaleX: kfc(floor.get(), [0, 100], [0.2, 1], POP) }] }));
  const shadowStyle = useAnimatedStyle(() => {
    const b = 0.5 - 0.5 * Math.cos(breathe.get() * Math.PI * 2);
    return { opacity: drop.get() * (1 - 0.25 * b), transform: [{ scale: (0.2 + 0.8 * drop.get()) * (1 - 0.14 * b) }] };
  });
  const heroStyle = useAnimatedStyle(() => {
    const l = land.get();
    const landing = l > 0 && l < 1;
    const b = 0.5 - 0.5 * Math.cos(breathe.get() * Math.PI * 2);
    return {
      opacity: drop.get() > 0 ? 1 : 0,
      transform: [
        { translateY: kfc(drop.get(), [0, 100], [-(floorY + heroH), 0], FALL) - b * 5 },
        // 착지: 납작 → 통통 → 제자리
        { scaleX: landing ? kf(l, [0, 40, 72, 100], [1.16, 0.94, 1.03, 1]) : 1 },
        { scaleY: landing ? kf(l, [0, 40, 72, 100], [0.8, 1.07, 0.98, 1]) : 1 },
      ],
    };
  });
  const subStyle = useAnimatedStyle(() => ({ opacity: sub.get(), transform: [{ translateY: kfc(sub.get(), [0, 100], [10, 0], OUT) }] }));

  const glowR = height * 0.9;

  return (
    <View
      style={[styles.panel, { height }]}
      accessible
      accessibilityRole="header"
      accessibilityLabel="See you on stage. 확정 연락이 곧 갈 거예요!">
      {/* 조명: 판 맨 위에서 무대 가운데까지 */}
      <Animated.View pointerEvents="none" style={[styles.fill, { transformOrigin: [cx, 0, 0] }, beamStyle]}>
        <Svg width={width} height={floorY + floorH / 2}>
          <Defs>
            <RadialGradient id="doneGlow" cx={cx} cy={0} rx={width * 0.55} ry={glowR} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={DONE_STAGE.yellow} stopOpacity={0.36} />
              <Stop offset="0.55" stopColor={DONE_STAGE.yellow} stopOpacity={0.12} />
              <Stop offset="1" stopColor={DONE_STAGE.yellow} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx={cx} cy={0} rx={width * 0.55} ry={glowR} fill="url(#doneGlow)" />
          <Polygon points={`${cx - 14},0 ${cx + 14},0 ${cx + floorW * 0.36},${floorY} ${cx - floorW * 0.36},${floorY}`} fill={DONE_STAGE.yellow} opacity={0.9} />
        </Svg>
      </Animated.View>

      {/* 무대 (분홍 타원) */}
      <Animated.View pointerEvents="none" style={[styles.abs, { left: cx - floorW / 2, top: floorY - floorH / 2, width: floorW, height: floorH }, floorStyle]}>
        <Svg width={floorW} height={floorH}>
          <Defs>
            <RadialGradient id="doneFloor" cx="50%" cy="38%" rx="60%" ry="70%">
              <Stop offset="0" stopColor={DONE_STAGE.pinkLight} />
              <Stop offset="0.7" stopColor={DONE_STAGE.pink} />
            </RadialGradient>
          </Defs>
          <Ellipse cx={floorW / 2} cy={floorH / 2} rx={floorW / 2} ry={floorH / 2} fill="url(#doneFloor)" />
        </Svg>
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.shadow, { left: cx - heroW * 0.3, top: floorY - 3, width: heroW * 0.6, height: 8 }, shadowStyle]} />

      {/* 팔로로: 위에서 떨어져 무대에 착지 */}
      <Animated.View pointerEvents="none" style={[styles.abs, { left: cx - heroW / 2, top: floorY - heroH + 9, width: heroW, height: heroH, transformOrigin: '50% 100%' }, heroStyle]}>
        <Image source={hero} style={StyleSheet.absoluteFill} contentFit="contain" accessibilityIgnoresInvertColors accessible={false} />
      </Animated.View>

      {/* 착지하는 순간 스파크 */}
      <PopSpark at={{ left: cx + heroW * 0.42, top: floorY - heroH - 6 }} size={18} color={DONE_STAGE.yellow} />
      <PopSpark at={{ left: cx + heroW * 0.52, top: floorY - heroH * 0.32 }} size={12} color={DONE_STAGE.pinkLight} />
      <SparkBurst trigger={0} onMount delay={DONE_AT.land} count={7} radius={heroW * 0.62} size={12} style={{ left: cx, top: floorY - heroH * 0.45 }} />

      {/* 맨 위 작은 머리 글씨 */}
      <View style={styles.eyebrow}>
        <SparkMark size={13} color={Colors.white} />
        <PText style={styles.eyebrowText}>PALLO · FREE TRIAL</PText>
      </View>

      {/* 포스터 글씨 */}
      <View style={[styles.head, { bottom: STAGE_OVERLAP + 16 }]}>
        <PosterLine words={['SEE', 'YOU']} color={Colors.white} size={poster} t={words} from={0} />
        <PosterLine words={['ON', 'STAGE.']} color={DONE_STAGE.yellow} size={poster} t={words} from={0.22} />
        <Animated.View style={subStyle}>
          <PText style={styles.sub}>확정 연락이 곧 갈 거예요!</PText>
        </Animated.View>
      </View>
    </View>
  );
}

/** 포스터 한 줄: 줄 밖은 가리고, 단어마다 조금씩 늦게 아래에서 올라와요 */
function PosterLine({ words, color, size, t, from }: { words: string[]; color: string; size: number; t: SharedValue<number>; from: number }) {
  const lineH = Math.round(size * 1.02);
  return (
    <View style={[styles.line, { height: lineH }]}>
      {words.map((w, i) => (
        <PosterWord key={w} text={w} color={color} size={size} lineH={lineH} t={t} start={from + i * 0.12} />
      ))}
    </View>
  );
}

function PosterWord({ text, color, size, lineH, t, start }: { text: string; color: string; size: number; lineH: number; t: SharedValue<number>; start: number }) {
  // t 0 → 1 안에서 이 단어는 start 부터 0.55 동안 올라와요
  const style = useAnimatedStyle(() => {
    const p = Math.min(1, Math.max(0, (t.get() - start) / 0.55));
    return { transform: [{ translateY: (1 - OUT(p)) * lineH }] };
  });
  return (
    <Animated.View style={style}>
      <PText style={{ fontFamily: Font.poster, fontSize: size, lineHeight: lineH, color, letterSpacing: 0.2 }}>{text} </PText>
    </Animated.View>
  );
}

/** 팔로로가 착지할 때 톡 커지며 나타나는 스파크 하나 */
function PopSpark({ at, size, color }: { at: ViewStyle; size: number; color: string }) {
  const p = useDoneClock(DONE_AT.land + 60, 420);
  const style = useAnimatedStyle(() => ({ opacity: kf(p.get(), [0, 20, 100], [0, 1, 1]), transform: [{ scale: kfc(p.get(), [0, 60, 100], [0, 1.3, 1], OUT) }, { rotate: `${kf(p.get(), [0, 100], [-40, 0])}deg` }] }));
  return (
    <Animated.View pointerEvents="none" style={[styles.abs, at, style]}>
      <SparkMark size={size} color={color} stroke={Colors.ink} strokeWidth={1.2} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: { borderRadius: 28, borderWidth: 2, borderColor: Colors.ink, backgroundColor: DONE_STAGE.bg, overflow: 'hidden' },
  fill: { position: 'absolute', left: 0, top: 0 },
  abs: { position: 'absolute' },
  shadow: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(30,26,43,0.2)' },
  eyebrow: { position: 'absolute', left: 20, top: 18, flexDirection: 'row', alignItems: 'center', gap: 6 },
  eyebrowText: { fontFamily: Font.poster, fontSize: 13, lineHeight: 17, letterSpacing: 1.4, color: Colors.white, opacity: 0.86 },
  head: { position: 'absolute', left: 20 },
  line: { flexDirection: 'row', overflow: 'hidden' },
  sub: { marginTop: 8, fontFamily: Font.body900, fontSize: 16, lineHeight: 22, letterSpacing: -0.4, color: Colors.white },
});
