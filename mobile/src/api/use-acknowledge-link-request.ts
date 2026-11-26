/**
 * 반려 확인 (홈 반려 팝업 [확인]) — 누르는 순간 요약(branch-summary)의 반려 목록에서 빼서 팝업이 바로 내려가고(낙관적),
 * 실패하면 되돌려요. 끝나면 요약 · 연동 요청 이력을 다시 받아요.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { acknowledgeLinkRequest } from './branch-link';
import type { BranchSummary } from './branch-summary';
import { queryKeys } from './queries';

export function useAcknowledgeLinkRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acknowledgeLinkRequest,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.branchSummary });
      const before = queryClient.getQueryData<BranchSummary>(queryKeys.branchSummary);
      queryClient.setQueryData<BranchSummary>(queryKeys.branchSummary, (s) => (s ? { ...s, rejectedLinks: s.rejectedLinks.filter((r) => r.id !== id) } : s));
      return { before };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.before) queryClient.setQueryData(queryKeys.branchSummary, ctx.before);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.branchSummary });
      void queryClient.invalidateQueries({ queryKey: queryKeys.linkRequests });
    },
  });
}
