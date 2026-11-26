/**
 * 오늘 지점 현황 (지점 관리자) — 홈 요약 카드 · 모두 보기 화면이 같이 써요.
 * 데이터는 GET /manager/branch/today, 순서 · 합계는 lib/branch-today-view.
 */
import { useMutation, useQuery } from '@tanstack/react-query';

import { minuteOf, useClock } from '@/components/home/attendance';
import { QR_AFTER, QR_BEFORE } from '@/data/home';
import { toBranchTodayView, type BranchTodayView } from '@/lib/branch-today-view';

import { sendProCheckIn } from './branch-today';
import { branchTodayQuery, queryKeys } from './queries';
import { queryClient } from './query-client';

export function useBranchToday(enabled = true): { view: BranchTodayView | null; isPending: boolean; isError: boolean; refetch: () => void } {
  const now = useClock();
  const q = useQuery({ ...branchTodayQuery(), enabled });
  const view = q.data ? toBranchTodayView(q.data, minuteOf(now), QR_BEFORE, QR_AFTER) : null;
  return { view, isPending: q.isPending, isError: q.isError, refetch: () => void q.refetch() };
}

/** 출석한 뒤 현황 숫자를 바로 다시 받아요 (멤버로 · 프로로 둘 다) */
export const refreshBranchToday = () => queryClient.invalidateQueries({ queryKey: queryKeys.branchToday });

/** 스텝 · 프로가 '프로로 참여' */
export function useProCheckIn(onDone: () => void, onError: (e: unknown) => void) {
  return useMutation({
    mutationFn: sendProCheckIn,
    onSuccess: () => {
      void refreshBranchToday();
      onDone();
    },
    onError,
  });
}
