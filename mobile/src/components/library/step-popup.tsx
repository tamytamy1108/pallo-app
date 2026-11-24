import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { Pressable } from '@/components/ui/pressable';
import { Button } from '@/components/ui/button';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { LayerModal } from '@/components/ui/sheet-stack';

export type StepPopupInfo = {
  /** '예습 · 1' */
  kick: string;
  title: string;
  xp: number;
  done: boolean;
  /** 멈춘 곳 (useSavedPos) — 있으면 '이어서 하기 / 처음부터 하기' */
  pos?: number;
};

/** 포인트 동전 (프로토타입 ICONS.coin) */
const SYMBOL =
  'M374.44,140.26h-62.65l40.05-59.4c16.01-23.75,9.74-55.98-14.01-71.99h0c-23.75-16.01-55.98-9.74-71.99,14.01l-54.77,81.24-42.86-63.57c-16.01-23.75-48.24-30.02-71.99-14.01h0c-23.75,16.01-30.02,48.24-14.01,71.99l28.13,41.73h-58.47c-28.64,0-51.86,23.22-51.86,51.86h0c0,28.64,23.22,51.86,51.86,51.86h64.91s-35.8,53.1-35.8,53.1c-16.01,23.75-9.74,55.98,14.01,71.99h0c23.75,16.01,55.98,9.74,71.99-14.01l44.08-65.39,36.42,54.03c16.01,23.75,48.24,30.02,71.99,14.01h0c23.75-16.01,30.02-48.24,14.01-71.99l-28.13-41.73h69.09c28.64,0,51.86-23.22,51.86-51.86h0c0-28.64-23.22-51.86-51.86-51.86Z';
function Coin({ size = 30 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Circle cx={24} cy={24} r={19} fill={Colors.yellow} stroke={Colors.ink} strokeWidth={2.8} />
      <Circle cx={24} cy={24} r={13.5} fill="none" stroke={Colors.ink} strokeWidth={1.6} />
      <Svg x={13.48} y={14.98} width={21.03} height={18.77} viewBox="-11 -11 448.31 399.94">
        <Path fill={Colors.purple} stroke={Colors.ink} strokeWidth={22} d={SYMBOL} />
      </Svg>
    </Svg>
  );
}

/**
 * 단계 시작 창 (프로토타입 stepPopup · .np-m): 캐릭터가 위로 빼꼼 · 단계 이름 · +P.
 * 멈춘 곳이 있으면 [이어서 하기] [처음부터 하기], 끝낸 단계면 [다시 하기].
 */
export function StepPopup({ info, onClose, onGo }: { info: StepPopupInfo | null; onClose: () => void; onGo: (mode: 'start' | 'resume' | 'restart') => void }) {
  const still = useReducedMotion();
  const p = useSharedValue(0);
  const bob = useSharedValue(0);
  useEffect(() => {
    if (!info) return;
    p.set(0);
    p.set(still ? 1 : withTiming(1, { duration: 250, easing: Easing.bezier(0.3, 1.4, 0.5, 1) }));
    if (!still) bob.set(withRepeat(withSequence(withTiming(-2, { duration: 900, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 900, easing: Easing.inOut(Easing.ease) })), -1));
  }, [info, p, bob, still]);
  const dim = useAnimatedStyle(() => ({ backgroundColor: `rgba(30,26,43,${0.5 * Math.min(1, p.value * 1.6)})` }));
  const card = useAnimatedStyle(() => ({ opacity: Math.min(1, p.value * 1.7), transform: [{ scale: 0.9 + 0.1 * p.value }] }));
  const pt = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));
  if (!info) return null;
  const resume = info.pos !== undefined;
  const tilted = info.done && !resume;
  return (
    <LayerModal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.m, dim]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="닫기" />
        <Animated.View style={[styles.c, card]} accessibilityViewIsModal accessibilityLabel={info.title}>
          <Image source={tilted ? require('@/assets/characters/c-tilted-yellow.png') : require('@/assets/characters/c-upright-yellow.png')} style={[styles.img, { height: 112 * (tilted ? 350 / 480 : 306 / 480) }]} contentFit="contain" />
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="닫기" style={styles.x} hitSlop={6}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={Colors.ink} strokeWidth={2.8} strokeLinecap="round">
              <Path d="M6 6l12 12M18 6 6 18" />
            </Svg>
          </Pressable>
          <PText style={styles.k}>{info.kick}</PText>
          <PText style={styles.b}>{info.title}</PText>
          {resume ? (
            <PText style={styles.small}>하던 곳이 있어요</PText>
          ) : info.done ? (
            <PText style={styles.small}>완료했어요</PText>
          ) : (
            <Animated.View style={[styles.pt, pt]} accessibilityLabel={`포인트 ${info.xp}점`}>
              <Coin />
              <PText style={styles.ptText}>+{info.xp}P</PText>
            </Animated.View>
          )}
          <View style={styles.btns}>
            {resume ? (
              <>
                <Button wide label="이어서 하기" onPress={() => onGo('resume')} />
                <Pressable onPress={() => onGo('restart')} accessibilityRole="button" style={({ pressed }) => [styles.skip, pressed && styles.pressed]}>
                  <PText style={styles.skipText}>처음부터 하기</PText>
                </Pressable>
              </>
            ) : (
              <Button wide label={info.done ? '다시 하기' : '시작하기!'} onPress={() => onGo('start')} />
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </LayerModal>
  );
}

const styles = StyleSheet.create({
  m: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  c: { width: '100%', maxWidth: 320, gap: 6, paddingHorizontal: 20, paddingBottom: 16, borderWidth: 2.5, borderColor: Colors.ink, borderRadius: 28, backgroundColor: Colors.white, boxShadow: `0 6px 0 ${Colors.ink}`, alignItems: 'stretch' },
  img: { width: 112, marginTop: -54, marginBottom: 2, alignSelf: 'center' },
  x: { position: 'absolute', top: 12, right: 12, width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  k: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17, color: Colors.inkSub, textAlign: 'center' },
  b: { fontFamily: Font.body900, fontSize: 21, lineHeight: 28, textAlign: 'center' },
  small: { marginBottom: 8, fontFamily: Font.body700, fontSize: 13.5, lineHeight: 19, color: Colors.inkSub, textAlign: 'center' },
  pt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 2, marginBottom: 10 },
  ptText: { fontFamily: Font.display, fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  btns: { gap: 6 },
  skip: { height: 60, borderRadius: 30, borderWidth: 2, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  skipText: { fontFamily: Font.body800, fontSize: 15, lineHeight: 20 },
  pressed: { transform: [{ scale: 0.98 }] },
});
