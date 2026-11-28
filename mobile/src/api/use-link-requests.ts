/**
 * 내 지점 연동 요청 내역 훅 — 설정 › 내 지점 (app/(app)/me/settings/branch). 화면은 이 훅만 불러요.
 * API: GET /me/branch-link-requests (api/branch-link) — 한 줄에 상세 값(이름 · 번호 · 처리 시각 · 지점이 남긴 말)이 다 있어 상세는 따로 부르지 않아요.
 */
import { useQuery } from '@tanstack/react-query';

import type { LinkRequest } from './branch-link';
import { linkRequestsQuery } from './queries';

export type LinkRequestRow = LinkRequest & {
  /** 반려됐고 그 지점의 가장 최근 요청이에요 → [다시 요청하기]. 반려 뒤 다시 보낸 옛 반려에는 없어요 */
  canRetry: boolean;
};

export type LinkRequestGroups = {
  /** 지점이 확인 중인 요청 — 최근 요청 순 */
  pending: LinkRequestRow[];
  /** 결론난 요청(연동됨 · 반려) — 최근 요청 순 */
  done: LinkRequestRow[];
  /** 확인 중인 요청 수 (설정 줄에 보여요) */
  pendingCount: number;
};

/** 확인 중 · 결론난 요청으로 나눠요. 지점마다 가장 최근 요청만 [다시 요청하기] 대상이에요 (서버 요약과 같은 기준) */
export function splitLinkRequests(rows: LinkRequest[]): LinkRequestGroups {
  const sorted = [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const latestByBranch = new Map<string, string>();
  for (const r of sorted) if (!latestByBranch.has(r.branchCode)) latestByBranch.set(r.branchCode, r.id);
  const view = sorted.map((r) => ({ ...r, canRetry: r.status === 'REJECTED' && latestByBranch.get(r.branchCode) === r.id }));
  const pending = view.filter((r) => r.status === 'PENDING');
  return { pending, done: view.filter((r) => r.status !== 'PENDING'), pendingCount: pending.length };
}

/** 내 연동 요청 내역 — 확인 중 · 지난 요청 */
export function useMyLinkRequests() {
  return useQuery({ ...linkRequestsQuery(), select: splitLinkRequests });
}
