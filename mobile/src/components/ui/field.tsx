import { useEffect, type ReactNode } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Pressable } from '@/components/ui/pressable';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { sfx } from '@/lib/feedback';
import { EASE } from '@/lib/motion';

import { PText } from './text';

/**
 * 입력칸 · 체크 · 스위치 (프로토타입 .lg-fl · .lg-inp · #lgSheet textarea · .lg-alsorep · .st-row.tg).
 * 입력 글자색은 잉크로 고정해요 — 어두운 모드 기기에서 흰 글씨로 안 보이던 문제 막기 (08-common '시트 · 확인 창').
 * 담당: 공통 부품. props 는 바꾸지 않아요(늘리기만).
 */

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label?: string;
  /** box: 네모 칸 (.lg-fl input · 둥글기 14) · round: 알약 칸 (.lg-inp · 댓글 · 검색) */
  variant?: 'box' | 'round';
};

export function TextField({ label, multiline, variant = 'box', ...rest }: TextFieldProps) {
  return (
    <View style={styles.field}>
      {label ? <PText style={styles.label}>{label}</PText> : null}
      <TextInput
        placeholderTextColor="#8C8597"
        selectionColor={Colors.purple}
        cursorColor={Colors.purple}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[styles.input, variant === 'round' && styles.round, multiline && styles.multi]}
        accessibilityLabel={label ?? rest.placeholder}
        {...rest}
      />
    </View>
  );
}

type CheckboxProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  /** 아래 작은 설명 (.lg-alsorep small) */
  sub?: string;
  /** 네모 크기 (기본 22 · 체험 신청 동의는 20) */
  size?: number;
  /** 글자 오른쪽에 붙는 것 (예: [보기] 링크) */
  right?: ReactNode;
};

/** 체크 (.lg-alsorep: 둥근 네모 · 잉크 2px · 켜면 보라 바탕에 흰 체크) */
export function Checkbox({ checked, onChange, label, sub, size = 22, right }: CheckboxProps) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => {
          sfx('toggle');
          onChange(!checked);
        }}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={label}
        style={[styles.checkPress, !right && styles.grow]}
        hitSlop={6}>
        <View style={[styles.box, { width: size, height: size, borderRadius: size > 20 ? 6 : 5 }, checked && styles.boxOn]}>
          {checked ? (
            <Svg width={size - 8} height={size - 8} viewBox="0 0 24 24" fill="none" stroke={Colors.white} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M5 12.5l4.5 4.5L19 7.5" />
            </Svg>
          ) : null}
        </View>
        <View style={styles.rowText}>
          <PText style={size > 20 ? styles.checkLabel : styles.checkLabelSm}>{label}</PText>
          {sub ? <PText style={styles.sub}>{sub}</PText> : null}
        </View>
      </Pressable>
      {right}
    </View>
  );
}

type SwitchProps = {
  value: boolean;
  onValueChange: (next: boolean) => void;
  label?: string;
  /** 이름 아래 작은 설명 (.st-row small) */
  sub?: string;
};

/** 켜고 끄기 (.st-row.tg i: 46×28 · 잉크 2px · 켜면 보라 · 동그라미가 .2초 --ease 로 옆으로) */
export function Switch({ value, onValueChange, label, sub }: SwitchProps) {
  const still = useReducedMotion();
  const x = useSharedValue(value ? 1 : 0);
  useEffect(() => {
    x.set(withTiming(value ? 1 : 0, { duration: still ? 0 : 200, easing: EASE }));
  }, [value, still, x]);
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() * 18 }] }));

  return (
    <Pressable
      onPress={() => {
        sfx('toggle');
        onValueChange(!value);
      }}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      style={styles.row}
      hitSlop={6}>
      {label ? (
        <View style={[styles.rowText, styles.grow]}>
          <PText style={styles.swLabel}>{label}</PText>
          {sub ? <PText style={styles.swSub}>{sub}</PText> : null}
        </View>
      ) : null}
      <View style={[styles.track, value && styles.trackOn]}>
        <Animated.View style={[styles.knob, knob]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 12.5 * 1.4 },
  // .lg-fl input { height: 46px; border-radius: 14px; padding: 0 14px; font-size: 14px; font-weight: 700 }
  input: { height: 46, paddingHorizontal: 14, paddingVertical: 0, includeFontPadding: false, borderRadius: 14, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, fontFamily: Font.body700, fontSize: 14, color: Colors.ink },
  round: { borderRadius: 23, paddingHorizontal: 16, fontFamily: Font.body600 },
  // #lgSheet textarea { height: 110px; border-radius: 18px; padding: 12px 14px; line-height: 1.6 }
  multi: { height: undefined, minHeight: 110, maxHeight: 260, borderRadius: 18, paddingTop: 12, paddingBottom: 12, fontFamily: Font.body600, lineHeight: 14 * 1.6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  checkPress: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  grow: { flex: 1 },
  rowText: { flexShrink: 1, minWidth: 0, gap: 2 },
  box: { borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: Colors.purple },
  checkLabel: { fontFamily: Font.body800, fontSize: 14.5, lineHeight: 14.5 * 1.45 },
  checkLabelSm: { fontFamily: Font.body800, fontSize: 13.5, lineHeight: 13.5 * 1.45 },
  sub: { fontFamily: Font.body600, fontSize: 12, lineHeight: 12 * 1.45, color: Colors.inkSub },
  swLabel: { fontFamily: Font.body800, fontSize: 14.5, lineHeight: 14.5 * 1.45 },
  swSub: { fontFamily: Font.body700, fontSize: 12, lineHeight: 12 * 1.45, color: Colors.inkSub },
  track: { width: 46, height: 28, borderRadius: 14, borderWidth: 2, borderColor: Colors.ink, backgroundColor: '#EDE7DA', padding: 2 },
  trackOn: { backgroundColor: Colors.purple },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.ink },
});
