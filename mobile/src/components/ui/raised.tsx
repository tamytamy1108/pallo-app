import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Colors } from '@/constants/theme';

export const SHADOW_OFFSET = 4;

type Props = {
  radius: number;
  /** 눌린 상태: 그림자가 사라지고 내용이 그림자 자리로 내려앉아요. */
  pressed?: boolean;
  /** 그림자 없이 (비활성 · 고스트). */
  flat?: boolean;
  style?: ViewStyle;
  children: ReactNode;
};

/**
 * PALLO 하드 섀도 (프로토타입 `box-shadow: 4px 4px 0 ink`).
 * 안드로이드는 흐림 없는 그림자를 못 그려서, 잉크색 판을 4px 어긋나게 깔아 두 플랫폼 모두 똑같이 보이게 해요.
 */
export function Raised({ radius, pressed = false, flat = false, style, children }: Props) {
  const shift = pressed && !flat ? SHADOW_OFFSET : 0;
  return (
    <View style={StyleSheet.flatten([styles.wrap, style])}>
      {!flat && !pressed && (
        <View pointerEvents="none" style={[styles.shadow, { borderRadius: radius }]} />
      )}
      <View style={{ transform: [{ translateX: shift }, { translateY: shift }] }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginRight: SHADOW_OFFSET, marginBottom: SHADOW_OFFSET },
  shadow: { position: 'absolute', top: SHADOW_OFFSET, left: SHADOW_OFFSET, right: -SHADOW_OFFSET, bottom: -SHADOW_OFFSET, backgroundColor: Colors.ink },
});
