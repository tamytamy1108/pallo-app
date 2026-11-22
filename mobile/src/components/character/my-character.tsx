import { Image, type ImageStyle } from 'expo-image';
import { StyleSheet } from 'react-native';

/**
 * 내 캐릭터 (마이 › 꾸미기에서 고른 모습). 홈 맵 · 라운지 · 랭킹 등 어디서든 이걸 써요.
 * 담당: 마이 A — 꾸미기 상태를 읽어 그려요. 지금은 기본 모습 그림.
 * 캐릭터는 원본 3D 그대로: 다시 그리지 않고 색 교체 · 좌우 반전만.
 */
export function MyCharacter({ size = 96, flip = false, style }: { size?: number; flip?: boolean; style?: ImageStyle }) {
  return (
    <Image
      source={require('@/assets/characters/my-default.png')}
      style={StyleSheet.flatten([{ width: size, height: size, transform: [{ scaleX: flip ? -1 : 1 }] }, style])}
      contentFit="contain"
      accessibilityLabel="내 캐릭터"
    />
  );
}
