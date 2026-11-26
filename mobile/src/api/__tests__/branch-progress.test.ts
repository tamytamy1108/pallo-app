/**
 * 비회원이 무엇을 기다리는지 (api/use-branch-progress) · 가짜 요약의 다가오는 체험 (api/branch-summary) 테스트. 실행: npm test
 */
import { EMPTY_BRANCH_SUMMARY, mockBranchSummary } from '../branch-summary';
import { queryKeys } from '../queries';
import { queryClient } from '../query-client';
import type { TrialApplication } from '../trial-applications';
import { getBranchProgress, toBranchProgress } from '../use-branch-progress';

const trialRow = (date: string, time: string, over: Partial<TrialApplication> = {}): TrialApplication => ({
  id: `t-${date}-${time}`,
  branchCode: 'HANAM',
  branchName: '하남점',
  branchPhone: null,
  languageCode: 'ja',
  languageLabel: '일본어',
  date,
  time,
  realName: '김체험',
  phone: '01012345678',
  note: null,
  createdAt: '2026-11-20T01:00:00Z',
  ...over,
});

describe('toBranchProgress', () => {
  it('빈 요약이면 아무것도 기다리지 않아요', () => {
    expect(toBranchProgress(EMPTY_BRANCH_SUMMARY)).toEqual({ pending: null, rejected: null, trial: null });
  });

  it('맨 앞 하나씩 · 체험은 카드 모양으로', () => {
    const p = toBranchProgress({
      pendingLinks: [{ id: 'p1', branchCode: 'HANAM', branchName: '하남점', requestedAt: 'x' }],
      rejectedLinks: [
        { id: 'r2', branchCode: 'A', branchName: 'A점', rejectionReason: null, decidedAt: '2' },
        { id: 'r1', branchCode: 'B', branchName: 'B점', rejectionReason: null, decidedAt: '1' },
      ],
      upcomingTrials: [{ id: 't1', branchCode: 'HANAM', branchName: '하남점', branchPhone: null, languageCode: 'JA', languageLabel: '일본어', date: '2026-12-03', time: '19:30' }],
    });
    expect(p.pending?.id).toBe('p1');
    expect(p.rejected?.id).toBe('r2');
    expect(p.trial).toEqual({ branch: '하남점', day: '2026-12-03', time: '19:30', lang: 'ja' });
  });

  it('앱이 모르는 언어 code 면 영어로 보여요', () => {
    const p = toBranchProgress({
      ...EMPTY_BRANCH_SUMMARY,
      upcomingTrials: [{ id: 't1', branchCode: 'H', branchName: 'H점', branchPhone: null, languageCode: 'fr', languageLabel: '프랑스어', date: '2026-12-03', time: '19:30' }],
    });
    expect(p.trial?.lang).toBe('en');
  });
});

describe('getBranchProgress', () => {
  afterEach(() => queryClient.clear());

  it('요약을 아직 안 받았으면 빈 것', () => {
    expect(getBranchProgress()).toEqual({ pending: null, rejected: null, trial: null });
  });

  it('받아 둔 요약을 읽어요', () => {
    queryClient.setQueryData(queryKeys.branchSummary, {
      ...EMPTY_BRANCH_SUMMARY,
      pendingLinks: [{ id: 'p1', branchCode: 'HANAM', branchName: '하남점', requestedAt: 'x' }],
    });
    expect(getBranchProgress().pending?.branchName).toBe('하남점');
  });
});

describe('mockBranchSummary 다가오는 체험', () => {
  const now = new Date(2026, 10, 26, 19, 30); // 11-26 19:30

  it('상담 시각이 지나지 않은 것만 · 가까운 순 (그 시각이 되면 빠져요)', () => {
    const s = mockBranchSummary([], [trialRow('2026-12-01', '10:00'), trialRow('2026-11-26', '19:30'), trialRow('2026-11-26', '19:31'), trialRow('2026-11-25', '20:00')], now);
    expect(s.upcomingTrials.map((t) => `${t.date} ${t.time}`)).toEqual(['2026-11-26 19:31', '2026-12-01 10:00']);
    expect(s.upcomingTrials[0]).toEqual({
      id: 't-2026-11-26-19:31',
      branchCode: 'HANAM',
      branchName: '하남점',
      branchPhone: null,
      languageCode: 'ja',
      languageLabel: '일본어',
      date: '2026-11-26',
      time: '19:31',
    });
  });

  it('신청이 없으면 빈 목록', () => {
    expect(mockBranchSummary([], [], now).upcomingTrials).toEqual([]);
  });
});
