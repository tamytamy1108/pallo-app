import { memo, useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance, type StyleProp, type ViewStyle } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { haptic } from '@/lib/feedback';

/** 한 칸 높이 · 보이는 칸 수 (가운데가 고른 값) */
const ITEM = 32;
const ROWS = 3;
/**
 * 값 정하기: 앱은 굴림이 완전히 멈춘 뒤(onMomentumScrollEnd) 한 번만.
 * 웹은 그 신호가 없어서 마지막 스크롤 뒤 이만큼 조용하면 (끌던 중에 정하지 않아요 → 끊김 없게)
 */
const WEB_SETTLE_MS = 220;
const WEB = Platform.OS === 'web';

/** 한 줄 — 가운데에서 몇 칸 떨어졌는지(near)만 바뀌어요 (다른 줄은 다시 그리지 않아요) */
const Row = memo(function Row({ text, near, index, onPick }: { text: string; near: 0 | 1 | 2; index: number; onPick: (i: number) => void }) {
  return (
    <Pressable onPress={() => onPick(index)} accessibilityRole="button" accessibilityLabel={text} style={styles.row}>
      <PText style={[styles.t, near === 0 ? styles.tOn : near === 1 ? styles.tNear : styles.tFar]}>{text}</PText>
    </Pressable>
  );
});

/**
 * 위아래로 끌어서 고르는 휠 (iOS 시간 고르기처럼): 가운데 줄이 고른 값 · 칸마다 딱 멈춰요 · 칸을 눌러도 거기로.
 * label: 칸 글자 (예: '20:00' → '오후 8:00') · bare: 테두리 · 바탕 없이 (다른 칸 안에 넣을 때)
 * 굴리는 동안은 가운데 글자 · 진동만 바뀌고, 값은 멈춘 뒤에 정해요. 휠이 정한 값으로는 다시 맞추지 않아요(툭 튀지 않게).
 */
/** onTap: 칸을 눌러 고르면 (끌지 않고) — 고른 값을 넣은 뒤 불러요 (예: 휠 닫기) */
export function Wheel({ items, value, onChange, label = (v) => v, style, bare, onTap }: { items: readonly string[]; value: string; onChange: (v: string) => void; label?: (v: string) => string; style?: StyleProp<ViewStyle>; bare?: boolean; onTap?: () => void }) {
  const ref = useRef<ScrollViewInstance>(null);
  const at = Math.max(0, items.indexOf(value));
  const [cur, setCur] = useState(at);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const last = useRef(at);
  /** 방금 휠이 정한 값 — 그 값으로 바뀐 거면 스크롤을 다시 맞추지 않아요 */
  const mine = useRef<string | null>(null);
  const latest = useRef({ items, value, onChange });
  useEffect(() => {
    latest.current = { items, value, onChange };
  });

  // 처음 · 바깥에서 값이 바뀌면 그 칸으로 (휠이 정한 값이면 그대로)
  useEffect(() => {
    if (mine.current === value) {
      mine.current = null;
      return;
    }
    ref.current?.scrollTo({ y: at * ITEM, animated: false });
    last.current = at;
    setCur(at);
  }, [at, value]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const commit = (i: number) => {
    const { items: L, value: v, onChange: on } = latest.current;
    const k = Math.min(L.length - 1, Math.max(0, i));
    if (L[k] === v) return;
    mine.current = L[k];
    on(L[k]);
  };
  const indexOf = (e: NativeSyntheticEvent<NativeScrollEvent>) => Math.round(e.nativeEvent.contentOffset.y / ITEM);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = indexOf(e);
    if (i !== last.current) {
      last.current = i;
      setCur(i);
      haptic('select');
    }
    if (!WEB) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(i), WEB_SETTLE_MS);
  };
  // 웹: 한 번 굴릴 때 칸마다 꼭 멈추게 (scroll-snap-stop) — 트랙패드 · 마우스 관성으로 여러 칸 넘어가지 않아요
  useEffect(() => {
    if (!WEB) return;
    const node = (ref.current as unknown as { getScrollableNode?: () => HTMLElement } | null)?.getScrollableNode?.();
    const rows = node?.firstElementChild?.children;
    if (!node || !rows) return;
    node.style.scrollSnapType = 'y mandatory';
    for (const r of Array.from(rows)) {
      const el = r as HTMLElement;
      el.style.scrollSnapAlign = 'center';
      el.style.scrollSnapStop = 'always';
    }
  });

  const pick = (i: number) => {
    ref.current?.scrollTo({ y: i * ITEM, animated: true });
    commit(i);
    onTap?.();
  };

  return (
    <View style={[styles.box, bare && styles.bare, style]} accessibilityRole="adjustable" accessibilityValue={{ text: label(items[cur] ?? value) }}>
      <View style={[styles.band, bare && styles.bandBare]} pointerEvents="none" />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM}
        // 빨리 멈춰서 원하는 칸에 서기 쉽게 (normal 은 너무 멀리 굴러가요)
        decelerationRate="fast"
        onScroll={onScroll}
        onMomentumScrollEnd={(e) => commit(indexOf(e))}
        scrollEventThrottle={16}
        nestedScrollEnabled
        contentContainerStyle={{ paddingVertical: ITEM * Math.floor(ROWS / 2) }}>
        {items.map((v, i) => {
          const d = Math.abs(i - cur);
          return <Row key={v} text={label(v)} near={d === 0 ? 0 : d === 1 ? 1 : 2} index={i} onPick={pick} />;
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { height: ITEM * ROWS + 4, borderWidth: 2, borderColor: Colors.ink, borderRadius: 14, backgroundColor: '#fff', overflow: 'hidden' },
  bandBare: { left: -4, right: -4, backgroundColor: '#fff' },
  bare: { height: ITEM * ROWS, borderWidth: 0, borderRadius: 0, backgroundColor: 'transparent' },
  band: { position: 'absolute', left: 6, right: 6, top: ITEM * Math.floor(ROWS / 2), height: ITEM, borderRadius: 10, backgroundColor: '#F3EEFB', borderWidth: 2, borderColor: Colors.purple },
  row: { height: ITEM, alignItems: 'center', justifyContent: 'center' },
  t: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18 },
  tOn: { fontFamily: Font.display, fontSize: 14.5, color: Colors.purple },
  tNear: { color: Colors.ink, opacity: 0.55 },
  tFar: { color: Colors.ink, opacity: 0.25 },
});
