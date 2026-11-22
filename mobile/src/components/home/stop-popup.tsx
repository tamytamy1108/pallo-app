import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { css, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import type { LESSON_STEPS } from '@/data/mock';
import { useIsDone, useSavedPos } from '@/state/progress';

import { CLOSE_PATH, CoinIcon, LineIcon } from './icons';
import { WideButton } from './parts';

type Step = (typeof LESSON_STEPS)[number];
export type StartMode = 'start' | 'resume' | 'restart';

/**
 * 정류장을 누르면 가운데 팝업 (프로토타입 stepPopup · .np-m · .np-c).
 * 처음: 팔로 · 단계 이름 · +포인트 → [시작하기!] / 하다 멈춤: 하던 곳 → [이어서 하기] · [처음부터 하기] / 끝냄: [다시 하기].
 * 어두운 바탕 · X · 바깥을 누르면 닫혀요.
 */
export function StopPopup({
  step,
  kicker,
  stepKeyText,
  onClose,
  onGo,
}: {
  step: Step | null;
  /** '예습 · 1-1' */
  kicker: string;
  /** 진도 키 (state/progress stepKey) */
  stepKeyText: string;
  onClose: () => void;
  onGo: (mode: StartMode) => void;
}) {
  const still = useReducedMotion();
  const [shown, setShown] = useState<Step | null>(step);
  const p = useSharedValue(0);
  const done = useIsDone(stepKeyText);
  const pos = useSavedPos(stepKeyText);
  const resume = pos !== undefined;

  // 팝업에 보일 단계: 닫히는 동안에도 그대로 남겨요
  if (step && step !== shown) setShown(step);

  useEffect(() => {
    if (step) {
      p.set(0);
      p.set(withTiming(1, { duration: still ? 0 : 250 }));
    }
  }, [step, still, p]);

  const close = () => {
    p.set(withTiming(0, { duration: still ? 0 : 200 }));
    setTimeout(onClose, still ? 0 : 200);
  };

  // .np-m: 바탕 .2초 · .np-c: cubic-bezier(.3, 1.4, .5, 1) .25초로 톡 커지며 (투명도는 .15초)
  const dim = useAnimatedStyle(() => ({ opacity: p.get() }));
  const card = useAnimatedStyle(() => ({ opacity: Math.min(p.get() * 1.7, 1), transform: [{ scale: 0.9 + 0.1 * POP(p.get()) }] }));

  if (!shown) return null;
  return (
    <Modal visible={!!step} transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.dim, dim]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityRole="button" accessibilityLabel="닫기" />
        </Animated.View>
        <Animated.View style={[styles.cardWrap, card]} accessibilityViewIsModal accessibilityLabel={shown.title}>
          <View style={styles.shadow} />
          <View style={styles.card}>
            <Image
              source={done && !resume ? require('@/assets/characters/c-tilted-yellow.png') : require('@/assets/characters/c-upright-yellow.png')}
              style={done && !resume ? styles.charTilted : styles.char}
              contentFit="contain"
            />
            <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="닫기" style={styles.x} hitSlop={6}>
              <LineIcon d={CLOSE_PATH} size={18} width={2.8} />
            </Pressable>
            <PText style={styles.kicker} color={Colors.inkSub}>
              {kicker}
            </PText>
            <PText style={styles.title}>{shown.title}</PText>
            {resume ? (
              // 프로토타입: 문제 수를 알면 'n/전체까지 했어요' + 진행 막대, 모르면 '하던 곳이 있어요'
              <PText style={styles.small} color={Colors.inkSub}>
                하던 곳이 있어요
              </PText>
            ) : done ? (
              <PText style={styles.small} color={Colors.inkSub}>
                완료했어요
              </PText>
            ) : (
              <PointBob still={still} xp={shown.xp} />
            )}
            {resume ? (
              <>
                <WideButton label="이어서 하기" onPress={() => onGo('resume')} style={styles.btn} />
                <Pressable onPress={() => onGo('restart')} accessibilityRole="button" style={({ pressed }) => StyleSheet.flatten([styles.again, pressed && styles.againPressed])}>
                  <PText style={styles.againText}>처음부터 하기</PText>
                </Pressable>
              </>
            ) : (
              <WideButton label={done ? '다시 하기' : '시작하기!'} onPress={() => onGo('start')} style={styles.btn} />
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const POP = Easing.bezierFn(0.3, 1.4, 0.5, 1);

/** npPt 1.8초: 포인트가 살짝 위아래로 */
const bob = css.keyframes({ '0%, 100%': { transform: [{ translateY: 0 }] }, '50%': { transform: [{ translateY: -2 }] } });
function PointBob({ xp, still }: { xp: number; still: boolean }) {
  return (
    <Animated.View
      style={[styles.pt, still ? null : { animationName: bob, animationDuration: '1800ms', animationIterationCount: 'infinite', animationTimingFunction: 'ease-in-out' }]}
      accessible
      accessibilityLabel={`포인트 ${xp}점`}>
      <View style={styles.coin}>
        <CoinIcon size={30} />
      </View>
      <PText style={styles.ptText}>+{xp}P</PText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  dim: { backgroundColor: 'rgba(30,26,43,0.5)' },
  cardWrap: { width: '100%', maxWidth: 320 },
  shadow: { position: 'absolute', left: 0, right: 0, top: 6, bottom: -6, borderRadius: 28, backgroundColor: Colors.ink },
  card: { alignItems: 'stretch', gap: 6, paddingHorizontal: 20, paddingBottom: 16, borderWidth: 2.5, borderColor: Colors.ink, borderRadius: 28, backgroundColor: Colors.white },
  char: { width: 112, height: (112 * 306) / 480, alignSelf: 'center', marginTop: -54, marginBottom: 2 },
  charTilted: { width: 112, height: (112 * 350) / 480, alignSelf: 'center', marginTop: -54, marginBottom: 2 },
  x: { position: 'absolute', top: 12, right: 12, width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  kicker: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17, textAlign: 'center' },
  title: { fontFamily: Font.body900, fontSize: 21, lineHeight: 28, textAlign: 'center' },
  small: { marginBottom: 8, fontFamily: Font.body700, fontSize: 13.5, lineHeight: 19, textAlign: 'center' },
  pt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 2, marginBottom: 10, alignSelf: 'center' },
  coin: { filter: [{ dropShadow: { offsetX: 0, offsetY: 2, standardDeviation: 0, color: 'rgba(30,26,43,0.18)' } }] },
  ptText: { fontFamily: Font.display, fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  btn: { marginRight: 4, marginBottom: 4 },
  again: { height: 60, borderRadius: 30, borderWidth: 2, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  againPressed: { backgroundColor: 'rgba(30,26,43,0.06)' },
  againText: { fontFamily: Font.body800, fontSize: 15, lineHeight: 20 },
});
