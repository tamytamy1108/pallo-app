/**
 * 떠 있는 버튼(라운지 + · 이벤트 오픈하기)을 스크롤하는 동안 숨겨요.
 * 아래로 내리면 사라지고, 위로 올리면 다시 나와요. 맨 위 근처에서는 늘 보여요.
 * 멈췄을 때 다시 나오게 하면 그 자리의 버튼(동아리 만들기 등)을 또 가려서, 멈춰도 숨은 채로 둬요.
 * 숨어 있는 동안에는 눌리지 않아서 아래 칸(동아리 만들기 · 번개 열기 등)을 누를 수 있어요.
 *
 *   const fab = useHideOnScroll();
 *   <ScrollView onScroll={(e) => fab.onScroll(e.nativeEvent.contentOffset.y)} … />
 *   <Animated.View style={[…, fab.style]} pointerEvents={fab.hidden ? 'none' : 'box-none'}>…</Animated.View>
 */
import { useRef, useState } from 'react';
import { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { EASE } from '@/lib/motion';

/** 맨 위에서 이만큼 안이면 늘 보여요 */
const TOP_ZONE = 40;
/** 이만큼 넘게 움직여야 방향으로 쳐요 (손가락 떨림 무시) */
const MOVE = 4;
/** 숨을 때 아래로 내려가는 거리 */
const DROP = 24;

export function useHideOnScroll() {
  const still = useReducedMotion();
  const hide = useSharedValue(0);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const now = useRef(false);

  // 바뀔 때만 움직여요 (스크롤 알림마다 애니메이션을 새로 걸면 버벅여요)
  const set = (next: boolean) => {
    if (now.current === next) return;
    now.current = next;
    hide.set(withTiming(next ? 1 : 0, { duration: still ? 0 : 200, easing: EASE }));
    setHidden(next);
  };

  const onScroll = (y: number) => {
    const dy = y - lastY.current;
    lastY.current = y;
    if (y < TOP_ZONE) set(false);
    else if (dy > MOVE) set(true);
    else if (dy < -MOVE) set(false);
  };

  const style = useAnimatedStyle(() => ({ opacity: 1 - hide.value, transform: [{ translateY: hide.value * DROP }] }));

  return { onScroll, style, hidden };
}
