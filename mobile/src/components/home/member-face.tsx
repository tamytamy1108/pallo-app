import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';
import type { MemberBody } from '@/data/home';

const BODY = {
  pink: require('@/assets/images/home/up-pink.png'),
  sky: require('@/assets/images/home/up-sky.png'),
  purple: require('@/assets/images/home/up-purple.png'),
} as const;

/**
 * 다른 멤버 얼굴 (프로토타입 lgFace · .fc .lgf .av-char): 동그라미 안에 그 멤버가 꾸민 캐릭터 윗부분.
 * 원본 3D 그림의 색 교체본을 써요 (모자 · 머리 같은 꾸미기 아이템은 마이 꾸미기 담당이 그려 주면 바꿔요).
 */
export function MemberFace({ size, bg, body, ring = 2 }: { size: number; bg: string; body: MemberBody; ring?: number }) {
  const inner = size - ring * 2;
  // .av-char { left: -8%; width: 116%; top: 22% } · 몸 그림 520 × 332
  const w = inner * 1.16;
  return (
    <View style={StyleSheet.flatten([styles.face, { width: size, height: size, borderRadius: size / 2, borderWidth: ring, backgroundColor: bg }])} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Image source={BODY[body]} style={{ position: 'absolute', left: -inner * 0.08, top: inner * 0.22, width: w, height: (w * 332) / 520 }} contentFit="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  face: { borderColor: Colors.ink, overflow: 'hidden' },
});
