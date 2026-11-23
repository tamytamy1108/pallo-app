import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

// ---- 색 계산 (프로토타입 hslHex · toneSL · pickHex · hexHT 그대로) ----
const hexRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgbHex = (r: number, g: number, b: number) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
function hue(r: number, g: number, b: number) {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;
  let h = 0;
  if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}
function hslHex(h: number, s: number, l: number) {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return rgbHex(f(0) * 255, f(8) * 255, f(4) * 255);
}
/** 톤: 0 파스텔 → 50 선명 → 100 진하게 */
const toneSL = (t: number) => (t <= 50 ? [70 + ((90 - 70) * t) / 50, 84 - ((84 - 56) * t) / 50] : [90 - ((90 - 62) * (t - 50)) / 50, 56 - ((56 - 26) * (t - 50)) / 50]);
export const pickHex = (h: number, t: number) => {
  const [s, l] = toneSL(t);
  return hslHex(h, s, l);
};
function hexHT(hex: string): [number, number] {
  const [r, g, b] = hexRgb(hex).map((v) => v / 255);
  const l = ((Math.max(r, g, b) + Math.min(r, g, b)) / 2) * 100;
  const t = l >= 56 ? ((84 - l) / 28) * 50 : 50 + ((56 - l) / 30) * 50;
  return [Math.round(hue(r, g, b)), Math.round(Math.max(0, Math.min(100, t)))];
}
const HUE_STOPS = [0, 60, 120, 180, 240, 300, 359].map((x) => pickHex(x, 50)) as [string, string, ...string[]];

/** 둥근 막대 슬라이더 (프로토타입 input[type=range]: 16px 막대 · 26px 흰 손잡이) */
function Range({ value, max, colors, label, onChange }: { value: number; max: number; colors: [string, string, ...string[]]; label: string; onChange: (v: number) => void }) {
  const [w, setW] = useState(0);
  const set = (x: number) => {
    if (w <= 0) return;
    onChange(Math.round(Math.max(0, Math.min(1, (x - 13) / (w - 26))) * max));
  };
  const pan = Gesture.Pan()
    .activeOffsetX([-3, 3])
    .failOffsetY([-14, 14])
    .onBegin((e) => runOnJS(set)(e.x))
    .onUpdate((e) => runOnJS(set)(e.x));
  const step = (d: number) => onChange(Math.max(0, Math.min(max, value + d)));
  return (
    <GestureDetector gesture={pan}>
      <View
        style={styles.rangeHit}
        onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ min: 0, max, now: value }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? Math.ceil(max / 20) : -Math.ceil(max / 20))}>
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.track} />
        {w > 0 && (
          <View pointerEvents="none" style={[styles.thumb, { left: (value / max) * (w - 26) }]}>
            <View style={styles.thumbShadow} />
            <View style={styles.thumbIn} />
          </View>
        )}
      </View>
    </GestureDetector>
  );
}

/**
 * 무료 자유 색 고르기 (프로토타입 colorPick .av-pick): 제목 · 지금 색 점 · 추천 색 칸 · 색 · 톤 막대.
 * cur 가 이름(예: 'yellow')이면 막대는 가운데에서 시작해요.
 */
export function ColorPick({ title, cur, swatches, onPick }: { title: string; cur: string; swatches: string[]; onPick: (hex: string) => void }) {
  const isHex = cur[0] === '#';
  const [ht, setHt] = useState<[number, number]>(() => (isHex ? hexHT(cur) : [50, 50]));
  const [h, t] = ht;
  const slide = (nh: number, nt: number) => {
    setHt([nh, nt]);
    onPick(pickHex(nh, nt));
  };
  return (
    <View style={styles.pick}>
      <View style={styles.pkH}>
        <PText style={styles.pkT}>{title}</PText>
        <View style={[styles.dot, { backgroundColor: isHex ? cur : Colors.white }]} />
      </View>
      <View style={styles.sw}>
        {swatches.map((c) => {
          const on = cur === c;
          return (
            <Pressable
              key={c}
              onPress={() => {
                setHt(hexHT(c));
                onPick(c);
              }}
              accessibilityRole="button"
              accessibilityLabel={c}
              accessibilityState={{ selected: on }}
              style={styles.swCell}>
              <View style={[styles.swRing, on && styles.swRingOn]}>
                <View style={[styles.swDot, { backgroundColor: c }]} />
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.row}>
        <PText style={styles.rl}>색</PText>
        <Range value={h} max={359} colors={HUE_STOPS} label="색상" onChange={(v) => slide(v, t)} />
      </View>
      <View style={styles.row}>
        <PText style={styles.rl}>톤</PText>
        <Range value={t} max={100} colors={[pickHex(h, 0), pickHex(h, 50), pickHex(h, 100)]} label="톤 (연하게 ~ 진하게)" onChange={(v) => slide(h, v)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pick: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, backgroundColor: Colors.white, paddingTop: 12, paddingHorizontal: 14, paddingBottom: 14, gap: 10 },
  pkH: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pkT: { fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  dot: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: Colors.ink },
  sw: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -3.5, rowGap: 7 },
  swCell: { width: `${100 / 9}%`, paddingHorizontal: 3.5 },
  swRing: { aspectRatio: 1, borderRadius: 999 },
  swRingOn: { borderWidth: 2, borderColor: Colors.ink, padding: 2, margin: -4 },
  swDot: { flex: 1, borderRadius: 999, borderWidth: 1.5, borderColor: 'rgba(30,26,43,0.25)' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rl: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
  rangeHit: { flex: 1, height: 30, justifyContent: 'center' },
  track: { height: 16, borderRadius: 8, borderWidth: 2, borderColor: Colors.ink },
  thumb: { position: 'absolute', top: 2, width: 26, height: 28 },
  thumbShadow: { position: 'absolute', left: 0, top: 2, width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.ink },
  thumbIn: { position: 'absolute', left: 0, top: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.white, borderWidth: 2.5, borderColor: Colors.ink },
});
