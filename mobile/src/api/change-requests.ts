/**
 * 연기 · 팀 · 지점 변경 신청 (api-inventory 39 `POST /me/change-requests`).
 * 신청은 바로 바뀌지 않고 운영진 전산으로 넘어가 '대기'로 남아요 — 운영진이 승인 · 반려하면 알림으로 알려 줘요.
 * 가짜 서버는 components/account/store 의 신청 칸에 대기로 넣어요 (내 스터디 카드가 같이 봐요).
 */
import { useMutation, useQuery } from '@tanstack/react-query';

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

// ---------- 지난 신청 (내 스터디 › 전체 보기) ----------

/** 지난 신청 하나 — txt 는 신청 글 그대로 (RequestSummary 가 읽어요) */
export type ChangeHistoryItem = {
  id: string;
  /** '연기' · '팀 변경' · '지점 이동' · '팀 추가' */
  label: string;
  txt: string;
  /** 신청한 날 'YYYY-MM-DD' */
  requestedAt: string;
  status: 'approved' | 'rejected' | 'canceled';
  /** 반려 사유 (운영진이 남긴 말) */
  reason?: string;
};

/**
 * (제안 · 새 API) GET /me/change-requests/history — 연기 · 팀 변경 · 지점 이동 지난 신청을 최근 순으로.
 * 지금 서버엔 대기 중인 1건(GET /me/course-change 의 pending*)만 있어요. 확인 중인 신청은 내 스터디 카드가 따로 보여요.
 * 가짜 서버: 아래 예시 3건.
 */
export function fetchChangeHistory(): Promise<ChangeHistoryItem[]> {
  if (apiConfig.useMock) return mock('changeHistory', () => SAMPLE_HISTORY);
  return http.get<ChangeHistoryItem[]>('/me/change-requests/history');
}

export function useChangeHistory() {
  return useQuery({ queryKey: ['me', 'change-requests', 'history'] as const, queryFn: fetchChangeHistory });
}

/** 예시 (목업) — 신청 글 모양은 me/change 가 만드는 것과 같아요 */
const SAMPLE_HISTORY: ChangeHistoryItem[] = [
  {
    id: 'h3',
    label: '연기',
    txt: '영어 화목 7시 30분 · 영어 월수 9시\n14일 연기 · 10/5(월)~10/18(일) · 10/19(월) 복귀',
    requestedAt: '2026-09-18',
    status: 'approved',
  },
  {
    id: 'h2',
    label: '지점 이동',
    txt: '일본어 토 오전 11시 → 일본어 토 오후 2시\n8/30(일)까지 지금 팀 · 9/5(토)부터 강남점',
    requestedAt: '2026-08-12',
    status: 'rejected',
    reason: '강남점 일본어 토요일 팀 자리가 다 찼어요. 다른 시간으로 다시 신청해 주세요.',
  },
  {
    id: 'h1',
    label: '팀 변경',
    txt: '영어 월수 7시 30분 → 영어 월수 9시\n7/26(일)까지 지금 팀 · 7/27(월)부터 뉴 팀',
    requestedAt: '2026-07-10',
    status: 'approved',
  },
];
