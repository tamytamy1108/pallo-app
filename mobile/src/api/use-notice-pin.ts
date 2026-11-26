/**
 * 공지 고정 / 풀기 (공지 상세 위 압정 버튼) — 누르는 순간 상세의 압정 모양을 바꾸고(낙관적), 실패하면 되돌려요.
 * 끝나면 공지 목록 · 홈 띠를 다시 받아요 (고정한 공지가 맨 위로 올라가요). 고정은 사람마다 따로예요.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { NoticeDetail } from '@/data/mock';

import { setNoticePinned } from './home';
import { queryKeys } from './queries';

export function useNoticePin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setNoticePinned,
    onMutate: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      const key = queryKeys.notice(id);
      await queryClient.cancelQueries({ queryKey: key });
      const before = queryClient.getQueryData<NoticeDetail>(key);
      queryClient.setQueryData<NoticeDetail>(key, (n) => (n ? { ...n, pinned } : n));
      return { before };
    },
    onError: (_e, { id }, ctx) => {
      if (ctx?.before) queryClient.setQueryData(queryKeys.notice(id), ctx.before);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['notices'] });
    },
  });
}
