/**
 * 회원 · 비회원 권한 (state/access · docs/pages/09-onboarding.md '회원 · 비회원 권한') 테스트. 실행: npm test
 */
import { canUse, userKind } from '../access';

const base = { role: 'guest', link: 'none', trial: null, plan: 'study' } as const;
const trial = { branch: '영등포점', day: '2026-11-27', time: '19:30', lang: 'en' } as const;

describe('userKind', () => {
  it('연동된 회원 · 처음 넣어 둔 회원', () => {
    expect(userKind({ ...base, role: 'member', link: 'linked' })).toBe('member');
    expect(userKind({ ...base, role: 'leader', link: 'linked' })).toBe('member');
  });
  it('연동 대기 · 못 찾음은 역할과 상관없이 회원이 아니에요', () => {
    expect(userKind({ ...base, link: 'pending' })).toBe('pending');
    expect(userKind({ ...base, role: 'member', link: 'pending' })).toBe('pending');
    expect(userKind({ ...base, link: 'rejected' })).toBe('rejected');
  });
  it('체험 예약 · 앱 구독 · 둘러보기', () => {
    expect(userKind({ ...base, trial })).toBe('trial');
    expect(userKind({ ...base, plan: 'app' })).toBe('app');
    expect(userKind(base)).toBe('guest');
  });
});

describe('canUse', () => {
  it('회원 전용은 회원만', () => {
    expect(canUse({ ...base, role: 'member', link: 'linked' }, 'attendance')).toBe(true);
    for (const me of [base, { ...base, link: 'pending' as const }, { ...base, trial }, { ...base, plan: 'app' as const }]) {
      expect(canUse(me, 'attendance')).toBe(false);
      expect(canUse(me, 'proNote')).toBe(false);
      expect(canUse(me, 'lesson')).toBe(true);
      expect(canUse(me, 'like')).toBe(true);
    }
  });
});
