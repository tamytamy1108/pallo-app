import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { css, cubicBezier } from 'react-native-reanimated';

import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

/**
 * 학습 화면 아래 알약 버튼 하나 (프로토타입 #lesson .ls-foot .btn · #stBody .st-foot .btn).
 * Lv.1·2 · Lv.3·4 · 상황 장면이 모두 이 모양을 써요: 높이 54 · 둥글기 27 · 테두리 2.5 · 아래 잉크 그림자 5.
 * 누르면 0.15초 동안 4 내려앉고(프로토타입 .press · --ease), 꺼지면 회색에 그림자가 없어요.
 */
export const STUDY_BTN = { height: 54, radius: 27, border: 2.5, drop: 5, press: 4 } as const;

const OFF = { bg: '#EEE8DA', line: '#B9B2A3', ink: '#8C8597' } as const;

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** 바탕색 (기본 노랑) */
  bg?: string;
  textColor?: string;
  /** 흰 버튼처럼 글씨를 조금 작게 (15) */
  small?: boolean;
  /** 좁은 줄에서 옆 여백을 줄여요 */
  compact?: boolean;
  left?: ReactNode;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function StudyButton({ label, onPress, disabled = false, bg = Colors.yellow, textColor = Colors.ink, small = false, compact = false, left, right, style, accessibilityLabel }: Props) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} accessibilityState={{ disabled }} style={style}>
      {({ pressed }) => (
        <Animated.View
          style={[
            press,
            styles.pill,
            { backgroundColor: bg, paddingHorizontal: compact ? 14 : small ? 20 : 22 },
            disabled && styles.off,
            pressed && !disabled && styles.down,
          ]}>
          {left}
          <PText style={small ? styles.smallText : styles.text} color={disabled ? OFF.ink : textColor}>
            {label}
          </PText>
          {right}
        </Animated.View>
      )}
    </Pressable>
  );
}

// 프로토타입 .press: transform · box-shadow .15s cubic-bezier(.16,1,.3,1)
const press = css.create({ t: { transitionProperty: ['transform', 'boxShadow'], transitionDuration: '100ms', transitionTimingFunction: cubicBezier(0.16, 1, 0.3, 1) } }).t;

const styles = StyleSheet.create({
  pill: {
    height: STUDY_BTN.height,
    borderRadius: STUDY_BTN.radius,
    borderWidth: STUDY_BTN.border,
    borderColor: Colors.ink,
    marginBottom: STUDY_BTN.drop,
    boxShadow: `0px ${STUDY_BTN.drop}px 0px ${Colors.ink}`,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  down: { transform: [{ translateY: STUDY_BTN.press }], boxShadow: `0px ${STUDY_BTN.drop - STUDY_BTN.press}px 0px ${Colors.ink}` },
  off: { backgroundColor: OFF.bg, borderColor: OFF.line, boxShadow: 'none' },
  text: { fontFamily: Font.body900, fontSize: 16, lineHeight: 22 },
  smallText: { fontFamily: Font.body900, fontSize: 15, lineHeight: 20 },
});
