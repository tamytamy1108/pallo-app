/**
 * 스크롤 잠김 보기 → 3번마다 권유 시트 · 첫 챕터 끝 권유 (state/lock-hits) 테스트. 실행: npm test
 * 누름(탭)은 세지 않아요 — 그건 guardMember 가 늘 체험 안내 시트를 띄워요.
 */
import { EMPTY_BRANCH_SUMMARY, type BranchSummary } from '@/api/branch-summary';
import { queryKeys } from '@/api/queries';
import { queryClient } from '@/api/query-client';

import { chapterUpsell, closeUpsell, getLockHits, guideBusy, lockView, resetLockHits, setIntroOpen } from '../lock-hits';
import { updateMe } from '../me';

const mockToast = jest.fn();
jest.mock('@/components/ui/toast', () => ({ showToast: (m: string) => mockToast(m) }));

const guest = () => updateMe({ role: 'guest', link: 'none', trial: null, plan: 'study' });

/** 서버 요약(연동 대기 · 확인 안 한 반려 · 다가오는 체험)을 받아 둔 것처럼 */
const summary = (s: Partial<BranchSummary>) => queryClient.setQueryData(queryKeys.branchSummary, { ...EMPTY_BRANCH_SUMMARY, ...s });
const PENDING = { id: 'p1', branchCode: 'HANAM', branchName: '하남점', requestedAt: '2026-11-25T01:00:00Z' };
const REJECTED = { id: 'r1', branchCode: 'HANAM', branchName: '하남점', rejectionReason: null, decidedAt: '2026-11-25T03:00:00Z' };
const TRIAL = { id: 't1', branchCode: 'HANAM', branchName: '하남점', branchPhone: null, languageCode: 'en', languageLabel: '영어', date: '2026-12-03', time: '19:30' };

beforeEach(() => {
  resetLockHits();
  mockToast.mockClear();
  queryClient.clear();
});

describe('lockView', () => {
  it('회원은 세지 않아요', () => {
    updateMe({ role: 'member', link: 'linked', trial: null, plan: 'study' });
    expect(lockView()).toBe(false);
    expect(getLockHits()).toBe(0);
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('비회원은 3번째마다 권유 시트, 그 밖엔 토스트', () => {
    guest();
    expect(lockView('a')).toBe(false);
    expect(lockView('b')).toBe(false);
    expect(lockView('c')).toBe(true);
    expect(mockToast).toHaveBeenCalledTimes(2);
    expect(guideBusy()).toBe(true);
    closeUpsell();
    lockView();
    lockView();
    expect(lockView()).toBe(true);
    expect(getLockHits()).toBe(6);
  });

  it('다른 시트가 떠 있으면 겹쳐 띄우지 않아요', () => {
    guest();
    lockView();
    lockView();
    setIntroOpen(true);
    expect(lockView()).toBe(false);
    setIntroOpen(false);
    expect(guideBusy()).toBe(false);
  });

  it('연동 대기(서버 요약)는 세지 않고 토스트만', () => {
    guest();
    summary({ pendingLinks: [PENDING] });
    for (let i = 0; i < 4; i++) expect(lockView()).toBe(false);
    expect(getLockHits()).toBe(0);
    chapterUpsell();
    expect(guideBusy()).toBe(false);
    expect(mockToast).toHaveBeenLastCalledWith('다음 챕터는 지점 연동이 끝나면 열려요');
  });

  it('확인 안 한 반려(서버 요약)도 세지 않고 토스트만', () => {
    guest();
    summary({ rejectedLinks: [REJECTED] });
    for (let i = 0; i < 4; i++) expect(lockView()).toBe(false);
    expect(getLockHits()).toBe(0);
    expect(mockToast).toHaveBeenLastCalledWith('지점 연동이 필요해요');
    chapterUpsell();
    expect(guideBusy()).toBe(false);
    expect(mockToast).toHaveBeenLastCalledWith('다음 챕터는 지점 연동이 필요해요');
  });

  it('회원이면 요약에 대기가 남아 있어도 아무 일 없어요', () => {
    updateMe({ role: 'member', link: 'linked', trial: null, plan: 'study' });
    summary({ pendingLinks: [PENDING], upcomingTrials: [TRIAL] });
    expect(lockView()).toBe(false);
    chapterUpsell();
    expect(guideBusy()).toBe(false);
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('다가오는 체험이 있으면 첫 챕터 끝에 예약한 체험 시트', () => {
    guest();
    summary({ upcomingTrials: [TRIAL] });
    chapterUpsell();
    expect(guideBusy()).toBe(true);
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('첫 챕터 끝 권유는 바로 떠요', () => {
    guest();
    chapterUpsell();
    expect(guideBusy()).toBe(true);
  });
});
