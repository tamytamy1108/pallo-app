/**
 * 이벤트 제안 훅 — 내 제안 목록 · 분류 선택지 · 보내기(사진 업로드 → 제안) · 취소.
 * 보내기 · 취소가 끝나면 내 제안 목록을 다시 받아요.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  cancelEventProposal,
  createEventProposal,
  uploadEventPhoto,
  type EventProposal,
  type EventProposalBody,
} from './event-proposals';
import { eventCategoriesQuery, eventProposalsQuery, queryKeys } from './queries';

/** 이벤트 탭에 보여 줄 내 제안 — 내가 취소한 건 빼요 (최근 보낸 순은 서버 그대로) */
export const visibleProposals = (rows: EventProposal[]): EventProposal[] => rows.filter((r) => r.status !== 'CANCELED');

/** 내가 제안한 이벤트 (취소한 건 빼고) */
export function useMyEventProposals() {
  return useQuery({ ...eventProposalsQuery(), select: visibleProposals });
}

/** 이벤트 분류 선택지 */
export function useEventCategories() {
  return useQuery(eventCategoriesQuery());
}

export type SubmitEventProposalInput = {
  body: Omit<EventProposalBody, 'photoPaths'>;
  /** 고른 사진(기기 uri) — 화면 순서대로 올려요 (0번이 대표) */
  photoUris: string[];
  /** 가짜 서버가 남길 지점 이름 */
  branchName: string;
};

/**
 * 제안 보내기 — 사진을 한 장씩 올린 뒤(순서 유지) 그 path 로 제안을 보내요.
 * 사진 하나라도 실패하면 제안은 보내지 않아요 (이미 올라간 사진은 서버에 쓰이지 않은 채 PENDING 으로 남아요).
 */
export function useSubmitEventProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ body, photoUris, branchName }: SubmitEventProposalInput) => {
      const photoPaths: string[] = [];
      for (const uri of photoUris) photoPaths.push(await uploadEventPhoto(uri));
      return createEventProposal({ ...body, photoPaths }, { branchName });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.eventProposals }),
  });
}

/** 대기 중인 내 제안 취소 */
export function useCancelEventProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelEventProposal(id),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.eventProposals }),
  });
}
