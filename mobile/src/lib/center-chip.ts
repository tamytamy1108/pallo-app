/**
 * 옆으로 넘기는 칩 · 탭 줄: 누른 칸을 가운데로 데려와요 (끝에 반쯤 잘린 칩을 눌러도 다 보이게).
 * 쓰는 법: const [rowRef, onRow, onChip, centerChip] = useCenterChip(); <ScrollView ref={rowRef} onLayout={onRow}> … <Chip onLayout={(e) => onChip(key, e)} onPress={() => { centerChip(key); … }} />
 */
import { useRef } from 'react';
import type { LayoutChangeEvent, ScrollViewInstance } from 'react-native';

export function useCenterChip() {
  const ref = useRef<ScrollViewInstance>(null);
  const boxW = useRef(0);
  const items = useRef(new Map<string, { x: number; w: number }>());
  // 아직 크기를 모르면 기다렸다가 (줄 · 칩 크기를 알게 되는 순간) 데려와요
  const pending = useRef<{ key: string; animated: boolean } | null>(null);
  const tryCenter = () => {
    const p = pending.current;
    const it = p && items.current.get(p.key);
    if (!p || !it || !boxW.current) return;
    pending.current = null;
    ref.current?.scrollTo({ x: Math.max(0, it.x + it.w / 2 - boxW.current / 2), animated: p.animated });
  };
  const onBox = (e: LayoutChangeEvent) => {
    boxW.current = e.nativeEvent.layout.width;
    tryCenter();
  };
  const onItem = (key: string, e: LayoutChangeEvent) => {
    items.current.set(key, { x: e.nativeEvent.layout.x, w: e.nativeEvent.layout.width });
    tryCenter();
  };
  /** animated=false 는 처음 보여 줄 때 (움직임 없이 바로) */
  const center = (key: string, animated = true) => {
    pending.current = { key, animated };
    tryCenter();
  };
  return [ref, onBox, onItem, center] as const;
}
