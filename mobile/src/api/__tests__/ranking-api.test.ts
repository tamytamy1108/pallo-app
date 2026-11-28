/**
 * PALLO 랭킹 (api/ranking.ts · api/use-ranking.ts toRankingRow) — 가짜 서버 모양과 서버 줄 → 화면 줄 바꾸기.
 */
import { Colors } from '@/constants/theme';
import { RANK_COLORS, RANK_PEOPLE } from '@/data/my';
import { updateMe } from '@/state/me';

import { setMockOptions } from '../mock';
import { fetchBranchRanking, fetchMemberRanking, mockBranchRanking, mockMemberRanking } from '../ranking';
import { toRankingRow } from '../use-ranking';

jest.mock('../config', () => ({
  apiConfig: { env: 'dev', baseUrl: '', useMock: true, mockDelayMs: 0, timeoutMs: 15000 },
}));

afterEach(() => setMockOptions({ delayMs: 0, fail: [] }));

describe('개인 랭킹 (가짜 서버)', () => {
  it('이번 주 포인트가 0 이면 나는 순위에 없어요', () => {
    updateMe({ weekPoints: 0 });
    const r = mockMemberRanking('WEEK');
    expect(r.me).toEqual({ rank: null, points: 0 });
    expect(r.top).toHaveLength(10);
    expect(r.top.some((e) => e.isMe)).toBe(false);
    expect(r.around).toEqual([]);
    expect(r.pointsToTop10).toBeNull();
  });

  it('10위 안이면 top 에 내가 있고 근처 줄 · 남은 점수는 없어요', () => {
    updateMe({ weekPoints: 400 });
    const r = mockMemberRanking('WEEK');
    expect(r.me.rank).toBe(2);
    expect(r.top[1]).toMatchObject({ rank: 2, points: 400, isMe: true });
    expect(r.top).toHaveLength(10);
    expect(r.around).toEqual([]);
    expect(r.pointsToTop10).toBeNull();
  });

  it('11위(꼴찌)면 근처 줄은 나 한 줄, 10위까지 남은 점수를 줘요', () => {
    updateMe({ weekPoints: 10 });
    const r = mockMemberRanking('WEEK');
    const tenth = Math.min(...RANK_PEOPLE.map((p) => p.w));
    expect(r.me.rank).toBe(11);
    expect(r.around.map((e) => e.rank)).toEqual([11]);
    expect(r.pointsToTop10).toBe(tenth - 10 + 1);
  });

  it('이번 달은 이번 주 전까지 쌓인 포인트를 더해 순위를 매겨요', () => {
    updateMe({ weekPoints: 0 });
    expect(mockMemberRanking('MONTH').me.rank).not.toBeNull();
  });

  it('기간 시작은 월요일 · 1일이에요', () => {
    expect(new Date(mockMemberRanking('WEEK').periodStart).getDay()).toBe(1);
    expect(mockMemberRanking('MONTH').periodStart.endsWith('-01')).toBe(true);
  });

  it('서버가 실패하면 오류로 받아요', async () => {
    setMockOptions({ fail: ['memberRanking'] });
    await expect(fetchMemberRanking('WEEK')).rejects.toMatchObject({ code: 'mock_fail' });
  });
});

describe('지점 대항전 (가짜 서버)', () => {
  it('지점 합계 순 · 우리 지점 순위와 합계', async () => {
    updateMe({ weekPoints: 0, branch: '잠실점' });
    const r = await fetchBranchRanking('WEEK');
    const points = r.branches.map((b) => b.points);
    expect(points).toEqual([...points].sort((a, b) => b - a));
    expect(r.branches.map((b) => b.rank)).toEqual(r.branches.map((_, i) => i + 1));
    const jamsil = RANK_PEOPLE.filter((p) => p.b === '잠실점').reduce((a, p) => a + p.w, 0);
    expect(r.myBranch).toMatchObject({ branchName: '잠실점', points: jamsil });
    expect(r.branches.find((b) => b.isMine)?.rank).toBe(r.myBranch?.rank);
  });

  it('지점이 없으면 우리 지점은 null', () => {
    updateMe({ branch: '' });
    expect(mockBranchRanking('WEEK').myBranch).toBeNull();
  });
});

describe('서버 순위 줄 → 화면 줄', () => {
  it('순위 색 · 지점 없음은 빈 글자 · 나는 보라', () => {
    expect(toRankingRow({ rank: 2, code: 'M1', displayName: '익명 회원', branchName: null, points: 30, isMe: false })).toEqual({
      no: 2,
      code: 'M1',
      n: '익명 회원',
      b: '',
      pt: 30,
      c: RANK_COLORS[1],
      me: false,
    });
    expect(toRankingRow({ rank: 12, code: null, displayName: 'Me', branchName: '영등포', points: 5, isMe: true }).c).toBe(Colors.purple);
  });
});
