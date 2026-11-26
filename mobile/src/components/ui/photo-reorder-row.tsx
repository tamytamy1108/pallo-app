/**
 * 사진 순서 바꾸기 줄 — 옆으로 넘기는 사진 줄에서 사진을 꾹 눌러(0.2초) 끌면 순서가 바뀌어요.
 * - 짧게 밀면 그냥 줄이 옆으로 넘어가요 (꾹 누른 다음에만 끌기 시작).
 * - 끄는 동안 다른 사진은 옆으로 비켜 주고, 줄 끝 가까이 가면 줄이 저절로 넘어가요. 놓으면 그 자리에 들어가요.
 * - 집을 때 · 놓을 때 가벼운 진동. 움직임은 UI 스레드(Gesture Handler + Reanimated).
 * - 사진마다 키가 늘 같아서(주소) 순서가 바뀌어도 사진을 다시 불러오지 않아요 (검게 깜빡이지 않게).
 * - 스크린 리더: 사진 칸에 '앞으로 옮기기 · 뒤로 옮기기' 동작 (renderItem 의 a11y 를 사진 칸에 펼쳐 주세요).
 * 쓰는 곳: 동아리 · 번개 · 행사 만들기 포스터(event/form-parts PosterPicker) · 라운지 새 게시물 사진 줄(app/(app)/compose).
 */
import { useEffect, type ReactNode } from 'react';
import { Platform, StyleSheet, View, type AccessibilityActionEvent, type AccessibilityActionInfo, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  scrollTo,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useFrameCallback,
  useReducedMotion,
  useScrollOffset,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '@/lib/feedback';

/** 꾹 눌러야 끌기 시작 (그 전에 밀면 줄 넘기기) */
const HOLD_MS = 200;
/** 줄 끝에서 이만큼 안으로 들어오면 저절로 넘어가요 */
const EDGE = 56;
/** 저절로 넘어가는 가장 빠른 속도 (px / 16ms) */
const EDGE_SPEED = 9;
const SLIDE = { duration: 200, easing: Easing.out(Easing.cubic) };

type Slots = Record<string, number>;

/** 스크린 리더로 순서 바꾸기 — 사진 칸(누르는 곳)에 펼쳐 주세요 */
export type ReorderA11y = {
  accessibilityActions: AccessibilityActionInfo[];
  onAccessibilityAction: (e: AccessibilityActionEvent) => void;
  accessibilityHint: string;
};

type Props<T> = {
  items: T[];
  /** 사진마다 늘 같은 키 (주소). 같은 주소가 두 번 있어도 괜찮아요 */
  keyOf: (item: T) => string;
  itemWidth: number;
  itemHeight: number;
  gap?: number;
  /** 사진 칸 하나 (빼기 × · 번호 등 포함). index 는 지금 순서 */
  renderItem: (item: T, index: number, a11y: ReorderA11y) => ReactNode;
  /** 놓았을 때 바뀐 순서 (그대로면 안 불러요) */
  onReorder: (next: T[]) => void;
  /** 사진 뒤에 붙는 것 (+ 넣기 · 3/10 등) */
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

/** 같은 주소가 또 있으면 #1 · #2 를 붙여 키를 겹치지 않게 */
function keysOf<T>(items: T[], keyOf: (item: T) => string) {
  const seen = new Map<string, number>();
  return items.map((it) => {
    const base = keyOf(it);
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return n ? `${base}#${n}` : base;
  });
}

const slotsOf = (keys: string[]): Slots => Object.fromEntries(keys.map((k, i) => [k, i]));

const clamp = (v: number, lo: number, hi: number) => {
  'worklet';
  return Math.min(hi, Math.max(lo, v));
};

export function PhotoReorderRow<T>({ items, keyOf, itemWidth, itemHeight, gap = 8, renderItem, onReorder, trailing, style, contentContainerStyle }: Props<T>) {
  const still = useReducedMotion();
  const keys = keysOf(items, keyOf);
  const sig = keys.join('\n');
  const count = keys.length;
  const step = itemWidth + gap;

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scroll = useSharedValue(0);
  useScrollOffset(scrollRef, scroll);
  const viewW = useSharedValue(0);
  const contentW = useSharedValue(0);
  const trackX = useSharedValue(0);

  // 키 → 자리. 끄는 동안 UI 스레드에서 바꾸고, 놓으면 순서를 밖으로 알려요
  const slots = useSharedValue<Slots>(slotsOf(keys));
  // 끄는 사진의 키 ('' = 없음) · 왼쪽 끝 자리(px) · 끌기 시작할 때 값들
  const dragging = useSharedValue('');
  const dragLeft = useSharedValue(0);
  const startLeft = useSharedValue(0);
  const startTrans = useSharedValue(0);
  const startScroll = useSharedValue(0);
  const trans = useSharedValue(0);

  // 밖에서 사진이 늘거나 줄면 (넣기 · 빼기 · 놓은 뒤 새 순서) 자리를 다시 맞춰요
  useEffect(() => {
    if (dragging.get()) return;
    slots.set(slotsOf(sig ? sig.split('\n') : []));
  }, [sig, slots, dragging]);

  // 놓았을 때: 키 순서 → 사진 순서 (그대로면 안 불러요)
  const commit = (order: string[]) => {
    if (order.length !== keys.length || order.every((k, i) => k === keys[i])) return;
    const byKey = new Map(keys.map((k, i) => [k, items[i]] as const));
    const next = order.map((k) => byKey.get(k)).filter((it): it is T => it !== undefined);
    if (next.length === items.length) onReorder(next);
  };

  /** 손가락(과 저절로 넘어간 만큼)을 따라 끄는 사진을 옮기고, 지나친 자리의 사진을 비켜 줘요 */
  const follow = () => {
    'worklet';
    const k = dragging.get();
    if (!k) return;
    const left = clamp(startLeft.get() + trans.get() - startTrans.get() + scroll.get() - startScroll.get(), 0, (count - 1) * step);
    dragLeft.set(left);
    const map = slots.get();
    const from = map[k];
    const to = clamp(Math.round(left / step), 0, count - 1);
    if (from === undefined || to === from) return;
    const next: Slots = {};
    for (const key of Object.keys(map)) {
      const s = map[key];
      if (key === k) next[key] = to;
      else if (from < to && s > from && s <= to) next[key] = s - 1;
      else if (to < from && s >= to && s < from) next[key] = s + 1;
      else next[key] = s;
    }
    slots.set(next);
  };

  // 줄 끝 가까이 끌고 가면 줄을 넘겨요 (끄는 동안만 돌아요)
  const edge = useFrameCallback((frame) => {
    if (!dragging.get()) return;
    const vw = viewW.get();
    const center = trackX.get() + dragLeft.get() + itemWidth / 2 - scroll.get();
    let v = 0;
    if (center < EDGE) v = -EDGE_SPEED * Math.min(1, (EDGE - center) / EDGE);
    else if (center > vw - EDGE) v = EDGE_SPEED * Math.min(1, (center - (vw - EDGE)) / EDGE);
    if (!v) return;
    const dt = (frame.timeSincePreviousFrame ?? 16) / 16;
    const now = scroll.get();
    const next = clamp(now + v * dt, 0, Math.max(0, contentW.get() - vw));
    if (Math.abs(next - now) < 0.5) return;
    scroll.set(next);
    scrollTo(scrollRef, next, 0, false);
    follow();
  }, false);
  const setEdge = (on: boolean) => edge.setActive(on);

  // 끄는 동안은 줄이 손가락을 따라 넘어가지 않게
  const scrollProps = useAnimatedProps(() => ({ scrollEnabled: dragging.get() === '' }));

  const cellProps = { slots, dragging, dragLeft, startLeft, startTrans, startScroll, trans, scroll, follow, commit, setEdge, count, step, itemWidth, itemHeight, still };

  return (
    <Animated.ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      animatedProps={Platform.OS === 'web' ? undefined : scrollProps}
      scrollEventThrottle={16}
      onLayout={(e) => viewW.set(e.nativeEvent.layout.width)}
      onContentSizeChange={(w) => contentW.set(w)}
      style={style}
      contentContainerStyle={[styles.row, { gap }, contentContainerStyle]}>
      {count ? (
        <View style={{ width: count * step - gap, height: itemHeight }} onLayout={(e) => trackX.set(e.nativeEvent.layout.x)}>
          {items.map((it, i) => {
            const k = keys[i];
            const a11y: ReorderA11y = {
              accessibilityHint: count > 1 ? '꾹 눌러 끌면 순서를 바꿀 수 있어요' : '',
              accessibilityActions: [
                ...(i > 0 ? [{ name: 'moveBack', label: '앞으로 옮기기' }] : []),
                ...(i < count - 1 ? [{ name: 'moveNext', label: '뒤로 옮기기' }] : []),
              ],
              onAccessibilityAction: (e) => {
                const to = e.nativeEvent.actionName === 'moveBack' ? i - 1 : e.nativeEvent.actionName === 'moveNext' ? i + 1 : i;
                if (to === i || to < 0 || to >= count) return;
                const order = [...keys];
                order.splice(i, 1);
                order.splice(to, 0, k);
                commit(order);
              },
            };
            return (
              <Cell key={k} k={k} index={i} {...cellProps}>
                {renderItem(it, i, a11y)}
              </Cell>
            );
          })}
        </View>
      ) : null}
      {trailing}
    </Animated.ScrollView>
  );
}

type CellProps = {
  k: string;
  index: number;
  children: ReactNode;
  slots: SharedValue<Slots>;
  dragging: SharedValue<string>;
  dragLeft: SharedValue<number>;
  startLeft: SharedValue<number>;
  startTrans: SharedValue<number>;
  startScroll: SharedValue<number>;
  trans: SharedValue<number>;
  scroll: SharedValue<number>;
  follow: () => void;
  commit: (order: string[]) => void;
  setEdge: (on: boolean) => void;
  count: number;
  step: number;
  itemWidth: number;
  itemHeight: number;
  still: boolean;
};

/** 사진 칸 하나 — 자리(pos, 칸 단위)로 옆으로 놓여요. 끄는 동안은 dragLeft(px) 를 따라가요 */
function Cell({ k, index, children, slots, dragging, dragLeft, startLeft, startTrans, startScroll, trans, scroll, follow, commit, setEdge, count, step, itemWidth, itemHeight, still }: CellProps) {
  const pos = useSharedValue(index);
  const lift = useSharedValue(0);
  const slide = still ? { duration: 0 } : SLIDE;

  // 내 자리가 바뀌면 (다른 사진이 지나가거나 · 넣기 · 빼기) 부드럽게 비켜요. 끄는 중인 나는 손가락을 따라가요
  useAnimatedReaction(
    () => slots.get()[k],
    (slot, prev) => {
      if (slot === undefined || dragging.get() === k) return;
      if (prev === null) pos.set(slot);
      else if (slot !== prev) pos.set(withTiming(slot, slide));
    },
  );

  const pan = Gesture.Pan()
    .enabled(count > 1)
    .activateAfterLongPress(HOLD_MS)
    .onStart((e) => {
      // 두 손가락으로 두 장을 같이 집으면 먼저 집은 것만
      if (dragging.get()) return;
      const left = pos.get() * step;
      dragging.set(k);
      dragLeft.set(left);
      startLeft.set(left);
      startTrans.set(e.translationX);
      trans.set(e.translationX);
      startScroll.set(scroll.get());
      lift.set(withTiming(1, { duration: still ? 0 : 120 }));
      scheduleOnRN(haptic, 'tap');
      scheduleOnRN(setEdge, true);
    })
    .onChange((e) => {
      if (dragging.get() !== k) return;
      trans.set(e.translationX);
      follow();
    })
    .onFinalize(() => {
      if (dragging.get() !== k) return;
      const map = slots.get();
      const slot = map[k] ?? 0;
      // 놓은 자리로 쏙 (손가락 자리에서 이어서)
      pos.set(dragLeft.get() / step);
      pos.set(withTiming(slot, slide));
      dragging.set('');
      lift.set(withTiming(0, { duration: still ? 0 : 180 }));
      scheduleOnRN(setEdge, false);
      scheduleOnRN(haptic, 'tap');
      scheduleOnRN(
        commit,
        Object.keys(map).sort((a, b) => map[a] - map[b]),
      );
    });

  const at = useAnimatedStyle(() => {
    const on = dragging.get() === k;
    const l = lift.get();
    return {
      zIndex: on || l > 0 ? 2 : 0,
      transform: [{ translateX: on ? dragLeft.get() : pos.get() * step }, { scale: 1 + l * (still ? 0 : 0.06) }],
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.cell, { width: itemWidth, height: itemHeight }, at]}>{children}</Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  cell: { position: 'absolute', left: 0, top: 0 },
});
