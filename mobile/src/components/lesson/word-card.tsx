import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { SPRING } from '@/lib/motion';

const PURPLE_LINE = '#6B4FC8';

type Props = {
  word: string;
  /** linked: 줄에 이어진 카드 · said: 말로 들려서 곧 이어질 카드 · hint: 3번 틀리면 정답 카드 반짝 */
  state?: 'pool' | 'linked' | 'said' | 'hint';
  /** 패턴 부분이면 보라 밑줄 */
  focus?: boolean;
  /** 숫자가 바뀔 때마다 한 번 흔들려요 (틀렸을 때) */
  shake?: number;
  /** 문장을 다 이었을 때 파도처럼 한 번 통 (몇 ms 뒤에) */
  wave?: number;
  onPress?: () => void;
};

/** 단어 카드 한 장 (프로토타입 .sh-w) */
export function WordCard({ word, state = 'pool', focus = false, shake = 0, wave, onPress }: Props) {
  const x = useSharedValue(0);
  useEffect(() => {
    if (!shake) return;
    x.set(withSequence(withTiming(-6, { duration: 70 }), withTiming(6, { duration: 90 }), withTiming(-4, { duration: 80 }), withTiming(0, { duration: 70 })));
  }, [shake, x]);

  // 정답 힌트: 노란 카드가 위아래로 통통 · 둘레에 노란 빛이 퍼졌다 사라져요 (프로토타입 #shPool .sh-w.hint · shHint 1.1초)
  const still = useReducedMotion();
  const bob = useSharedValue(0);
  useEffect(() => {
    if (state !== 'hint' || still) {
      cancelAnimation(bob);
      bob.set(0);
      return;
    }
    bob.set(withRepeat(withTiming(1, { duration: 550, easing: Easing.inOut(Easing.ease) }), -1, true));
    return () => cancelAnimation(bob);
  }, [state, still, bob]);

  // shWave .5초: 위로 -6 → 제자리 (카드마다 조금씩 늦게)
  const wy = useSharedValue(0);
  useEffect(() => {
    if (wave == null || still) return;
    wy.set(withDelay(wave, withSequence(withTiming(-9, { duration: 200, easing: SPRING }), withTiming(0, { duration: 300, easing: SPRING }))));
  }, [wave, still, wy]);

  const said = state === 'said';
  const hint = state === 'hint';
  const move = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }, { translateY: -3 * bob.get() + wy.get() }, { scale: said ? 1.08 : 1 }] }));
  // 말한 카드는 빛이 그대로, 힌트는 숨 쉬듯 (움직임 줄이기면 빛 대신 굵은 테두리)
  const ring = useAnimatedStyle(() => ({ opacity: said ? 1 : hint && !still ? bob.get() : 0 }));

  const linked = state === 'linked';
  const body = (pressed: boolean) => (
    <Animated.View style={move}>
      <Animated.View style={[styles.ring, ring]} pointerEvents="none" />
      <Animated.View style={[styles.card, linked && styles.linked, (said || hint) && styles.lit, hint && still && styles.hintStill, (linked || pressed) && styles.down, shake > 0 && styles.wrong]}>
        <PText style={StyleSheet.flatten([styles.text, focus && styles.focus])} color={shake > 0 ? Colors.matchBadInk : Colors.ink}>
          {word}
        </PText>
        {shake > 0 && <WrongBadge />}
      </Animated.View>
    </Animated.View>
  );

  if (!onPress) return body(false);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={word} hitSlop={4}>
      {({ pressed }) => body(pressed)}
    </Pressable>
  );
}

/** 틀린 카드 오른쪽 위 × (단어 카드 · 짝 맞추기 카드가 같이 써요) */
export function WrongBadge() {
  return (
    <View style={styles.badge} pointerEvents="none">
      <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={Colors.white} strokeWidth={3.6} strokeLinecap="round">
        <Path d="M7 7l10 10M17 7 7 17" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.ink,
    borderBottomWidth: 5,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  down: { borderBottomWidth: 2, marginTop: 3 },
  linked: { backgroundColor: Colors.yellow },
  lit: { backgroundColor: Colors.yellow },
  hintStill: { borderWidth: 3, borderBottomWidth: 5 },
  ring: { position: 'absolute', top: -6, left: -6, right: -6, bottom: -3, borderRadius: 18, backgroundColor: 'rgba(255, 226, 0, 0.45)' },
  // 틀렸을 때: 분홍 바탕 · 점선 테두리 · 그림자 없이 눌린 모양 · 오른쪽 위 × (프로토타입 #lesson .sh-w.shake)
  wrong: { backgroundColor: Colors.matchBad, borderStyle: 'dashed', borderColor: Colors.matchBadLine, borderBottomWidth: 2, marginTop: 3 },
  badge: {
    position: 'absolute',
    top: -9,
    right: -9,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.white,
    backgroundColor: Colors.matchBadLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontFamily: Font.display, fontSize: 16, lineHeight: 20, letterSpacing: -0.2 },
  focus: { textDecorationLine: 'underline', textDecorationColor: PURPLE_LINE, textDecorationStyle: 'solid' },
});
