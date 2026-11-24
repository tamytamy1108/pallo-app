import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle } from 'react-native-reanimated';

import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { isPre, type Challenge } from '@/data/challenge';
import { kfc, useLoop } from '@/lib/motion';

import { Sparkle } from './icons';
import { LgBtn, SUB } from './parts';

/** chTw 1.8s ease-in-out — 키프레임 구간마다 */
const TW_EASE = Easing.bezierFn(0.42, 0, 0.58, 1);

/**
 * 참여하자마자 응원 시트 (프로토타입 chCheer): 팔로 + '챌린지 성공을 응원해요!' + 이름 → [나중에 할게요] [바로 인증하러 가기].
 * 곧 시작하는 챌린지는 '도전 신청 완료!' + 시작하면 알림 → [좋아요].
 */
export function CheerSheet({ p, open, onClose, onGo, onClosed }: { p: Challenge; open: boolean; onClose: () => void; onGo: () => void; onClosed?: () => void }) {
  const pre = isPre(p);
  const btn = (label: string, tone: 'white' | 'yellow', onPress: () => void) => <LgBtn label={label} tone={tone} onPress={onPress} height={50} fontSize={15} wide />;
  return (
    <Sheet
      open={open}
      onClose={onClose}
      onClosed={onClosed}
      label="챌린지 참여 완료">
      <View style={styles.cheer}>
        <View style={styles.art}>
          <Hop>
            <Image source={require('@/assets/images/challenge/c-upright-yellow.png')} style={styles.charImg} contentFit="contain" accessibilityElementsHidden />
          </Hop>
          <Twinkle style={styles.s1} size={18} color={Colors.yellow} delay={0} />
          <Twinkle style={styles.s2} size={12} color={Colors.rosePink} delay={400} />
          <Twinkle style={styles.s3} size={10} color={Colors.sky} delay={800} />
        </View>
        <PText style={styles.h2} accessibilityRole="header">
          {pre ? '도전 신청 완료!' : '챌린지 성공을 응원해요!'}
        </PText>
        <PText style={styles.p}>{pre ? `${p.name}\n${p.start}하면 알림으로 알려 드릴게요.` : p.name}</PText>
      </View>
      {/* .lg-sbtns: 시트 안 버튼 줄 (위 선 없이) */}
      <View style={styles.btns}>
        {pre ? (
          <View style={styles.slot}>{btn('좋아요', 'yellow', onClose)}</View>
        ) : (
          <>
            <View style={styles.slot}>{btn('나중에 할게요', 'white', onClose)}</View>
            <View style={styles.slot}>{btn('바로 인증하러 가기', 'yellow', onGo)}</View>
          </>
        )}
      </View>
    </Sheet>
  );
}

/** 팔로가 신나서 통통 뛰어요: 쭈그렸다 → 위로 점프(살짝 늘어남) → 착지 · 1.2초마다 */
function Hop({ children }: { children: ReactNode }) {
  const t = useLoop(1200);
  const anim = useAnimatedStyle(() => {
    const v = t.get();
    return {
      transform: [
        { translateY: kfc(v, [0, 18, 50, 82, 100], [0, 2, -16, 0, 0], TW_EASE) },
        { scaleX: kfc(v, [0, 18, 50, 82, 92, 100], [1, 1.08, 0.95, 1.06, 1, 1], TW_EASE) },
        { scaleY: kfc(v, [0, 18, 50, 82, 92, 100], [1, 0.9, 1.06, 0.93, 1, 1], TW_EASE) },
      ],
    };
  });
  return <Animated.View style={[styles.char, anim]}>{children}</Animated.View>;
}

/** @keyframes chTw: 1.8초마다 커졌다 돌았다 (scale 1.35 · 20도) */
function Twinkle({ size, color, delay, style }: { size: number; color: string; delay: number; style: object }) {
  const t = useLoop(1800, { delay });
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: kfc(t.get(), [0, 50, 100], [1, 1.35, 1], TW_EASE) }, { rotate: `${kfc(t.get(), [0, 50, 100], [0, 20, 0], TW_EASE)}deg` }],
  }));
  return (
    <Animated.View style={[styles.tw, style, anim]}>
      <Sparkle size={size} color={color} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cheer: { alignItems: 'center', paddingTop: 6, paddingHorizontal: 4, paddingBottom: 4 },
  art: { width: 132, height: 120, marginBottom: 4 },
  char: { position: 'absolute', left: 4, bottom: 0, width: 124, height: 124 * (306 / 480) },
  charImg: { width: '100%', height: '100%' },
  tw: { position: 'absolute' },
  btns: { flexDirection: 'row', gap: 10 },
  slot: { flex: 1 },
  s1: { left: -14, top: 10 },
  s2: { right: -8, top: 28 },
  s3: { right: 4, bottom: 6 },
  h2: { marginTop: 14, marginBottom: 6, fontFamily: Font.display, fontSize: 21, lineHeight: 28, letterSpacing: -0.5, textAlign: 'center' },
  p: { marginBottom: 16, fontFamily: Font.body700, fontSize: 13.5, lineHeight: 21.6, color: SUB, textAlign: 'center' },
});
