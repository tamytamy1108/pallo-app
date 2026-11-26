/**
 * 이벤트 제안 훅 — 내 제안 목록 · 분류 선택지 · 보내기(사진 업로드 → 제안) · 고치기 · 취소.
 * 보내기 · 고치기 · 취소가 끝나면 내 제안 목록을 다시 받아요.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiError, isApiError } from './errors';
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

/** 사진을 한 장씩 올려 path 로 (순서 유지). 이미 서버에 있는 사진(keep)은 그대로 써요 */
async function photoPathsOf(uris: string[], keep: readonly string[] = []) {
  const paths: string[] = [];
  for (const uri of uris) paths.push(keep.includes(uri) ? uri : await uploadEventPhoto(uri));
  return paths;
}

/**
 * 제안 보내기 — 사진을 한 장씩 올린 뒤(순서 유지) 그 path 로 제안을 보내요.
 * 사진 하나라도 실패하면 제안은 보내지 않아요 (이미 올라간 사진은 서버에 쓰이지 않은 채 PENDING 으로 남아요).
 */
export function useSubmitEventProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ body, photoUris, branchName }: SubmitEventProposalInput) => {
      const photoPaths = await photoPathsOf(photoUris);
      return createEventProposal({ ...body, photoPaths }, { branchName });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.eventProposals }),
  });
}

export type EditEventProposalInput = SubmitEventProposalInput & {
  /** 고치는 제안 (매니저 검토 중일 때만) */
  id: string;
  /** 원래 제안의 사진 path — 다시 올리지 않고 그대로 붙여요 */
  keepPhotos: string[];
};

/**
 * 검토 중인 제안 고치기. 서버에 제안 수정 API(PUT /event-proposals/{id})가 아직 없어서
 * 고친 내용으로 새 제안을 보낸 뒤 원래 제안을 취소해요 (목록에는 새 제안 하나만 남아요 · 보낸 날은 고친 날로 바뀌어요).
 * 그사이 매니저가 원래 제안을 처리했으면(409) 방금 보낸 새 제안을 거두고 '이미 처리됐어요'로 알려요.
 */
export function useEditEventProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, keepPhotos, body, photoUris, branchName }: EditEventProposalInput) => {
      const photoPaths = await photoPathsOf(photoUris, keepPhotos);
      const saved = await createEventProposal({ ...body, photoPaths }, { branchName });
      try {
        await cancelEventProposal(id);
      } catch (e) {
        await cancelEventProposal(saved.id).catch(() => undefined);
        if (isApiError(e) && e.status === 409)
          throw new ApiError({ kind: 'client', status: 409, code: 'illegal_operation', message: '매니저가 이미 처리한 제안이라 고칠 수 없어요.' });
        throw e;
      }
      return saved;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.eventProposals }),
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
