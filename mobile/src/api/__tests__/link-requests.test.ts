/**
 * 내 지점 연동 요청 내역 나누기 (api/use-link-requests splitLinkRequests) 테스트. 실행: npm test
 */
import type { LinkRequest } from '../branch-link';
import { splitLinkRequests } from '../use-link-requests';

const req = (over: Partial<LinkRequest>): LinkRequest => ({
  id: 'r1',
  branchCode: 'HANAM',
  branchName: '하남점',
  status: 'PENDING',
  realName: '김서현',
  phone: '010-1234-5678',
  rejectionReason: null,
  createdAt: '2026-11-20T01:00:00Z',
  decidedAt: null,
  acknowledgedAt: null,
  ...over,
});

describe('splitLinkRequests', () => {
  it('요청이 없으면 두 묶음 모두 비어 있어요', () => {
    expect(splitLinkRequests([])).toEqual({ pending: [], done: [], pendingCount: 0 });
  });

  it('확인 중 · 지난 요청으로 나누고, 각 묶음은 최근 요청 순이에요', () => {
    const g = splitLinkRequests([
      req({ id: 'old-ok', branchCode: 'GN', status: 'APPROVED', createdAt: '2026-11-01T00:00:00Z', decidedAt: '2026-11-02T00:00:00Z' }),
      req({ id: 'p1', createdAt: '2026-11-10T00:00:00Z' }),
      req({ id: 'p2', branchCode: 'HD', createdAt: '2026-11-15T00:00:00Z' }),
      req({ id: 'rej', branchCode: 'SW', status: 'REJECTED', createdAt: '2026-11-05T00:00:00Z', decidedAt: '2026-11-06T00:00:00Z' }),
    ]);
    expect(g.pending.map((r) => r.id)).toEqual(['p2', 'p1']);
    expect(g.done.map((r) => r.id)).toEqual(['rej', 'old-ok']);
    expect(g.pendingCount).toBe(2);
  });

  it('반려는 그 지점의 가장 최근 요청일 때만 다시 요청할 수 있어요', () => {
    const g = splitLinkRequests([
      req({ id: 'rej-old', status: 'REJECTED', createdAt: '2026-11-01T00:00:00Z' }),
      req({ id: 'retry', status: 'PENDING', createdAt: '2026-11-03T00:00:00Z' }),
      req({ id: 'rej-latest', branchCode: 'GN', status: 'REJECTED', createdAt: '2026-11-02T00:00:00Z' }),
    ]);
    const byId = Object.fromEntries([...g.pending, ...g.done].map((r) => [r.id, r.canRetry]));
    expect(byId).toEqual({ 'rej-old': false, retry: false, 'rej-latest': true });
  });

  it('옛 앱 요청(이름 · 번호 null)도 그대로 보여요', () => {
    const g = splitLinkRequests([req({ realName: null, phone: null, status: 'APPROVED' })]);
    expect(g.done[0]).toMatchObject({ realName: null, phone: null, canRetry: false });
  });
});
