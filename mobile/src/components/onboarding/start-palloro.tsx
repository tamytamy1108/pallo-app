import { Image } from 'expo-image';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { Appear } from '@/components/ui/appear';
import { useOnboarding, type BodyColor } from '@/state/onboarding';

import { Bob } from './fx-motion';

/*
 * 내 팔로로: 캐릭터 고르기에서 고른 몸 색이 다음 화면부터 같이 다녀요.
 * 큰 캐릭터 자리에만 둬요: 연동 확인 중(link-wait) · 예약 확정 무대(done-stage). 양식 화면 · 진행 바에는 두지 않아요.
 */

/** 몸 색마다 그림 (av/body-*.png · 마이 › 꾸미기와 같은 그림) */
export const BODY_SRC: Record<BodyColor, number> = {
  yellow: require('@/assets/characters/av/body-yellow.png'),
  purple: require('@/assets/characters/av/body-purple.png'),
  'purple-lash': require('@/assets/characters/av/body-purple-lash.png'),
  pink: require('@/assets/characters/av/body-pink.png'),
  sky: require('@/assets/characters/av/body-sky.png'),
  green: require('@/assets/characters/av/body-green.png'),
  coral: require('@/assets/characters/av/body-coral.png'),
};

const isBody = (c: string): c is BodyColor => c in BODY_SRC;
/** 꾸민 몸 색(이름 또는 직접 고른 '#…')의 그림. 직접 고른 색이면 undefined (몸 그림이 색마다 따로 있어요) */
export const bodySrcOf = (color: string) => (isBody(color) ? BODY_SRC[color] : undefined);

/** 몸 그림 원본 520 × 332 */
export const BODY_RATIO = 332 / 520;

/** 지금 고른 내 팔로로 그림 */
export const useMyBody = () => BODY_SRC[useOnboarding((o) => o.color)];

/**
 * 내 팔로로 한 장 (폭 width · 높이는 그림 비율대로).
 * bob: 둥실 떠 있기 · hop: 나타날 때 아래에서 통 (delay 뒤). 움직임 줄이기면 가만히.
 */
export function MyPalloro({ width, bob, hop, delay = 0, style }: { width: number; bob?: boolean; hop?: boolean; delay?: number; style?: StyleProp<ViewStyle> }) {
  const src = useMyBody();
  const box = { width, height: Math.round(width * BODY_RATIO) };
  const img = <Image source={src} style={StyleSheet.absoluteFill} contentFit="contain" accessible={false} accessibilityIgnoresInvertColors />;
  const body = bob ? (
    <Bob amp={Math.max(3, width * 0.05)} ms={2600} tilt={2} style={box}>
      {img}
    </Bob>
  ) : (
    <View style={box}>{img}</View>
  );
  return hop ? (
    <Appear kind="reactHop" delay={delay} style={[box, style]}>
      {body}
    </Appear>
  ) : (
    <View style={[box, style]}>{body}</View>
  );
}
