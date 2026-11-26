/**
 * 내 지점 연동 요청 API — 백엔드 `MobileBranchLinkRequestV2Controller` (`/app/api/v2/me/branch-link-requests`).
 * - GET  /me/branch-link-requests                    내 요청 (최신 순)
 * - POST /me/branch-link-requests                    가입을 마친 뒤 보내는 요청 (못 찾음 뒤 고쳐서 다시 등). 가입 단계 안의 요청은 POST /onboarding 이 받아요
 * - POST /me/branch-link-requests/:id/acknowledge    반려 확인 (내 요청만 404 · REJECTED 아니면 409 · 다시 눌러도 204)
 *
 * 홈 반려 팝업 · 연동 대기 표시는 이 목록이 아니라 요약(api/branch-summary)을 봐요 — 이 목록은 이력 전체가 필요한 화면용.
 * 가짜 서버는 이 파일의 목록(mockRequests)을 읽고 써요. 개발용 '지점 처리 흉내'(state/link-events)가 못 찾음으로 보내면 반려 한 건이 쌓여요.
 */
import { http } from './client';
import { apiConfig } from './config';
import { mock, mockNotFound } from './mock';

type Opts = { signal?: AbortSignal };

export type LinkRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** 백엔드 BranchLinkRequestV2Response + acknowledgedAt (반려를 확인한 시각 — 새로 붙여요) */
export type LinkRequest = {
  id: string;
  branchCode: string;
  branchName: string;
  status: LinkRequestStatus;
  realName: string | null;
  phone: string | null;
  /** 지점이 남긴 반려 사유 (결론난 요청에만) */
  rejectionReason: string | null;
  createdAt: string;
  decidedAt: string | null;
  /** 반려를 확인한 시각 (확인 전 · 반려가 아니면 null) */
  acknowledgedAt: string | null;
};

let mockRequests: LinkRequest[] = [];
let mockSeq = 0;

/** 개발용: 지점이 '못 찾음'으로 보낸 것처럼 반려 한 건을 맨 앞에 쌓아요 (state/link-events receiveLinkResult) */
export function mockRejectLinkRequest(branchName: string, reason: string | null) {
  const now = new Date().toISOString();
  mockRequests = [
    { id: `mock-link-${++mockSeq}`, branchCode: branchName, branchName, status: 'REJECTED', realName: null, phone: null, rejectionReason: reason, createdAt: now, decidedAt: now, acknowledgedAt: null },
    ...mockRequests,
  ];
}

/** 개발용: 지점이 연동해 준 것처럼 승인 한 건을 맨 앞에 쌓아요 — 지점마다 가장 최근 요청만 보므로 대기가 요약에서 빠져요 (state/link-events) */
export function mockApproveLinkRequest(branchName: string) {
  const now = new Date().toISOString();
  mockRequests = [
    { id: `mock-link-${++mockSeq}`, branchCode: branchName, branchName, status: 'APPROVED', realName: null, phone: null, rejectionReason: null, createdAt: now, decidedAt: now, acknowledgedAt: null },
    ...mockRequests,
  ];
}

/** 가짜 서버: 대기 중인 요청 한 건을 맨 앞에 쌓아요 (가입 단계 · 가입 뒤 요청이 같이 써요) */
export function mockAddPendingLinkRequest(branchCode: string, branchName: string, realName: string, phone: string): LinkRequest {
  const row: LinkRequest = { id: `mock-link-${++mockSeq}`, branchCode, branchName, status: 'PENDING', realName, phone, rejectionReason: null, createdAt: new Date().toISOString(), decidedAt: null, acknowledgedAt: null };
  mockRequests = [row, ...mockRequests];
  return { ...row };
}

/** 스토리 · 테스트용: 가짜 서버의 내 요청 목록을 통째로 바꿔요 */
export function setMockLinkRequests(rows: LinkRequest[]) {
  mockRequests = rows.map((r) => ({ ...r }));
}

/** 가짜 서버의 내 요청 목록 (가짜 요약 api/branch-summary 가 읽어요) */
export const getMockLinkRequests = (): LinkRequest[] => mockRequests.map((r) => ({ ...r }));

/** GET /me/branch-link-requests — 내 요청 (최신 순) */
export function fetchMyLinkRequests({ signal }: Opts = {}): Promise<LinkRequest[]> {
  if (apiConfig.useMock) return mock('linkRequests', getMockLinkRequests);
  return http.get('/me/branch-link-requests', { signal });
}

export type LinkRequestBody = { branchCode: string; realName: string; phone: string };

/** POST /me/branch-link-requests — 가입을 마친 뒤 연동 요청 (지점마다 대기 중 하나, 이미 연동 · 대기면 409) */
export function createLinkRequest(body: LinkRequestBody, branchName: string): Promise<LinkRequest> {
  if (apiConfig.useMock) return mock('createLinkRequest', () => mockAddPendingLinkRequest(body.branchCode, branchName, body.realName, body.phone));
  return http.post('/me/branch-link-requests', body);
}

/** POST /me/branch-link-requests/:id/acknowledge — 반려 확인 (홈 반려 팝업 [확인]) */
export function acknowledgeLinkRequest(id: string): Promise<void> {
  if (apiConfig.useMock)
    return mock('acknowledgeLinkRequest', () => {
      const found = mockRequests.find((r) => r.id === id);
      if (!found) throw mockNotFound();
      if (!found.acknowledgedAt) mockRequests = mockRequests.map((r) => (r.id === id ? { ...r, acknowledgedAt: new Date().toISOString() } : r));
    });
  return http.post(`/me/branch-link-requests/${encodeURIComponent(id)}/acknowledge`);
}
