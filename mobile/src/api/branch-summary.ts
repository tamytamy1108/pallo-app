/**
 * 내 지점 진행 상황 요약 (BFF) — `GET /app/api/v2/me/branch-summary`.
 * 홈 · 마이 · 잠김 칸이 같은 쿼리를 나눠 써요. 고르는 판정은 서버가 해요:
 * - pendingLinks:   지점마다 가장 최근 연동 요청이 대기(PENDING)인 것
 * - rejectedLinks:  지점마다 가장 최근 연동 요청이 반려(REJECTED)이고 아직 확인하지 않은 것 (최신 반려 순) → 홈 반려 팝업
 * - upcomingTrials: 체험 상담 신청 중 상담 시각(KST)이 아직 안 지난 것 (가까운 순) → 홈 체험 카드
 * 전체 이력은 따로: 연동 요청 GET /me/branch-link-requests · 상담 신청 GET /trial-applications.
 *
 * 가짜 서버는 api/branch-link 의 가짜 요청 목록 · api/trial-applications 의 가짜 신청 목록으로 위 판정을 흉내 내요.
 */
import { nowDate } from '@/components/home/attendance';

import { getMockLinkRequests, type LinkRequest } from './branch-link';
import { http } from './client';
import { apiConfig } from './config';
import { mock } from './mock';
import { getMockTrialApplications, type TrialApplication } from './trial-applications';

type Opts = { signal?: AbortSignal };

export type PendingLink = { id: string; branchCode: string; branchName: string; requestedAt: string };
export type RejectedLink = { id: string; branchCode: string; branchName: string; rejectionReason: string | null; decidedAt: string };
export type UpcomingTrial = { id: string; branchCode: string; branchName: string; branchPhone: string | null; languageCode: string; languageLabel: string; date: string; time: string };

export type BranchSummary = {
  pendingLinks: PendingLink[];
  rejectedLinks: RejectedLink[];
  upcomingTrials: UpcomingTrial[];
};

export const EMPTY_BRANCH_SUMMARY: BranchSummary = { pendingLinks: [], rejectedLinks: [], upcomingTrials: [] };

/** 기기 시각(개발용 시간 이동 포함)을 'YYYY-MM-DD HH:mm' 로 — 신청 date · time 과 글자로 비교해요 */
const stamp = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** 가짜 서버의 판정: 지점마다 가장 최근 요청 하나로 대기 · 확인 안 한 반려를, 상담 시각이 안 지난 신청으로 다가오는 체험(가까운 순)을 골라요 */
export function mockBranchSummary(rows: LinkRequest[], trials: TrialApplication[] = [], now: Date = nowDate()): BranchSummary {
  const latest = new Map<string, LinkRequest>();
  for (const r of rows) {
    const prev = latest.get(r.branchCode);
    if (!prev || r.createdAt > prev.createdAt) latest.set(r.branchCode, r);
  }
  const last = [...latest.values()];
  const at = stamp(now);
  return {
    pendingLinks: last.filter((r) => r.status === 'PENDING').map((r) => ({ id: r.id, branchCode: r.branchCode, branchName: r.branchName, requestedAt: r.createdAt })),
    rejectedLinks: last
      .filter((r) => r.status === 'REJECTED' && !r.acknowledgedAt)
      .map((r) => ({ id: r.id, branchCode: r.branchCode, branchName: r.branchName, rejectionReason: r.rejectionReason, decidedAt: r.decidedAt ?? r.createdAt }))
      .sort((a, b) => b.decidedAt.localeCompare(a.decidedAt)),
    upcomingTrials: trials
      .filter((t) => `${t.date} ${t.time}` > at)
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
      .map((t) => ({ id: t.id, branchCode: t.branchCode, branchName: t.branchName, branchPhone: t.branchPhone, languageCode: t.languageCode, languageLabel: t.languageLabel, date: t.date, time: t.time })),
  };
}

/** GET /me/branch-summary */
export function fetchBranchSummary({ signal }: Opts = {}): Promise<BranchSummary> {
  if (apiConfig.useMock) return mock('branchSummary', () => mockBranchSummary(getMockLinkRequests(), getMockTrialApplications()));
  return http.get('/me/branch-summary', { signal });
}
