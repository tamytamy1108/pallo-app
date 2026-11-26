import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import type { Pallolo } from '@/api/onboarding';
import { useAssetCatalog } from '@/api/use-onboarding';
import { POP } from '@/components/onboarding/fx-motion';
import { NextButton, OnbScreen } from '@/components/onboarding/parts';
import { bodySrcOf } from '@/components/onboarding/start-palloro';
import { NameStage } from '@/components/onboarding/start-stage';
import { Pressable } from '@/components/ui/pressable';
import { ErrorState, LoadingState } from '@/components/ui/state-view';
import { Colors } from '@/constants/theme';
import { sfx } from '@/lib/feedback';
import { kf, kfc } from '@/lib/motion';
import { getOnboarding, stepsFor, updateOnboarding, useOnboarding, type BodyColor } from '@/state/onboarding';

/** 칸 하나: 서버 팔로로 + 그릴 그림 (앱에 같은 몸 색 그림이 있으면 그걸, 없으면 서버 그림 주소) */
type Body = { code: string; name: string; tint: string; src: number | { uri: string }; local: BodyColor | null };
const toBody = (p: Pallolo): Body => {
  const local = bodySrcOf(p.code);
  return { code: p.code, name: p.name, tint: p.tint, src: local ?? { uri: p.imageUrl }, local: local ? (p.code as BodyColor) : null };
};

/** 몸 그림 원본 520 × 332 */
const BODY_RATIO = 332 / 520;
const COLS = 4;
const GAP = 12;

/**
 * 가입 2단계 · 캐릭터 몸 색 (시안 3장 '캐릭터 고르기').
 * 닉네임 화면과 같은 무대 카드에서 색만 바꿔 봐요. 고를 수 있는 팔로로는 서버 에셋 카탈로그 (GET /asset-catalog · 화면 순서 · 기본 하나),
 * 고른 code 는 가입 완료(POST /onboarding palloloCode)로 보내요. 옷 · 소품은 나중에 마이 › 꾸미기에서.
 */
export default function CharacterScreen() {
  const path = useOnboarding((s) => s.path);
  const nickname = useOnboarding((s) => s.nickname);
  const catalog = useAssetCatalog();
  const [code, setCode] = useState(() => getOnboarding().palloloCode);
  const [gridW, setGridW] = useState(0);
  const bodies = (catalog.data?.pallolos ?? []).map(toBody);
  // 고른 게 없거나 카탈로그에서 빠졌으면 기본 팔로로 (없으면 첫 칸)
  const fallback = catalog.data?.pallolos.find((p) => p.isDefault)?.code ?? bodies[0]?.code;
  const picked = bodies.find((b) => b.code === code) ?? bodies.find((b) => b.code === fallback);
  const tileW = gridW ? Math.floor((gridW - GAP * (COLS - 1)) / COLS) : 0;

  const next = () => {
    if (!picked) return;
    updateOnboarding({ palloloCode: picked.code, ...(picked.local ? { color: picked.local } : {}) });
    router.push('/onboarding/member');
  };

  return (
    <OnbScreen step={2} total={stepsFor(path)} title={`${nickname}님의 팔로로를\n골라요`} footer={<NextButton label="이 팔로로로 할래요" onPress={next} ready={!!picked} />}>
      {catalog.isPending ? (
        <LoadingState />
      ) : catalog.isError ? (
        <ErrorState onRetry={() => catalog.refetch()} />
      ) : picked ? (
        <View style={styles.stage}>
          <NameStage kind="character" name={nickname} hero={picked.src} swapKey={picked.code} tint={picked.tint} label={`고른 팔로로: ${picked.name}. HELLO, ${nickname}!`} />
        </View>
      ) : null}

      <View style={styles.grid} onLayout={(e) => setGridW(e.nativeEvent.layout.width)} accessibilityRole="radiogroup" accessibilityLabel="팔로로 몸 색">
        {tileW
          ? bodies.map((b) => {
              const on = b.code === picked?.code;
              // 시안: 칸 폭의 1.55배 그림을 위쪽에 맞춰 얼굴 · 팔만 보이게 잘라요
              const imgW = tileW * 1.55;
              return (
                <Pressable
                  key={b.code}
                  onPress={() => {
                    sfx('pick');
                    setCode(b.code);
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
