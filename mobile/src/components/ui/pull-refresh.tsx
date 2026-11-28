import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useRef, useState } from 'react';
import { RefreshControl, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { Colors } from '@/constants/theme';
import { sfx } from '@/lib/feedback';

// 받아 오기가 아주 빨리 끝나도 도는 표시가 깜빡 사라지지 않게 이만큼은 보여 줘요
const MIN_SPIN_MS = 600;
// 맨 위에서 이만큼(pt) 더 끌어 내리면 '뽀옹' 소리 — 살짝 닿기만 한 건 빼요
const PULL_SOUND_PT = 10;

type ScrollEvent = NativeSyntheticEvent<NativeScrollEvent>;

/**
 * 화면을 아래로 끌어 내렸다 놓으면 새로고침해요: 지금 화면에 쓰이는 서버 데이터를 다시 받아요.
 * 끌어 내리기 시작하면 '뽀옹', 새로고침이 시작되면 '뾱' 효과음이 나요 (설정 › 효과음을 끄면 조용히).
 * '뽀옹'은 맨 위보다 더 끌려 내려가는 걸 스크롤 위치로 알아채요 — 아이폰만 (안드로이드는 화면이 늘어나지 않아 '뾱'만).
 *
 * 세로 ScrollView 에 `{...pull.scrollProps}` 로 펼쳐 넘겨요.
 * 화면에 자기 onScroll 이 따로 있으면 refreshControl · onScrollBeginDrag · onScrollEndDrag 를 넘기고, 자기 onScroll 안에서 pull.onScroll(e) 를 불러요.
 */
export function usePullRefresh() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  // 손가락으로 끌고 있는 동안만 — 놓은 뒤 튕겨 올라오는 건 소리 안 내요. 한 번 끌 때 한 번만
  const drag = useRef({ on: false, startY: 0, played: false, refreshing: false });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    drag.current.refreshing = true;
    sfx('refresh');
    const minSpin = new Promise((done) => setTimeout(done, MIN_SPIN_MS));
    try {
      await Promise.all([queryClient.refetchQueries({ type: 'active' }), minSpin]);
    } catch {
      // 실패한 칸은 각 화면의 오류 표시가 맡아요 — 여기선 도는 표시만 멈춰요
    } finally {
      setRefreshing(false);
      drag.current.refreshing = false;
    }
  }, [queryClient]);

  return useMemo(() => {
    const onScrollBeginDrag = (e: ScrollEvent) => {
      drag.current.on = true;
      drag.current.startY = e.nativeEvent.contentOffset.y;
      drag.current.played = false;
    };
    const onScrollEndDrag = () => {
      drag.current.on = false;
    };
    const onScroll = (e: ScrollEvent) => {
      const d = drag.current;
      if (!d.on || d.played || d.refreshing) return;
      // 맨 위(0, 위쪽 여백이 있으면 시작 위치)보다 더 내려가면
      if (e.nativeEvent.contentOffset.y < Math.min(d.startY, 0) - PULL_SOUND_PT) {
        d.played = true;
        sfx('pull');
      }
    };
    const refreshControl = <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.inkSub} colors={[Colors.purple]} />;
    return {
      refreshControl,
      onScroll,
      onScrollBeginDrag,
      onScrollEndDrag,
      scrollProps: { refreshControl, onScroll, onScrollBeginDrag, onScrollEndDrag, scrollEventThrottle: 16 },
    };
  }, [refreshing, onRefresh]);
}
