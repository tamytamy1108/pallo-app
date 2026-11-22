import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { css, cubicBezier } from 'react-native-reanimated';

import { Colors } from '@/constants/theme';

export const SHADOW_OFFSET = 4;

/**
 * 누르면 내용이 그림자 자리로 .15초 동안 쏙 내려앉아요 (프로토타입 .press:active — translate(4px,4px) · transition .15s var(--ease)).
 * 그림자 판은 그대로 두고 내용이 그 위를 덮어서, 그림자가 줄어드는 것처럼 보여요.
 */
export function Sink({ x, y, pressed, children }: { x: number; y: number; pressed: boolean; children: ReactNode }) {
  return <Animated.View style={[{ transform: [{ translateX: pressed ? x : 0 }, { translateY: pressed ? y : 0 }] }, sinkEase]}>{children}</Animated.View>;
}

const sinkEase = css.create({ t: { transitionProperty: 'transform', transitionDuration: '150ms', transitionTimingFunction: cubicBezier(0.16, 1, 0.3, 1) } }).t;

type Props = {
  radius: number;
  /** 눌린 상태: 내용이 그림자 자리로 내려앉아요. */
  pressed?: boolean;
  /** 그림자 없이 (비활성 · 고스트). */
  flat?: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/**
 * PALLO 하드 섀도 (프로토타입 `box-shadow: 4px 4px 0 ink`).
 * 안드로이드는 흐림 없는 그림자를 못 그려서, 잉크색 판을 4px 어긋나게 깔아 두 플랫폼 모두 똑같이 보이게 해요.
 */
export function Raised({ radius, pressed = false, flat = false, style, children }: Props) {
  return (
    <View style={StyleSheet.flatten([styles.wrap, style])}>
      {!flat && <View pointerEvents="none" style={[styles.shadow, { borderRadius: radius }]} />}
      <Sink x={SHADOW_OFFSET} y={SHADOW_OFFSET} pressed={pressed && !flat}>
        {children}
      </Sink>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginRight: SHADOW_OFFSET, marginBottom: SHADOW_OFFSET },
  shadow: { position: 'absolute', top: SHADOW_OFFSET, left: SHADOW_OFFSET, right: -SHADOW_OFFSET, bottom: -SHADOW_OFFSET, backgroundColor: Colors.ink },
});
