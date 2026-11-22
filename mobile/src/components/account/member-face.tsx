import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { MyCharacter } from '@/components/character/my-character';
import { Colors } from '@/constants/theme';

// 원본 3D 캐릭터 몸 색 PNG (프로토타입 assets/av/up-*.png) — 다시 그리지 않고 색만 바꾼 원본을 써요
const BODIES = [
  require('@/assets/images/account/up-yellow.png'),
  require('@/assets/images/account/up-purple.png'),
  require('@/assets/images/account/up-pink.png'),
  require('@/assets/images/account/up-sky.png'),
  require('@/assets/images/account/up-green.png'),
  require('@/assets/images/account/up-coral.png'),
];

/**
 * 멤버 얼굴 동그라미 (프로토타입 .lg-av .lgf — 그 멤버 캐릭터를 얼굴 쪽으로 크게).
 * 다른 멤버의 꾸민 모습은 아직 서버에 없어서, 이름으로 늘 같은 몸 색을 골라요. me 면 내 캐릭터.
 */
export function MemberFace({ name, color, size = 34, me = false }: { name: string; color: string; size?: number; me?: boolean }) {
  const h = [...name].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const w = size * 1.7;
  return (
    <View style={[styles.face, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]} accessibilityLabel={name}>
      {me ? (
        <MyCharacter size={size * 1.25} style={{ marginTop: size * 0.12 }} />
      ) : (
        <Image source={BODIES[h % BODIES.length]} style={{ width: w, height: (w * 332) / 520, marginTop: size * 0.18, transform: [{ scaleX: h % 2 ? -1 : 1 }] }} contentFit="contain" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  face: { borderWidth: 2, borderColor: Colors.ink, overflow: 'hidden', alignItems: 'center' },
});
