/**
 * 떠 있는 버튼(라운지 + · 이벤트 오픈하기)을 스크롤하는 동안 숨겨요.
 * 아래로 내리면 사라지고, 위로 올리거나 스크롤을 멈추면 다시 나와요. 맨 위 근처에서는 늘 보여요 (2026-11-26 사용자 결정).
 * 맨 아래 끝(END_ZONE 안)에서는 멈춰도 숨은 채로 둬요 — 끝 여백을 모든 화면과 같게 줄여서(TabScrollEnd) 마지막 칸을 가리지 않게 (2026-11-28).
 * 숨어 있는 동안에는 눌리지 않아서 아래 칸(동아리 만들기 · 번개 열기 등)을 누를 수 있어요.
 *
 *   const fab = useHideOnScroll();
 *   <ScrollView onScroll={(e) => fab.onScroll(e.nativeEvent)} … />
 *   <Animated.View style={[…, fab.style]} pointerEvents={fab.hidden ? 'none' : 'box-none'}>…</Animated.View>
 */
import { useEffect, useRef, useState } from 'react';
import { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { EASE } from '@/lib/motion';

/** 맨 위에서 이만큼 안이면 늘 보여요 */
const TOP_ZONE = 40;
/** 이만큼 넘게 움직여야 방향으로 쳐요 (손가락 떨림 무시) */
const MOVE = 4;
/** 스크롤이 멈추고 이만큼 지나면 다시 나와요 (ms) */
const SHOW_AFTER = 700;
/** 맨 아래에서 이만큼 안이면 숨은 채로 (버튼 높이 60 + 여유) */
const END_ZONE = 90;
/** 숨을 때 아래로 내려가는 거리 */
const DROP = 24;

export function useHideOnScroll() {
  const still = useReducedMotion();
  const hide = useSharedValue(0);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const now = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  // 바뀔 때만 움직여요 (스크롤 알림마다 애니메이션을 새로 걸면 버벅여요)
  const set = (next: boolean) => {
    if (now.current === next) return;
    now.current = next;
    hide.set(withTiming(next ? 1 : 0, { duration: still ? 0 : 200, easing: EASE }));
    setHidden(next);
  };

  const onScroll = ({ contentOffset, layoutMeasurement, contentSize }: { contentOffset: { y: number }; layoutMeasurement: { height: number }; contentSize: { height: number } }) => {
    const y = contentOffset.y;
    const dy = y - lastY.current;
    lastY.current = y;
    if (timer.current) clearTimeout(timer.current);
    if (y >= TOP_ZONE && y + layoutMeasurement.height >= contentSize.height - END_ZONE) {
      set(true);
      return;
    }
    if (y < TOP_ZONE) set(false);
    else if (dy > MOVE) set(true);
    else if (dy < -MOVE) set(false);
    // 마지막 스크롤 알림 뒤 잠시 조용하면 멈춘 걸로 보고 다시 보여 줘요
    timer.current = setTimeout(() => set(false), SHOW_AFTER);
  };

  const style = useAnimatedStyle(() => ({ opacity: 1 - hide.value, transform: [{ translateY: hide.value * DROP }] }));

  return { onScroll, style, hidden };
}
