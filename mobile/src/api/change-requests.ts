/**
 * 연기 · 팀 · 지점 변경 신청 (api-inventory 39 `POST /me/change-requests`).
 * 신청은 바로 바뀌지 않고 운영진 전산으로 넘어가 '대기'로 남아요 — 운영진이 승인 · 반려하면 알림으로 알려 줘요.
 * 가짜 서버는 components/account/store 의 신청 칸에 대기로 넣어요 (내 스터디 카드가 같이 봐요).
 */
import { useMutation } from '@tanstack/react-query';

import { putChangeRequest, submitChangeRequest, type ChangeRequest } from '@/components/account/store';

import { http } from './client';
import { apiConfig } from './config';
import { mock } from './mock';

export type ChangeRequestBody = Pick<ChangeRequest, 'label' | 'txt' | 'msg' | 'reason'>;

/** 39 POST /me/change-requests → 받은 신청 (status: 'pending') */
export function requestChange(body: ChangeRequestBody): Promise<ChangeRequest> {
  if (apiConfig.useMock) return mock('changeRequest', () => submitChangeRequest(body));
  return http.post<ChangeRequest>('/me/change-requests', body);
}

/** 신청 보내기 훅 (신청 확인 화면) */
export function useRequestChange() {
  return useMutation({ mutationFn: requestChange, onSuccess: (saved) => putChangeRequest(saved) });
}
