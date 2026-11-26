/**
 * 회원 · 비회원 권한 (state/access · docs/pages/09-onboarding.md '회원 · 비회원 권한') 테스트. 실행: npm test
 */
import { canUse, userKind } from '../access';

const base = { role: 'guest', link: 'none' } as const;

describe('userKind', () => {
  it('연동된 회원 · 처음 넣어 둔 회원은 member', () => {
    expect(userKind({ role: 'member', link: 'linked' })).toBe('member');
    expect(userKind({ role: 'leader', link: 'linked' })).toBe('member');
    expect(userKind({ role: 'member', link: 'none' })).toBe('member');
  });
  it('연동 대기 · 못 찾음은 역할과 상관없이 guest', () => {
    expect(userKind({ ...base, link: 'pending' })).toBe('guest');
    expect(userKind({ role: 'member', link: 'pending' })).toBe('guest');
    expect(userKind({ role: 'manager', link: 'rejected' })).toBe('guest');
  });
  it('연동 안 한 비회원은 guest', () => {
    expect(userKind(base)).toBe('guest');
    expect(userKind({ role: 'guest', link: 'linked' })).toBe('guest');
  });
});

describe('canUse', () => {
  it('회원은 전부', () => {
    for (const f of ['attendance', 'settings', 'allChapters', 'fullScroll', 'lesson'] as const) expect(canUse({ role: 'member', link: 'linked' }, f)).toBe(true);
  });
  it('비회원은 누구나 쓰는 것만 — 앱 구독만 여는 예외는 없어요', () => {
    for (const me of [base, { ...base, link: 'pending' as const }, { ...base, link: 'rejected' as const }]) {
      for (const f of ['attendance', 'proNote', 'settings', 'allChapters', 'fullScroll'] as const) expect(canUse(me, f)).toBe(false);
      expect(canUse(me, 'lesson')).toBe(true);
      expect(canUse(me, 'like')).toBe(true);
    }
  });
});
