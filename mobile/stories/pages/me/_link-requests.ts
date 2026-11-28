/**
 * 지점 연동 요청 샘플 — 설정 › 내 지점 줄 · 내 지점 목록 · 요청 내용 시트 스토리가 같이 써요.
 * 값은 GET /me/branch-link-requests 응답 모양 그대로 (가짜 서버 목록 · 쿼리 캐시 둘 다 이 값으로 채워요).
 */
import { setMockLinkRequests, type LinkRequest } from '@/api/branch-link';
import { linkRequestsQuery } from '@/api/queries';

export const LINK_REQUESTS_KEY = linkRequestsQuery().queryKey;

const daysAgo = (n: number, hour = 14) => {
  const d = new Date(Date.now() - n * 86400000);
  d.setHours(hour, 20, 0, 0);
  return d.toISOString();
};

export const linkRow = (over: Partial<LinkRequest>): LinkRequest => ({
  id: 'l1',
  branchCode: 'HANAM',
  branchName: '하남점',
  status: 'PENDING',
  realName: '김서현',
  phone: '010-1234-5678',
  rejectionReason: null,
  createdAt: daysAgo(1),
  decidedAt: null,
  acknowledgedAt: null,
  ...over,
});

/** 확인 중 둘 · 반려 하나(최근 → 다시 요청 가능) · 연동됨 하나 · 옛 앱 반려 하나(뒤에 다시 보냄) */
export const LINK_SAMPLE: LinkRequest[] = [
  linkRow({ id: 'l5', createdAt: daysAgo(0, 10) }),
  linkRow({ id: 'l4', branchCode: 'JAMSIL', branchName: '잠실점', createdAt: daysAgo(2) }),
  linkRow({ id: 'l3', branchCode: 'GANGNAM', branchName: '강남점', status: 'REJECTED', rejectionReason: '등록된 번호가 달라요', createdAt: daysAgo(6), decidedAt: daysAgo(5, 11) }),
  linkRow({ id: 'l2', branchCode: 'HONGDAE', branchName: '홍대점', status: 'APPROVED', createdAt: daysAgo(30), decidedAt: daysAgo(29, 16) }),
  linkRow({ id: 'l1', status: 'REJECTED', realName: null, phone: null, createdAt: daysAgo(40), decidedAt: daysAgo(39) }),
];

/** 스토리 전에 가짜 서버 목록을 채우고, 끝나면 비워요 (fresh 의 setup 으로) */
export const seedLinkRequests = (rows: LinkRequest[]) => () => {
  setMockLinkRequests(rows);
  return () => setMockLinkRequests([]);
};
