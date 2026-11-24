import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance, type StyleProp, type ViewStyle } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { haptic } from '@/lib/feedback';

/** 한 칸 높이 · 보이는 칸 수 (가운데가 고른 값) */
const ITEM = 32;
const ROWS = 3;
/** 끌기를 멈춘 뒤 이만큼 지나면 고른 값으로 (웹은 '굴림 끝' 신호가 없어서) */
const SETTLE_MS = 140;

/**
 * 위아래로 끌어서 고르는 휠 (iOS 시간 고르기처럼): 가운데 줄이 고른 값 · 칸마다 딱 멈춰요 · 칸을 눌러도 거기로.
 * label: 칸 글자 (예: '20:00' → '오후 8:00')
 */
export function Wheel({ items, value, onChange, label = (v) => v, style }: { items: readonly string[]; value: string; onChange: (v: string) => void; label?: (v: string) => string; style?: StyleProp<ViewStyle> }) {
  const ref = useRef<ScrollViewInstance>(null);
  const at = Math.max(0, items.indexOf(value));
  const [cur, setCur] = useState(at);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const last = useRef(at);

  // 처음 · 바깥에서 값이 바뀌면 그 칸으로
  useEffect(() => {
    ref.current?.scrollTo({ y: at * ITEM, animated: false });
    last.current = at;
  }, [at]);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const commit = (i: number) => {
    const k = Math.min(items.length - 1, Math.max(0, i));
    if (items[k] !== value) onChange(items[k]);
  };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.y / ITEM);
    if (i !== last.current) {
      last.current = i;
      setCur(i);
      haptic('select');
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(i), SETTLE_MS);
  };
  const jump = (i: number) => {
    ref.current?.scrollTo({ y: i * ITEM, animated: true });
    commit(i);
  };

  return (
    <View style={[styles.box, style]} accessibilityRole="adjustable" accessibilityValue={{ text: label(items[cur] ?? value) }}>
      <View style={styles.band} pointerEvents="none" />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM}
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
        nestedScrollEnabled
        contentContainerStyle={{ paddingVertical: ITEM * Math.floor(ROWS / 2) }}>
        {items.map((v, i) => {
          const d = Math.abs(i - cur);
          return (
            <Pressable key={v} onPress={() => jump(i)} accessibilityRole="button" accessibilityLabel={label(v)} style={styles.row}>
              <PText style={[styles.t, d === 0 ? styles.tOn : d === 1 ? styles.tNear : styles.tFar]}>{label(v)}</PText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { height: ITEM * ROWS + 4, borderWidth: 2, borderColor: Colors.ink, borderRadius: 14, backgroundColor: '#fff', overflow: 'hidden' },
  band: { position: 'absolute', left: 6, right: 6, top: ITEM * Math.floor(ROWS / 2), height: ITEM, borderRadius: 10, backgroundColor: '#F3EEFB', borderWidth: 2, borderColor: Colors.purple },
  row: { height: ITEM, alignItems: 'center', justifyContent: 'center' },
  t: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18 },
  tOn: { fontFamily: Font.display, fontSize: 14.5, color: Colors.purple },
  tNear: { color: Colors.ink, opacity: 0.55 },
  tFar: { color: Colors.ink, opacity: 0.25 },
});
