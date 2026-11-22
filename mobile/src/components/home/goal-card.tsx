import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { ClipPath, Defs, Ellipse, G, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Raised } from '@/components/ui/raised';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { TODAY_GOAL } from '@/data/home';
import { kf, useLoop } from '@/lib/motion';
import { useDoneCount } from '@/state/progress';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

/**
 * 앱 구독자 홈 맨 위: 오늘의 목표 카드 (프로토타입 .sub-hero).
 * '퀘스트 2개 깨기' · n/2 완료 · 연속 학습 n일 · [이어서 하기 →] (스터디 맵의 지금 정류장 팝업을 열어요).
 */
export function GoalCard({ onContinue }: { onContinue: () => void }) {
  // TODO: 진도 담당이 '오늘 끝낸 수'를 주면 바꿔요 (지금은 Lv.1 에서 끝낸 수)
  const done = useDoneCount('1:');
  const today = Math.min(TODAY_GOAL.total, done);
  return (
    <Raised radius={26}>
      <View style={styles.card}>
        <TiltedChar />
        <View style={styles.pill}>
          <PText style={styles.pillText} color={Colors.white}>
            앱 구독 · 오늘의 목표
          </PText>
        </View>
        <PText style={styles.title}>{TODAY_GOAL.title}</PText>
        <PText style={styles.meta}>
          {today}/{TODAY_GOAL.total} 완료 · 연속 학습 {done > 0 ? 1 : 0}일
        </PText>
        <View style={styles.actions}>
          <Pressable onPress={onContinue} accessibilityRole="button" accessibilityLabel="이어서 하기">
            {({ pressed }) => (
              <Raised radius={27} pressed={pressed}>
                <View style={styles.btn}>
                  <PText style={styles.btnText}>이어서 하기 →</PText>
                </View>
              </Raised>
            )}
          </Pressable>
        </View>
      </View>
    </Raised>
  );
}

/* 보라 팔로 (c-tilted-purple-flip · 480 × 350) + 3초마다 눈 깜빡임 (프로토타입 HERO_EYES · heroBlink) */
const W = 480;
const H = 350;
const EYES = [
  [188.1, 64.5, 32.5, 45.9, 13.9],
  [261.2, 81.3, 32.5, 45.9, 13.9],
] as const;
const CHAR_W = 250;

function TiltedChar() {
  const [delay] = useState(() => Math.round(Math.random() * 3000));
  const blink = useLoop(3000, { delay });
  const ry = EYES[0][3];
  const lid = useAnimatedProps(() => ({ height: (ry * 2 + 4) * kf(blink.get(), [0, 90, 93, 95, 100], [0, 0, 1, 1, 0]) }));
  const h = (CHAR_W * H) / W;
  return (
    <View style={StyleSheet.flatten([styles.char, { width: CHAR_W, height: h }])} pointerEvents="none">
      <Image source={require('@/assets/characters/c-tilted-purple-flip.png')} style={StyleSheet.absoluteFill} contentFit="contain" />
      <Svg width={CHAR_W} height={h} viewBox={`0 0 ${W} ${H}`} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="goalLid" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#8B73E3" />
            <Stop offset="0.7" stopColor="#6C4FD6" />
            <Stop offset="1" stopColor="#5B40C0" />
          </LinearGradient>
          {EYES.map(([x, y, rx, r], i) => (
            <ClipPath key={i} id={`goalEye${i}`}>
              <Ellipse cx={x} cy={y} rx={rx} ry={r} />
            </ClipPath>
          ))}
        </Defs>
        {EYES.map(([x, y, rx, r, a], i) => (
          <G key={i} transform={`rotate(${a} ${x} ${y})`} clipPath={`url(#goalEye${i})`}>
            <AnimatedRect x={x - rx - 2} y={y - r - 2} width={rx * 2 + 4} fill="url(#goalLid)" animatedProps={lid} />
          </G>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 190, borderRadius: 26, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow, overflow: 'hidden', padding: 20 },
  char: { position: 'absolute', right: -40, bottom: -58 },
  pill: { alignSelf: 'flex-start', height: 26, paddingHorizontal: 11, borderRadius: 13, backgroundColor: Colors.ink, justifyContent: 'center' },
  pillText: { fontFamily: Font.body800, fontSize: 12, lineHeight: 16 },
  title: { marginTop: 14, fontFamily: Font.display, fontSize: 22, lineHeight: 26.4 },
  meta: { marginTop: 6, fontFamily: Font.body700, fontSize: 13, lineHeight: 18 },
  actions: { marginTop: 14, flexDirection: 'row' },
  btn: { height: 54, paddingHorizontal: 22, borderRadius: 27, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, justifyContent: 'center' },
  btnText: { fontFamily: Font.body900, fontSize: 16, lineHeight: 22 },
});
