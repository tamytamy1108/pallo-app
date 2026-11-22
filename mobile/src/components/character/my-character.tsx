import { StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';

import { useMyAvatar } from '@/state/avatar';

import { AvatarChar } from './avatar';

/**
 * 내 캐릭터 (마이 › 꾸미기에서 저장한 모습). 홈 맵 · 라운지 · 랭킹 등 어디서든 이걸 써요.
 * 담당: 마이 A. 캐릭터는 원본 3D 그대로: 다시 그리지 않고 색 교체 · 좌우 반전만.
 *
 * size × size 네모 안에, 예전 기본 그림(my-default.png · 1087×896)을 contain 으로 넣었을 때와 같은 자리에 그려요
 * → 몸 상자 폭 = size × 520/543.4 · 왼쪽 0 · 위 30.16% (모자 · 깃발 자리까지 같은 크기로 보여요).
 * flip 은 저장한 좌우 방향을 한 번 더 뒤집어요. blink=false 면 깜빡임을 빼요 (따로 깜빡임을 그리는 화면용).
 * 몸 상자 크기를 직접 정하려면 AvatarChar(av, width) 를 써요 (@/components/character/avatar).
 */
export function MyCharacter({
  size = 96,
  flip = false,
  blink = true,
  style,
}: {
  size?: number;
  flip?: boolean;
  blink?: boolean;
  style?: StyleProp<ImageStyle | ViewStyle>;
}) {
  const av = useMyAvatar();
  const w = (size * 520) / 543.4;
  const flipped = av.flip !== flip;
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="내 캐릭터"
      style={StyleSheet.flatten([{ width: size, height: size }, style as ViewStyle])}>
      <AvatarChar av={av} width={w} flip={flipped} blink={blink} style={{ position: 'absolute', left: flipped ? size - w : 0, top: size * 0.3016 }} />
    </View>
  );
}
