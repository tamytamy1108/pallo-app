import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { RefreshControl } from 'react-native';

import { Colors } from '@/constants/theme';

// 받아 오기가 아주 빨리 끝나도 도는 표시가 깜빡 사라지지 않게 이만큼은 보여 줘요
const MIN_SPIN_MS = 600;

/**
 * 화면을 아래로 끌어 내렸다 놓으면 새로고침해요: 지금 화면에 쓰이는 서버 데이터를 다시 받아요.
 * 세로 ScrollView 의 `refreshControl` 에 그대로 넘겨요.
 */
export function usePullRefresh() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const minSpin = new Promise((done) => setTimeout(done, MIN_SPIN_MS));
    try {
      await Promise.all([queryClient.refetchQueries({ type: 'active' }), minSpin]);
    } catch {
      // 실패한 칸은 각 화면의 오류 표시가 맡아요 — 여기선 도는 표시만 멈춰요
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  return <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.inkSub} colors={[Colors.purple]} />;
}
