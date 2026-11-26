/**
 * 회원 · 비회원 권한 (state/access · docs/pages/09-onboarding.md '회원 · 비회원 권한') 테스트. 실행: npm test
 */
import { canUse, userKind } from '../access';

const guest = { memberAccessLevel: 'UNREGISTERED' } as const;
const member = { memberAccessLevel: 'ACTIVE_MEMBER' } as const;

describe('userKind — 서버 /me 의 memberAccessLevel 하나로', () => {
  it('지점 회원이면 member — 활성 멤버십이 없어도(INACTIVE_MEMBER)', () => {
    expect(userKind(member)).toBe('member');
    expect(userKind({ memberAccessLevel: 'INACTIVE_MEMBER' })).toBe('member');
  });
  it('지점 회원이 아니면 guest (연동 대기 · 반려 · 체험 예약도 여기)', () => {
    expect(userKind(guest)).toBe('guest');
  });
});

describe('canUse', () => {
  it('회원은 전부', () => {
    for (const f of ['attendance', 'settings', 'allChapters', 'fullScroll', 'lesson'] as const) expect(canUse(member, f)).toBe(true);
  });
  it('비회원은 누구나 쓰는 것만', () => {
    for (const f of ['attendance', 'proNote', 'allChapters', 'fullScroll'] as const) expect(canUse(guest, f)).toBe(false);
    expect(canUse(guest, 'lesson')).toBe(true);
    // 설정은 누구나 — 비회원도 로그아웃 · 알림 · 차단을 해야 해요
    expect(canUse(guest, 'settings')).toBe(true);
    expect(canUse(guest, 'like')).toBe(true);
  });
});
