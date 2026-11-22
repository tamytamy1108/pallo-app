import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Font } from '@/constants/fonts';
import { Colors, Radius } from '@/constants/theme';

import { PText } from './text';

/**
 * 입력칸 · 체크 · 스위치.
 * 담당: 공통 부품 — 모양은 프로토타입대로 다듬어요. props 는 바꾸지 않아요(늘리기만).
 */

type TextFieldProps = Omit<TextInputProps, 'style'> & { label?: string };

export function TextField({ label, multiline, ...rest }: TextFieldProps) {
  return (
    <View style={styles.field}>
      {label ? <PText variant="label">{label}</PText> : null}
      <TextInput
        placeholderTextColor="#9B94A6"
        multiline={multiline}
        style={StyleSheet.flatten([styles.input, multiline && styles.multi])}
        accessibilityLabel={label ?? rest.placeholder}
        {...rest}
      />
    </View>
  );
}

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (next: boolean) => void; label: string }) {
  return (
    <Pressable onPress={() => onChange(!checked)} accessibilityRole="checkbox" accessibilityState={{ checked }} style={styles.row} hitSlop={6}>
      <View style={StyleSheet.flatten([styles.box, checked && styles.boxOn])}>
        {checked ? <PText variant="label">✓</PText> : null}
      </View>
      <PText style={styles.rowText}>{label}</PText>
    </Pressable>
  );
}

export function Switch({ value, onValueChange, label }: { value: boolean; onValueChange: (next: boolean) => void; label?: string }) {
  return (
    <Pressable onPress={() => onValueChange(!value)} accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: value }} style={styles.row} hitSlop={6}>
      {label ? <PText style={styles.rowText}>{label}</PText> : null}
      <View style={StyleSheet.flatten([styles.track, value && styles.trackOn])}>
        <View style={StyleSheet.flatten([styles.knob, value && styles.knobOn])} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  input: { minHeight: 52, paddingHorizontal: 16, borderRadius: Radius.control, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, fontFamily: Font.body600, fontSize: 15, color: Colors.ink },
  multi: { minHeight: 110, paddingTop: 14, textAlignVertical: 'top' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  rowText: { flex: 1 },
  box: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: Colors.yellow },
  track: { width: 50, height: 30, borderRadius: 15, borderWidth: 2, borderColor: Colors.ink, backgroundColor: '#EEE8DA', padding: 2 },
  trackOn: { backgroundColor: Colors.yellow },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.ink },
  knobOn: { transform: [{ translateX: 20 }] },
});
