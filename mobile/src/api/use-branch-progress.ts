/**
 * 비회원이 지금 무엇을 기다리는지 — 요약(GET /me/branch-summary)에서 맨 앞 하나씩: 연동 대기 · 확인 안 한 반려 · 다가오는 체험.
 * 회원 · 비회원(state/access userKind)과는 따로예요. 잠김 칸 · 막힘 안내 · 홈 체험 카드가 이걸 보고 문구 · 버튼을 골라요.
 * - 화면: useBranchProgress()
 * - 누를 때 판정하는 곳(guardMember · lock-hits): getBranchProgress() — 받아 둔 요약을 읽어요 (아직 안 받았으면 빈 것)
 */
import { useQuery } from '@tanstack/react-query';

import type { TrialBooking } from '@/components/common/trial-booking';
import { toStudyLang } from '@/state/onboarding';

import { EMPTY_BRANCH_SUMMARY, type BranchSummary, type PendingLink, type RejectedLink } from './branch-summary';
import { branchSummaryQuery, queryKeys } from './queries';
import { queryClient } from './query-client';

export type BranchProgress = {
  pending: PendingLink | null;
  rejected: RejectedLink | null;
  /** 가장 가까운 체험 (체험 카드 · 예약 내용 시트 모양) */
  trial: TrialBooking | null;
};

export function toBranchProgress(s: BranchSummary): BranchProgress {
  const t = s.upcomingTrials[0];
  return {
    pending: s.pendingLinks[0] ?? null,
    rejected: s.rejectedLinks[0] ?? null,
    trial: t ? { branch: t.branchName, day: t.date, time: t.time, lang: toStudyLang(t.languageCode) ?? 'en' } : null,
  };
}

const EMPTY = toBranchProgress(EMPTY_BRANCH_SUMMARY);

export function useBranchProgress(): BranchProgress {
  const { data } = useQuery({ ...branchSummaryQuery(), select: toBranchProgress });
  return data ?? EMPTY;
}

export function getBranchProgress(): BranchProgress {
  const s = queryClient.getQueryData<BranchSummary>(queryKeys.branchSummary);
  return s ? toBranchProgress(s) : EMPTY;
}
