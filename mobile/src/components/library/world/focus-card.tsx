import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

import type { FocusInfo } from './stage';

const SOON_LINE = '#9A93A6';

/** 아래 카드에 필요한 것만 (3D 지도 · 2D 지도가 같이 써요) */
export type CardInfo = Pick<FocusInfo, 'n' | 'st' | 'no' | 'k' | 'goT' | 'soonT'>;

const ZP_EASE = Easing.bezier(0.2, 0.9, 0.3, 1.2);

/** 눌러서 확대했을 때 아래 카드 (프로토타입 .m3-zp) */
export function FocusCard({ info, onGo, onClose }: { info: CardInfo | null; onGo: (no: number) => void; onClose: () => void }) {
  const [shown, setShown] = useState<CardInfo | null>(info);
  const p = useSharedValue(0);
  const reduced = useReducedMotion();
  // 닫히는 동안에도 마지막 카드를 보여 줘요 (그리는 중에 바로 기억)
  if (info && info !== shown) setShown(info);
  useEffect(() => {
    p.set(reduced ? (info ? 1 : 0) : withTiming(info ? 1 : 0, { duration: 350, easing: ZP_EASE }));
  }, [info, p, reduced]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - p.value) * 110 }] }));
  if (!shown) return null;
  const soon = shown.st === 'soon';
  const go = soon ? (shown.soonT ?? '곧 열려요') : (shown.goT ?? (shown.st === 'done' ? '다시 하기' : '장면 열기'));
  return (
    <Animated.View style={[styles.zp, style]} pointerEvents={info ? 'auto' : 'none'}>
      <View style={styles.zpT}>
        <PText style={styles.zpSmall} numberOfLines={1}>
          {shown.k ?? `${shown.no}번 장면`}
        </PText>
        <PText style={styles.zpB} numberOfLines={1}>
          {shown.n}
        </PText>
      </View>
      <Pressable onPress={() => onGo(shown.no)} accessibilityRole="button" accessibilityLabel={go} style={({ pressed }) => [styles.zpGo, soon && styles.zpGoSoon, pressed && styles.pressed]}>
        <PText style={[styles.zpGoText, soon && { color: '#8C8597' }]}>{go}</PText>
      </Pressable>
      <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="전체 보기" hitSlop={6} style={({ pressed }) => [styles.zpX, pressed && styles.pressed]}>
        <Svg width={14} height={14} viewBox="0 0 14 14">
          <Path d="M2 2l10 10M12 2L2 12" stroke={Colors.ink} strokeWidth={2.4} strokeLinecap="round" />
        </Svg>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // .m3-zp
  zp: { position: 'absolute', left: 12, right: 12, bottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingRight: 12, paddingLeft: 16, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, boxShadow: `3px 4px 0 ${Colors.ink}` },
  zpT: { flex: 1, minWidth: 0 },
  zpSmall: { fontFamily: Font.body900, fontSize: 11, lineHeight: 15, color: Colors.purple },
  zpB: { fontFamily: Font.body900, fontSize: 16, lineHeight: 22 },
  zpGo: { height: 40, paddingHorizontal: 16, borderRadius: 20, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow, justifyContent: 'center' },
  zpGoSoon: { backgroundColor: '#EFEAE0', borderStyle: 'dashed', borderColor: SOON_LINE },
  zpGoText: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18 },
  zpX: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  pressed: { transform: [{ scale: 0.96 }] },
});
