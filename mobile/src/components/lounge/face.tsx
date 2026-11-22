import { Image } from 'expo-image';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Colors } from '@/constants/theme';
import { ME } from '@/data/mock';

/*
 * 멤버 얼굴 동그라미 (프로토타입 .lg-av + lgFace).
 * 프로토타입이 그린 멤버 캐릭터(원본 3D PNG + 꾸미기 아이템)를 그대로 찍어 둔 그림이에요 — 다시 그리지 않아요.
 * 꾸미기를 바꾸면 달라지는 '내 얼굴'은 마이 담당 꾸미기 상태가 생기면 그걸로 바꿔요.
 */
const FACES: Record<string, number> = {
  Tammy: require('@/assets/images/lounge/faces/tammy.png'),
  하나: require('@/assets/images/lounge/faces/hana.png'),
  Leo: require('@/assets/images/lounge/faces/leo.png'),
  예린: require('@/assets/images/lounge/faces/yerin.png'),
  소라: require('@/assets/images/lounge/faces/sora.png'),
  태오: require('@/assets/images/lounge/faces/taeo.png'),
  Kenji: require('@/assets/images/lounge/faces/kenji.png'),
  지우: require('@/assets/images/lounge/faces/jiu.png'),
  도윤: require('@/assets/images/lounge/faces/doyun.png'),
  유키: require('@/assets/images/lounge/faces/yuki.png'),
  Jay: require('@/assets/images/lounge/faces/jay.png'),
  민준: require('@/assets/images/lounge/faces/minjun.png'),
  PALLO: require('@/assets/images/lounge/faces/pallo.png'),
  수아: require('@/assets/images/lounge/faces/sua.png'),
  민서: require('@/assets/images/lounge/faces/minseo.png'),
  하람: require('@/assets/images/lounge/faces/haram.png'),
  서준: require('@/assets/images/lounge/faces/seojun.png'),
  다온: require('@/assets/images/lounge/faces/daon.png'),
  라파: require('@/assets/images/lounge/faces/rapa.png'),
  M: require('@/assets/images/lounge/faces/m.png'),
  S: require('@/assets/images/lounge/faces/s.png'),
};

/** 얼굴 그림만 (동그라미 안을 꽉 채워요) */
export function FaceImage({ name, size }: { name: string; size: number }) {
  return <Image source={FACES[name] ?? FACES[ME.name]} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" accessibilityIgnoresInvertColors />;
}

/** 프로필 동그라미: 바깥 바탕색(멤버 색) · 잉크 테두리 2px · 안에 얼굴 */
export function Face({ name, size = 36, bg = Colors.yellow, border = 2, style }: { name: string; size?: number; bg?: string; border?: number; style?: ViewStyle }) {
  return (
    <View style={StyleSheet.flatten([{ width: size, height: size, borderRadius: size / 2, borderWidth: border, borderColor: Colors.ink, backgroundColor: bg, overflow: 'hidden' }, style])}>
      <FaceImage name={name} size={size - border * 2} />
    </View>
  );
}
