/**
 * 스크롤 잠김 보기 → 3번마다 권유 시트 · 첫 챕터 끝 권유 (state/lock-hits) 테스트. 실행: npm test
 * 누름(탭)은 세지 않아요 — 그건 guardMember 가 늘 체험 안내 시트를 띄워요.
 */
import { chapterUpsell, closeUpsell, getLockHits, guideBusy, lockView, resetLockHits, setIntroOpen } from '../lock-hits';
import { updateMe } from '../me';

const mockToast = jest.fn();
jest.mock('@/components/ui/toast', () => ({ showToast: (m: string) => mockToast(m) }));

const guest = () => updateMe({ role: 'guest', link: 'none', trial: null, plan: 'study' });

beforeEach(() => {
  resetLockHits();
  mockToast.mockClear();
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

  it('연동 대기는 세지 않고 토스트만', () => {
    updateMe({ role: 'guest', link: 'pending', trial: null, plan: 'study' });
    for (let i = 0; i < 4; i++) expect(lockView()).toBe(false);
    expect(getLockHits()).toBe(0);
    chapterUpsell();
    expect(guideBusy()).toBe(false);
    expect(mockToast).toHaveBeenLastCalledWith('다음 챕터는 지점 연동이 끝나면 열려요');
  });

  it('첫 챕터 끝 권유는 바로 떠요', () => {
    guest();
    chapterUpsell();
    expect(guideBusy()).toBe(true);
  });
});
