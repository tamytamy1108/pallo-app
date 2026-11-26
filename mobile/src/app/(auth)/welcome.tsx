import { useMutation } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Ellipse, Path, Polygon, RadialGradient, Stop } from 'react-native-svg';

import { loginWithProvider } from '@/api/auth';
import { apiErrorMessage } from '@/api/errors';
import { SPARK } from '@/components/meet/korea-paths';
import { Logo } from '@/components/logo';
import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { sfx } from '@/lib/feedback';
import { resetOnboarding } from '@/state/onboarding';

/** 포스터 색 (YOUR FIRST STAGE) */
const ST = { bg: '#333033', yellow: '#E0D121', pink: '#DE7593', pinkLight: '#F2A3B8', red: '#EC2A2E' };
const KAKAO = '#FEE500';
const OUT = Easing.bezier(0.2, 0.8, 0.2, 1);
const HERO = require('@/assets/characters/c-purple-lash-sticker.png');
const HERO_RATIO = 275 / 380; // 스티커 그림 원본 380 × 275

/**
 * 첫 화면 · YOUR FIRST STAGE (prototype/start-screen-motion.html).
 * 불이 깜빡이며 켜지고 → 분홍 무대가 펼쳐지고 → 팔로로가 떨어져 착지하고 → 문구가 올라와요. 그다음엔 조명이 흔들리고 팔로로가 숨 쉬어요.
 * 버튼은 '카카오로 시작하기' 하나. 처음 가입이면 약관부터, 이미 가입했으면 홈으로.
 */
export default function WelcomeScreen() {
  const { width: W } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // 어두운 무대 위에서는 폰 맨 위 시간 · 배터리를 흰 글자로. 다른 화면으로 가면 원래(잉크)로 돌려요
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('dark');
    }, []),
  );
  const still = useReducedMotion();
  // 웹 미리보기: 이 화면을 열 때마다 처음 가입하는 사람으로 시작해요 (앱을 처음 받은 것처럼 해 보기)
  useState(() => Platform.OS === 'web' && __DEV__ && resetOnboarding());

  // 로그인하면 토큰이 저장되고, 로그인 상태(api/session.tsx)가 /me 를 받아 가입 과정 · 홈으로 보내요 (app/_layout.tsx)
  const login = useMutation({
    mutationFn: () => loginWithProvider('kakao'),
    onError: (e) => showToast(apiErrorMessage(e)),
  });

  // 움직임 값 (0 → 1)
  const live = useSharedValue(still ? 1 : 0);
  const light = useSharedValue(still ? 1 : 0);
  const sway = useSharedValue(0);
  const floor = useSharedValue(still ? 1 : 0);
  const drop = useSharedValue(still ? 1 : 0);
  const land = useSharedValue(still ? 1 : 0);
  const bob = useSharedValue(0);
  const words = useSharedValue(still ? 1 : 0);
  const sub = useSharedValue(still ? 1 : 0);
  const blink = useSharedValue(1);

  useEffect(() => {
    if (still) return;
    live.set(withDelay(100, withTiming(1, { duration: 400, easing: Easing.bezier(0.2, 0.9, 0.3, 1.4) })));
    blink.set(withDelay(500, withRepeat(withSequence(withTiming(1, { duration: 600 }), withTiming(0.15, { duration: 0 }), withTiming(0.15, { duration: 600 }), withTiming(1, { duration: 0 })), -1)));
    // 불: 두어 번 깜빡이다 켜져요 (beamOn .9s)
    light.set(
      withDelay(
        200,
        withSequence(
          withTiming(0.85, { duration: 225 }),
          withTiming(0.15, { duration: 90 }),
          withTiming(0.9, { duration: 90 }),
          withTiming(0.4, { duration: 90 }),
          withTiming(1, { duration: 135 }),
        ),
      ),
    );
    sway.set(withDelay(1400, withRepeat(withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.ease) }), -1, true)));
    floor.set(withDelay(550, withTiming(1, { duration: 450, easing: Easing.bezier(0.2, 0.9, 0.3, 1.2) })));
    drop.set(withDelay(850, withTiming(1, { duration: 620, easing: Easing.bezier(0.55, 0, 0.85, 0.4) })));
    land.set(withDelay(1470, withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) })));
    bob.set(withDelay(2100, withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.ease) }), -1, true)));
    words.set(withDelay(1450, withTiming(1, { duration: 930, easing: Easing.linear })));
    sub.set(withDelay(2050, withTiming(1, { duration: 500, easing: OUT })));
  }, [still, live, blink, light, sway, floor, drop, land, bob, words, sub]);

  // 크기는 화면 폭에 맞춰요 (프로토타입 cqw)
  const u = W / 100;
  // 조명은 화면 맨 위부터 무대 가운데까지 (무대 자리를 재서 맞춰요)
  const [beamH, setBeamH] = useState(0);
  const heroW = 34 * u;
  const floorH = 12.8 * u;

  const liveStyle = useAnimatedStyle(() => ({ opacity: live.get(), transform: [{ scale: 0.4 + 0.6 * live.get() }] }));
  const dotStyle = useAnimatedStyle(() => ({ opacity: blink.get() }));
  const lightStyle = useAnimatedStyle(() => ({ opacity: light.get(), transform: [{ rotate: `${-1.6 + 3.2 * sway.get()}deg` }] }));
  const floorStyle = useAnimatedStyle(() => ({ opacity: floor.get(), transform: [{ scaleX: floor.get() }] }));
  const shadowStyle = useAnimatedStyle(() => ({ opacity: drop.get() * (1 - 0.25 * bob.get()), transform: [{ scale: (0.2 + 0.8 * drop.get()) * (1 - 0.16 * bob.get()) }] }));
  const heroStyle = useAnimatedStyle(() => {
    // 착지: 납작 → 통통 → 제자리 (land), 그다음 위아래로 숨 쉬기 (bob)
    const l = land.get();
    const sx = l < 0.45 ? 1.14 - (0.2 * l) / 0.45 : l < 0.75 ? 0.94 + (0.09 * (l - 0.45)) / 0.3 : 1.03 - (0.03 * (l - 0.75)) / 0.25;
    const sy = l < 0.45 ? 0.82 + (0.25 * l) / 0.45 : l < 0.75 ? 1.07 - (0.1 * (l - 0.45)) / 0.3 : 0.97 + (0.03 * (l - 0.75)) / 0.25;
    const landed = l > 0 && l < 1;
    return {
      transform: [
        { translateY: -(1 - drop.get()) * 900 - bob.get() * 2.2 * u },
        { rotate: `${-2 * bob.get()}deg` },
        { scaleX: landed ? sx : 1 },
        { scaleY: landed ? sy : 1 },
      ],
    };
  });
  const subStyle = useAnimatedStyle(() => ({ opacity: sub.get(), transform: [{ translateY: (1 - sub.get()) * 2.4 * u }] }));

  return (
    <View style={styles.root}>
      {/* 조명 (화면 맨 위부터 무대까지 · 살짝 흔들려요) */}
      <Animated.View pointerEvents="none" style={[styles.beamWrap, { height: beamH }, lightStyle, { transformOrigin: '50% 0%' }]}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="0%" rx="34%" ry="100%" gradientUnits="objectBoundingBox">
              <Stop offset="0" stopColor={ST.yellow} stopOpacity={0.42} />
              <Stop offset="0.55" stopColor={ST.yellow} stopOpacity={0.18} />
              <Stop offset="0.82" stopColor={ST.yellow} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx={50} cy={0} rx={80} ry={100} fill="url(#glow)" />
          <Polygon points="46,0 54,0 75,100 25,100" fill={ST.yellow} />
        </Svg>
      </Animated.View>

      <View style={[styles.content, { paddingTop: insets.top + 8, paddingHorizontal: 6 * u }]}>
        {/* 로고 · 소개 줄 · LIVE */}
        <View style={styles.toprow}>
          <View>
            <View style={styles.logo} accessible accessibilityRole="image" accessibilityLabel="PALLO!">
              <Svg width={6.8 * u} height={6.03 * u} viewBox="0 0 426.31 377.94">
                <Path d={SPARK} fill={Colors.white} />
              </Svg>
              <Logo width={20 * u} color={Colors.white} />
            </View>
            <PText style={[styles.cat, { fontSize: Math.max(11, 2.9 * u) }]}>영어 · 일본어 · 중국어 · 스페인어 회화 스터디</PText>
          </View>
          <Animated.View style={[styles.live, { height: 7.6 * u, borderRadius: 4 * u, paddingLeft: 2.8 * u, paddingRight: 3.4 * u, gap: 1.6 * u }, liveStyle]}>
            <Animated.View style={[styles.liveDot, { width: 2.2 * u, height: 2.2 * u, borderRadius: 1.1 * u }, dotStyle]} />
            <PText style={[styles.liveText, { fontSize: 4.6 * u, lineHeight: 6 * u }]}>LIVE</PText>
          </Animated.View>
        </View>

        {/* 무대 */}
        <View style={styles.stage} onLayout={(e) => setBeamH(e.nativeEvent.layout.y + e.nativeEvent.layout.height - floorH / 2)}>
          <Animated.View style={[styles.floor, { height: floorH, bottom: 0 }, floorStyle]}>
            <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
              <Defs>
                <RadialGradient id="floor" cx="50%" cy="38%" rx="60%" ry="70%">
                  <Stop offset="0" stopColor={ST.pinkLight} />
                  <Stop offset="0.7" stopColor={ST.pink} />
                </RadialGradient>
              </Defs>
              <Ellipse cx={50} cy={50} rx={50} ry={50} fill="url(#floor)" />
            </Svg>
          </Animated.View>
          <Animated.View style={[styles.shadow, { width: 24 * u, height: 3.6 * u, marginLeft: -12 * u, bottom: floorH / 2 - 1.8 * u + 0.6 * u }, shadowStyle]} />
          <Animated.View style={[styles.hero, { width: heroW, height: heroW * HERO_RATIO, marginLeft: -heroW / 2, bottom: floorH / 2 }, heroStyle, { transformOrigin: '50% 100%' }]}>
            <Image source={HERO} style={StyleSheet.absoluteFill} contentFit="contain" accessibilityIgnoresInvertColors />
          </Animated.View>
        </View>

        {/* 문구: 단어마다 아래에서 올라와요 */}
        <View style={styles.head} accessible accessibilityRole="header" accessibilityLabel="Your first word, your first stage.">
          <Line words={['YOUR', 'FIRST', 'WORD,']} color={Colors.white} size={10.6 * u} t={words} from={0} />
          <Line words={['YOUR', 'FIRST', 'STAGE.']} color={ST.yellow} size={10.6 * u} t={words} from={0.24} />
        </View>
        <Animated.View style={subStyle}>
          <PText style={[styles.sub, { fontSize: 4.9 * u, lineHeight: 4.9 * u * 1.38 }]}>
            낯선 언어로 건넨 첫마디,{'\n'}그게 당신의 첫 무대예요.
          </PText>
        </Animated.View>
      </View>

      {/* 카카오로 시작하기 · 회원가입 (처음부터 바로 누를 수 있어요) */}
      <View style={[styles.btns, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={() => {
            sfx('tap');
            login.mutate();
          }}
          disabled={login.isPending}
          accessibilityRole="button"
          accessibilityLabel="카카오로 시작하기"
          accessibilityState={{ disabled: login.isPending, busy: login.isPending }}>
          {({ pressed }) => (
            <View style={[styles.kakao, pressed && styles.kakaoPressed, login.isPending && styles.kakaoBusy]}>
              <Svg width={20} height={20} viewBox="0 0 24 24">
                <Path fill="#000000" d="M12 3C6.48 3 2 6.48 2 10.8c0 2.8 1.88 5.25 4.7 6.64-.2.74-.74 2.68-.85 3.09-.13.51.19.5.4.37.16-.11 2.6-1.77 3.65-2.49.68.1 1.38.15 2.1.15 5.52 0 10-3.48 10-7.76C22 6.48 17.52 3 12 3z" />
              </Svg>
              <PText style={styles.kakaoText} color="rgba(0,0,0,0.85)">
                {login.isPending ? '카카오로 들어가는 중…' : '카카오로 시작하기'}
              </PText>
            </View>
          )}
        </Pressable>
        {/* 카카오 계정이 없거나 안 쓰고 싶을 때: 이메일로 가입 (/signup). 카카오가 주인공이라 작고 흐린 글자 링크로만 */}
        <Pressable
          onPress={() => {
            sfx('tap');
            router.push('/signup');
          }}
          disabled={login.isPending}
          hitSlop={8}
          accessibilityRole="link"
          accessibilityLabel="이메일로 회원가입"
          accessibilityState={{ disabled: login.isPending }}
          style={styles.joinWrap}>
          {({ pressed }) => (
            <PText style={[styles.join, pressed && styles.joinPressed]} color={Colors.white}>
              이메일로 회원가입
            </PText>
          )}
        </Pressable>
      </View>
    </View>
  );
}

/**
 * 포스터 글자(Anton) 세로 치수 (글자 크기 1 기준 · unitsPerEm 2048).
 * iOS 는 lineHeight 가 글꼴 원래 높이(ascent + descent ≈ 1.5)보다 작으면 글자 위 · 아래를 잘라요.
 * 그래서 글자 줄은 글꼴 원래 높이로 그리고, 단어가 올라오는 창(overflow hidden)만 글자에 딱 맞게 좁혀요.
 */
const ANTON = { ascent: 2409 / 2048, descent: 674 / 2048, top: 1776 / 2048, bottom: 235 / 2048 };
const POSTER_PAD = 0.03; // 창 위 · 아래 숨 쉴 틈
const POSTER_LINE = ANTON.ascent + ANTON.descent; // 글꼴 원래 줄 높이 (잘리지 않아요)
const POSTER_ROW = POSTER_PAD + ANTON.top + ANTON.bottom + POSTER_PAD * 1.6; // 창 높이 ≈ 1.06 (쉼표 꼬리까지)
const POSTER_SHIFT = POSTER_PAD + ANTON.top - ANTON.ascent; // 글자 꼭대기가 창 맨 위 + PAD 에 오도록 올려요

/** 포스터 한 줄: 단어마다 0.07초씩 늦게 아래에서 올라와요 (rise .55s) */
function Line({ words, color, size, t, from }: { words: string[]; color: string; size: number; t: SharedValue<number>; from: number }) {
  return (
    <View style={[styles.line, { height: size * POSTER_ROW }]}>
      {words.map((w, i) => (
        <Word key={i} text={w} color={color} size={size} t={t} delay={from + i * 0.07} />
      ))}
    </View>
  );
}

function Word({ text, color, size, t, delay }: { text: string; color: string; size: number; t: SharedValue<number>; delay: number }) {
  // t: 0 → 1 이 0.93초. 한 단어는 그중 0.55초 동안 올라와요
  const style = useAnimatedStyle(() => {
    const p = Math.min(1, Math.max(0, (t.get() * 0.93 - delay) / 0.55));
    const e = 1 - Math.pow(1 - p, 3);
    return { transform: [{ translateY: (1 - e) * size * POSTER_ROW }] };
  });
  return (
    <Animated.View style={[{ marginTop: size * POSTER_SHIFT, height: size * POSTER_LINE }, style]}>
      {/* 크기는 화면 폭에 맞춰 정해요 — 글자 크기 설정으로 커지면 창 밖으로 잘려서 막아 둬요 */}
      <PText
        allowFontScaling={false}
        style={{ fontFamily: Font.poster, fontSize: size, lineHeight: size * POSTER_LINE, color, letterSpacing: -0.1, includeFontPadding: false }}>
        {text}{' '}
      </PText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ST.bg, overflow: 'hidden' },
  beamWrap: { position: 'absolute', left: 0, right: 0, top: 0 },
  // 아래 카카오 버튼(56) + 회원가입 글자 줄(26) · 여백만큼 비워 둬요
  content: { flex: 1, paddingBottom: 160 },
  toprow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 3 },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cat: { marginTop: 6, fontFamily: Font.body700, color: Colors.white, opacity: 0.92 },
  live: { flexDirection: 'row', alignItems: 'center', backgroundColor: ST.red },
  liveDot: { backgroundColor: Colors.white },
  liveText: { fontFamily: Font.poster, color: Colors.white, letterSpacing: 0.3 },
  stage: { flex: 1, minHeight: 0 },
  floor: { position: 'absolute', left: '15.5%', width: '69%' },
  shadow: { position: 'absolute', left: '50%', borderRadius: 999, backgroundColor: 'rgba(30,26,43,0.22)' },
  hero: { position: 'absolute', left: '50%' },
  head: { marginTop: 18, zIndex: 3 },
  line: { flexDirection: 'row', overflow: 'hidden' },
  sub: { marginTop: 14, fontFamily: Font.body900, color: Colors.white, letterSpacing: -0.4 },
  btns: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, gap: 10 },
  kakao: {
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: KAKAO,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxShadow: '3px 3px 0 #FFFFFF',
  },
  kakaoPressed: { transform: [{ translateX: 3 }, { translateY: 3 }], boxShadow: '0 0 0 #FFFFFF' },
  kakaoBusy: { opacity: 0.7 },
  // 이메일로 회원가입: 버튼 아닌 작은 밑줄 글자 · 흐리게 (눈에 덜 띄게)
  joinWrap: { alignSelf: 'center', paddingVertical: 4 },
  join: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18, opacity: 0.5, textDecorationLine: 'underline' },
  joinPressed: { opacity: 0.8 },
  kakaoText: { fontFamily: Font.body900, fontSize: 16, lineHeight: 22 },
});
