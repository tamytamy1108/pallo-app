import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { POP } from '@/components/onboarding/fx-motion';
import { NextButton, OnbScreen } from '@/components/onboarding/parts';
import { NameStage } from '@/components/onboarding/start-stage';
import { Pressable } from '@/components/ui/pressable';
import { Colors } from '@/constants/theme';
import { sfx } from '@/lib/feedback';
import { kf, kfc } from '@/lib/motion';
import { getOnboarding, stepsFor, updateOnboarding, useOnboarding, type BodyColor } from '@/state/onboarding';

/** 몸 색 7가지 (마이 › 꾸미기의 기본 몸 색과 같은 그림). tint: 무대 조명을 물들이는 색 (어두운 무대에서 보이게 밝게) */
const BODIES: { id: BodyColor; name: string; src: number; tint: string }[] = [
  { id: 'yellow', name: '노랑', src: require('@/assets/characters/av/body-yellow.png'), tint: '#E0D121' },
  { id: 'purple', name: '보라', src: require('@/assets/characters/av/body-purple.png'), tint: '#A88BEA' },
  { id: 'purple-lash', name: '보라 속눈썹', src: require('@/assets/characters/av/body-purple-lash.png'), tint: '#A88BEA' },
  { id: 'pink', name: '핑크', src: require('@/assets/characters/av/body-pink.png'), tint: '#F49BBE' },
  { id: 'sky', name: '하늘', src: require('@/assets/characters/av/body-sky.png'), tint: '#8DB6F2' },
  { id: 'green', name: '초록', src: require('@/assets/characters/av/body-green.png'), tint: '#93D67E' },
  { id: 'coral', name: '코랄', src: require('@/assets/characters/av/body-coral.png'), tint: '#FF9E80' },
];

/** 몸 그림 원본 520 × 332 */
const BODY_RATIO = 332 / 520;
const COLS = 4;
const GAP = 12;

/**
 * 가입 2단계 · 캐릭터 몸 색 (시안 3장 '캐릭터 고르기').
 * 닉네임 화면과 같은 무대 카드에서 색만 바꿔 봐요. 7가지 중 하나, 옷 · 소품은 나중에 마이 › 꾸미기에서.
 */
export default function CharacterScreen() {
  const path = useOnboarding((s) => s.path);
  const nickname = useOnboarding((s) => s.nickname);
  const [color, setColor] = useState<BodyColor>(() => getOnboarding().color);
  const [gridW, setGridW] = useState(0);
  const picked = BODIES.find((b) => b.id === color) ?? BODIES[0];
  const tileW = gridW ? Math.floor((gridW - GAP * (COLS - 1)) / COLS) : 0;

  const next = () => {
    updateOnboarding({ color });
    router.push('/onboarding/member');
  };

  return (
    <OnbScreen step={2} total={stepsFor(path)} title={`${nickname}님의 팔로로를\n골라요`} footer={<NextButton label="이 팔로로로 할래요" onPress={next} />}>
      <View style={styles.stage}>
        <NameStage kind="character" name={nickname} hero={picked.src} swapKey={color} tint={picked.tint} label={`고른 팔로로: ${picked.name}. HELLO, ${nickname}!`} />
      </View>

      <View style={styles.grid} onLayout={(e) => setGridW(e.nativeEvent.layout.width)} accessibilityRole="radiogroup" accessibilityLabel="팔로로 몸 색">
        {tileW
          ? BODIES.map((b) => {
              const on = b.id === color;
              // 시안: 칸 폭의 1.55배 그림을 위쪽에 맞춰 얼굴 · 팔만 보이게 잘라요
              const imgW = tileW * 1.55;
              return (
                <Pressable
                  key={b.id}
                  onPress={() => {
                    sfx('pick');
                    setColor(b.id);
                  }}
                  accessibilityRole="radio"
                  accessibilityLabel={`${b.name} 팔로로`}
                  accessibilityState={{ checked: on }}
                  style={{ width: tileW }}>
                  {({ pressed }) => (
                    <View style={[styles.tileWrap, pressed && styles.pressed]}>
                      {on ? <SpringRing /> : null}
                      <View style={[styles.tile, { height: tileW * 0.98 }, on && styles.tileOn]}>
                        <Image
                          source={b.src}
                          style={{ position: 'absolute', top: tileW * 0.1, left: (tileW - 4 - imgW) / 2, width: imgW, height: imgW * BODY_RATIO }}
                          contentFit="contain"
                          accessibilityIgnoresInvertColors
                        />
                      </View>
                    </View>
                  )}
                </Pressable>
              );
            })
          : null}
      </View>
    </OnbScreen>
  );
}

/** 고른 칸의 보라 바깥 링: 나타날 때 크게 벌어졌다가 출렁 제자리로 (스프링) */
function SpringRing() {
  const still = useReducedMotion();
  const p = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (!still) p.set(withTiming(1, { duration: 520, easing: Easing.linear }));
  }, [still, p]);
  const anim = useAnimatedStyle(() => ({
    opacity: kf(p.get(), [0, 20, 100], [0, 1, 1]),
    transform: [{ scale: kfc(p.get(), [0, 45, 72, 100], [1.18, 0.96, 1.02, 1], POP) }],
  }));
  return <Animated.View pointerEvents="none" style={[styles.ring, anim]} />;
}

const styles = StyleSheet.create({
  stage: { marginTop: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, marginTop: 20 },
  tileWrap: { position: 'relative' },
  tile: { borderRadius: 20, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, overflow: 'hidden' },
  tileOn: { borderColor: Colors.purple, backgroundColor: Colors.lavender },
  // 고른 칸: 보라 바깥 링 (시안 outline 3px · offset 1px)
  ring: { position: 'absolute', top: -4, left: -4, right: -4, bottom: -4, borderRadius: 24, borderWidth: 3, borderColor: Colors.purple },
  pressed: { transform: [{ scale: 0.96 }] },
});
