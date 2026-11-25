import { useEffect, useState, type ReactNode } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import type { StickerSpot } from '@/data/lounge';

/*
 * 사진 위 글 스티커 — 스토리 만들기에서 끌어 옮기고 색을 고르고, 스토리 보기 · 피드에서 같은 자리에 보여요.
 * 자리는 사진 칸 안 비율(0~1)로 들고 다녀서 칸 크기가 달라도 비슷한 곳에 놓여요.
 */

/** 고를 수 있는 스티커 색 (바탕 · 글씨) — 앱 팔레트에서만 */
export const STICKER_COLORS: { bg: string; fg: string; name: string }[] = [
  { bg: Colors.yellow, fg: Colors.ink, name: '노랑' },
  { bg: Colors.white, fg: Colors.ink, name: '흰색' },
  { bg: Colors.ink, fg: Colors.yellow, name: '검정' },
  { bg: Colors.purple, fg: Colors.white, name: '보라' },
  { bg: Colors.rosePink, fg: Colors.white, name: '분홍' },
  { bg: Colors.sky, fg: Colors.ink, name: '하늘' },
  { bg: Colors.lavender, fg: Colors.ink, name: '연보라' },
];
export const stickerColor = (c: number) => STICKER_COLORS[c] ?? STICKER_COLORS[0];
/** 처음 놓이는 자리 (가운데 조금 아래) */
export const DEFAULT_SPOT: StickerSpot = { x: 0.5, y: 0.52, c: 0 };

type Size = { w: number; h: number };
const clamp = (v: number, lo: number, hi: number) => {
  'worklet';
  return Math.min(Math.max(v, lo), Math.max(lo, hi));
};

/** 스티커 모양 — sm 은 피드처럼 작은 칸에서 */
export function StickerLabel({ text, c, sm = false, children }: { text?: string; c: number; sm?: boolean; children?: ReactNode }) {
  const { bg, fg } = stickerColor(c);
  return (
    <View style={[styles.label, sm && styles.labelSm, { backgroundColor: bg }]}>
      {children ?? <PText style={[styles.labelT, sm && styles.labelTSm, { color: fg }]}>{text}</PText>}
    </View>
  );
}

/** 보기 전용: 부모 칸을 꽉 채우는 층 위, 정해진 자리에 스티커를 놓아요 (손짓은 받지 않아요) */
export function PlacedSticker({ text, spot, sm = false }: { text: string; spot: StickerSpot; sm?: boolean }) {
  const [box, setBox] = useState<Size | null>(null);
  const [me, setMe] = useState<Size | null>(null);
  const ready = box && me;
  const left = ready ? clamp(spot.x * box.w - me.w / 2, 0, box.w - me.w) : 0;
  const top = ready ? clamp(spot.y * box.h - me.h / 2, 0, box.h - me.h) : 0;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={(e) => setBox(sizeOf(e))}>
      {box ? (
        <View style={[styles.spot, { left, top, maxWidth: box.w - (sm ? 24 : 48), opacity: ready ? 1 : 0 }]} onLayout={(e) => setMe(sizeOf(e))} accessibilityLabel={text}>
          <StickerLabel text={text} c={spot.c} sm={sm} />
        </View>
      ) : null}
    </View>
  );
}

const sizeOf = (e: LayoutChangeEvent): Size => ({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

type DragProps = {
  text: string;
  spot: StickerSpot;
  /** 손을 뗄 때마다 새 자리 (움직이는 동안은 안 불러요) */
  onMove: (s: StickerSpot) => void;
  /** 한 번 누르면 글 고치기 */
  onPress: () => void;
};

/**
 * 만들기용: 끌어서 옮기는 스티커. 움직임은 UI 스레드에서 (Gesture Handler + Reanimated), 칸 밖으로는 못 나가요.
 * 부모 칸을 꽉 채우는 층으로 그려요 — 스티커 밖은 손짓을 아래(사진 맞추기)로 넘겨요.
 */
export function DraggableSticker({ text, spot, onMove, onPress }: DragProps) {
  const still = useReducedMotion();
  const [box, setBox] = useState<Size | null>(null);
  const boxW = useSharedValue(0);
  const boxH = useSharedValue(0);
  const w = useSharedValue(0);
  const h = useSharedValue(0);
  const cx = useSharedValue(0);
  const cy = useSharedValue(0);
  const lift = useSharedValue(0);
  const c = spot.c;

  // 칸 크기나 자리가 밖에서 바뀌면 (처음 · 색 바꾸기) 그 자리로 옮겨 놓아요
  useEffect(() => {
    if (!box) return;
    boxW.set(box.w);
    boxH.set(box.h);
    cx.set(spot.x * box.w);
    cy.set(spot.y * box.h);
  }, [box, spot.x, spot.y, boxW, boxH, cx, cy]);

  const pan = Gesture.Pan()
    .minDistance(2)
    .onStart(() => {
      lift.set(still ? 1 : withTiming(1, { duration: 120 }));
    })
    .onChange((e) => {
      cx.set(clamp(cx.get() + e.changeX, w.get() / 2, boxW.get() - w.get() / 2));
      cy.set(clamp(cy.get() + e.changeY, h.get() / 2, boxH.get() - h.get() / 2));
    })
    .onEnd(() => {
      const W = boxW.get();
      const H = boxH.get();
      if (W && H) scheduleOnRN(onMove, { x: cx.get() / W, y: cy.get() / H, c });
    })
    .onFinalize(() => {
      lift.set(still ? 0 : withTiming(0, { duration: 180 }));
    });
  const tap = Gesture.Tap().onEnd(() => {
    scheduleOnRN(onPress);
  });
  const gesture = Gesture.Race(pan, tap);

  const pos = useAnimatedStyle(() => {
    const l = clamp(cx.get() - w.get() / 2, 0, boxW.get() - w.get());
    const t = clamp(cy.get() - h.get() / 2, 0, boxH.get() - h.get());
    return { transform: [{ translateX: l }, { translateY: t }, { scale: 1 + lift.get() * 0.06 }], opacity: w.get() ? 1 : 0 };
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none" onLayout={(e) => setBox(sizeOf(e))}>
      {box ? (
        <GestureDetector gesture={gesture}>
          <Animated.View
            style={[styles.drag, { maxWidth: box.w - 48 }, pos]}
            onLayout={(e) => {
              w.set(e.nativeEvent.layout.width);
              h.set(e.nativeEvent.layout.height);
            }}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`글 스티커: ${text}`}
            accessibilityHint="끌어서 옮기고, 누르면 글과 색을 고쳐요"
            accessibilityActions={[{ name: 'activate' }]}
            onAccessibilityAction={onPress}>
            <StickerLabel text={text} c={c} />
          </Animated.View>
        </GestureDetector>
      ) : null}
    </View>
  );
}

/** 색 고르기 줄 */
export function StickerColors({ c, onPick }: { c: number; onPick: (c: number) => void }) {
  return (
    <View style={styles.colors} accessibilityRole="radiogroup" accessibilityLabel="스티커 색">
      {STICKER_COLORS.map((x, k) => {
        const on = k === c;
        return (
          <Pressable key={x.name} onPress={() => onPick(k)} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={`${x.name} 스티커`} hitSlop={2} style={[styles.ring, on && styles.ringOn]}>
            <View style={[styles.swatch, { backgroundColor: x.bg }]}>
              <PText style={[styles.swatchT, { color: x.fg }]}>가</PText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { backgroundColor: Colors.yellow, borderWidth: 2, borderColor: Colors.ink, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, transform: [{ rotate: '-2deg' }] },
  labelSm: { borderRadius: 11, paddingHorizontal: 10, paddingVertical: 5 },
  labelT: { fontFamily: Font.body900, fontSize: 19, lineHeight: 26, color: Colors.ink, textAlign: 'center' },
  labelTSm: { fontSize: 14, lineHeight: 19 },
  spot: { position: 'absolute' },
  drag: { position: 'absolute', left: 0, top: 0 },
  colors: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  ring: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  ringOn: { borderColor: Colors.white },
  swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  swatchT: { fontFamily: Font.body900, fontSize: 14, lineHeight: 18 },
});
