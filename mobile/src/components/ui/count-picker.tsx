import { useRef, useState } from 'react';
import { StyleSheet, TextInput, View, type ViewInstance } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { sfx } from '@/lib/feedback';

import { useRevealOnFocus } from './reveal-on-focus';

type StepperProps = {
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (v: number) => void;
  /** 가운데 숫자를 눌러 직접 적기 (숫자 키패드 · 다 쓰면 min ~ max 로 맞춰요) */
  typable?: boolean;
  /** 흐리게 (고른 값이 아닐 때 · 누르면 다시 이 숫자로) */
  dim?: boolean;
};

/** − 12명 + (누르면 하나씩, 끝에 닿으면 흐리게). typable 이면 숫자를 눌러 바로 적어요 */
export function Stepper({ value, min, max, unit = '명', onChange, typable, dim }: StepperProps) {
  const step = (d: number) => {
    const v = Math.min(max, Math.max(min, value + d));
    if (v === value && !dim) return;
    sfx('tap');
    onChange(v);
  };
  const btn = (d: number, label: string, off: boolean) => (
    <Pressable onPress={() => step(d)} disabled={off} accessibilityRole="button" accessibilityLabel={label} hitSlop={6} style={({ pressed }) => [st.b, off && st.off, pressed && st.on]}>
      <PText style={st.bt}>{d < 0 ? '−' : '+'}</PText>
    </Pressable>
  );
  return (
    <View style={[st.row, dim && st.dim]} accessibilityRole="adjustable" accessibilityValue={{ min, max, now: value, text: `${value}${unit}` }}>
      {btn(-1, `${unit === '명' ? '한 명' : '하나'} 줄이기`, !dim && value <= min)}
      {typable ? <TypedNumber value={value} min={min} max={max} unit={unit} onChange={onChange} /> : <PText style={st.v}>{`${value}${unit}`}</PText>}
      {btn(1, `${unit === '명' ? '한 명' : '하나'} 늘리기`, !dim && value >= max)}
    </View>
  );
}

/** 눌러서 적는 숫자 칸: 쓰는 동안은 적은 그대로, 다 쓰면(키보드 닫기 · 완료) min ~ max 로 맞춰 알려요. 비우면 원래 숫자로 */
function TypedNumber({ value, min, max, unit, onChange }: { value: number; min: number; max: number; unit: string; onChange: (v: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const box = useRef<ViewInstance>(null);
  const reveal = useRevealOnFocus();
  const commit = () => {
    if (draft == null) return;
    setDraft(null);
    const n = Number(draft);
    if (!draft || !Number.isFinite(n)) return;
    const v = Math.min(max, Math.max(min, Math.round(n)));
    if (v !== n) sfx('tap');
    onChange(v);
  };
  return (
    <View ref={box} collapsable={false} style={st.typed}>
      <TextInput
        value={draft ?? String(value)}
        onChangeText={(t) => setDraft(t.replace(/\D/g, '').slice(0, String(max).length))}
        onFocus={() => {
          setDraft(String(value));
          reveal(box.current);
        }}
        onBlur={commit}
        onSubmitEditing={commit}
        keyboardType="number-pad"
        returnKeyType="done"
        selectTextOnFocus
        maxLength={String(max).length}
        selectionColor={Colors.purple}
        cursorColor={Colors.purple}
        accessibilityLabel={`인원 직접 적기 · ${min}~${max}${unit}`}
        // 웹은 입력 칸 기본 폭이 넓어서(약 150px) 줄이 옆으로 밀려요 → 자리 수만큼만
        style={[st.input, { width: 14 * String(max).length + 8 }]}
      />
      <PText style={st.unit}>{unit}</PText>
    </View>
  );
}

type CountPickerBase = {
  presets: number[];
  min: number;
  max: number;
  unit?: string;
  /** 가운데 숫자를 눌러 직접 적기 */
  typable?: boolean;
};

type CountPickerProps =
  | (CountPickerBase & { value: number; onChange: (v: number) => void; anyLabel?: undefined })
  /** anyLabel ('무관') 을 주면 끝에 '제한 없음' 알약이 생기고, 고르면 null 을 알려요 */
  | (CountPickerBase & { value: number | null; onChange: (v: number | null) => void; anyLabel: string });

/**
 * 인원 고르기: 자주 쓰는 숫자는 한 번에 (알약), 그 밖의 숫자(12명 · 15명 …)는 − / + 로 직접 (typable 이면 숫자를 눌러 적기도).
 * 알약을 누르면 그 숫자로, −/+ 로 바꾸면 알약 고름이 풀려요. anyLabel 이 있으면 '무관' 알약 (값 null).
 */
export function CountPicker(props: CountPickerProps) {
  const { value, presets, min, max, unit = '명', typable } = props;
  // '무관' 일 때 −/+ 가 이어서 셀 숫자 (마지막으로 고른 숫자)
  const [lastNum, setLastNum] = useState(value ?? presets[0] ?? min);
  const pickNum = (v: number) => {
    setLastNum(v);
    props.onChange(v);
  };
  const pickAny = () => {
    if (props.anyLabel != null) props.onChange(null);
  };
  const pill = (key: string, label: string, on: boolean, onPress: () => void) => (
    <Pressable
      key={key}
      onPress={() => {
        sfx('pick');
        onPress();
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      style={({ pressed }) => [st.pill, on && st.pillOn, pressed && st.on]}>
      <PText style={[st.pillT, on && { color: Colors.white }]}>{label}</PText>
    </Pressable>
  );
  return (
    <View style={st.wrap}>
      <View style={st.pills} accessibilityRole="radiogroup">
        {presets.map((n) => pill(String(n), `${n}${unit}`, n === value, () => pickNum(n)))}
        {props.anyLabel != null ? pill('any', props.anyLabel, value == null, pickAny) : null}
      </View>
      <View style={st.direct}>
        <PText style={st.label}>직접</PText>
        <Stepper value={value ?? lastNum} min={min} max={max} unit={unit} typable={typable} dim={value == null} onChange={pickNum} />
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { gap: 10 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { height: 40, paddingHorizontal: 16, borderRadius: 20, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, justifyContent: 'center' },
  pillOn: { backgroundColor: Colors.purple },
  pillT: { fontFamily: Font.body900, fontSize: 14, lineHeight: 19, color: Colors.ink },
  direct: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
  row: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 14 },
  dim: { opacity: 0.45 },
  b: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  bt: { fontFamily: Font.body900, fontSize: 20, lineHeight: 24 },
  v: { minWidth: 56, textAlign: 'center', fontFamily: Font.display, fontSize: 18, lineHeight: 24 },
  // 눌러서 적는 칸: 밑줄로 '적을 수 있어요' 를 보여 줘요
  typed: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minWidth: 64, height: 40, paddingHorizontal: 6, borderBottomWidth: 2, borderColor: Colors.ink },
  input: { minWidth: 30, padding: 0, textAlign: 'center', fontFamily: Font.display, fontSize: 18, lineHeight: 24, color: Colors.ink, includeFontPadding: false },
  unit: { fontFamily: Font.display, fontSize: 18, lineHeight: 24 },
  off: { opacity: 0.35 },
  on: { transform: [{ scale: 0.94 }] },
});
