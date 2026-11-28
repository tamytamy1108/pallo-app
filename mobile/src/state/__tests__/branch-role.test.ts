import { topBranchRole } from '@/state/me';

describe('topBranchRole', () => {
  it('하남점 프로 + 잠실점 멤버 → 프로 (하남점)', () => {
    expect(topBranchRole([{ branch: '잠실점', role: 'member' }, { branch: '하남점', role: 'leader' }])).toEqual({ branch: '하남점', role: 'leader' });
  });
  it('프로가 스텝보다 먼저', () => {
    expect(topBranchRole([{ branch: '잠실점', role: 'manager' }, { branch: '하남점', role: 'leader' }])?.role).toBe('leader');
  });
  it('같은 등급이면 먼저 온 지점', () => {
    expect(topBranchRole([{ branch: '잠실점', role: 'member' }, { branch: '하남점', role: 'member' }])?.branch).toBe('잠실점');
  });
  it('비어 있으면 null', () => {
    expect(topBranchRole([])).toBeNull();
  });
});
