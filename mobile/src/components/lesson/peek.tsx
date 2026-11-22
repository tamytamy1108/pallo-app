import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';

import { kf } from '@/lib/motion';

import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

/**
 * 보라 팔로가 오른쪽 옆에서 빼꼼 나와 한마디 하고 들어가요 (프로토타입 lsPeek · .cheer).
 * n 이 바뀔 때마다 한 번 나와요. 2.8초 뒤 들어가요.
 */
const SLIDE = Easing.bezier(0.3, 1.4, 0.5, 1);

export function Peek({ n, line, bottom }: { n: number; line: [string, string] | null; bottom: number }) {
  const still = useReducedMotion();
  const x = useSharedValue(1); // 1 = 숨음(오른쪽 밖) · 0 = 보임
  const bubble = useSharedValue(0);
  const wave = useSharedValue(0);

  useEffect(() => {
    if (!n) return;
    // 프로토타입 .cheer: transform .55s cubic-bezier(.3,1.4,.5,1) · 말풍선 .3초 뒤 · 팔은 .45초 뒤 두 번 흔들어요 (cheerWave 1.1초)
    x.set(still ? 0 : withTiming(0, { duration: 550, easing: SLIDE }));
    bubble.set(still ? 1 : withDelay(300, withTiming(1, { duration: 450, easing: SLIDE })));
    wave.set(0);
    if (!still) wave.set(withDelay(450, withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }), 2, false)));
    const t = setTimeout(() => {
      x.set(still ? 1 : withTiming(1, { duration: 380 }));
      bubble.set(withTiming(0, { duration: 150 }));
    }, 2800);
    return () => clearTimeout(t);
  }, [n, still, x, bubble, wave]);

  const wrap = useAnimatedStyle(() => ({ transform: [{ translateX: `${x.get() * 110}%` }] }));
  const arm = useAnimatedStyle(() => {
    const v = wave.get();
    return { transform: [{ translateY: kf(v, [0, 30, 60, 100], [0, -10, 0, 0]) }, { rotate: `${kf(v, [0, 30, 60, 100], [-6, -16, 2, -6])}deg` }] };
  });
  const bub = useAnimatedStyle(() => ({ opacity: bubble.get(), transform: [{ scale: 0.6 + bubble.get() * 0.4 }] }));

  if (!line) return null;
  return (
    <Animated.View style={[styles.wrap, { bottom }, wrap]} pointerEvents="none" accessibilityLiveRegion="polite" accessibilityLabel={`${line[0]} ${line[1]}`}>
      <Animated.View style={[styles.bubble, bub]}>
        <PText style={styles.en}>{line[0]}</PText>
        <PText style={styles.ko} color={Colors.inkSub}>
          {line[1]}
        </PText>
      </Animated.View>
      <Animated.View style={[styles.charBox, arm]}>
        <Image source={require('@/assets/characters/c-tilted-purple-flip.png')} style={styles.char} contentFit="contain" />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', right: 0, flexDirection: 'row', alignItems: 'center', zIndex: 5 },
  bubble: {
    marginRight: -18,
    marginBottom: 34,
    maxWidth: 176,
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.ink,
    borderRightWidth: 5,
    borderBottomWidth: 5,
    backgroundColor: Colors.white,
    transformOrigin: 'right bottom',
  },
  en: { fontFamily: Font.body900, fontSize: 15, lineHeight: 20 },
  ko: { marginTop: 2, fontFamily: Font.body700, fontSize: 12, lineHeight: 17 },
  charBox: { transformOrigin: '80% 100%' },
  char: { width: 120, height: 100 },
});
