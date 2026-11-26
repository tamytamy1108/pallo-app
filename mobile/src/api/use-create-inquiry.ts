/**
 * 1:1 문의 보내기 (94 POST /me/inquiries) — 보내고 나면 내 문의 목록을 다시 받아요.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from './queries';
import { createInquiry } from './support';

export function useCreateInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInquiry,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.myInquiries }),
  });
}
