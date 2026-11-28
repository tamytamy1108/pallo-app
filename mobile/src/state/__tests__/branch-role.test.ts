import { myBranches, topBranchRole } from '@/state/me';

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

describe('myBranches', () => {
  it('정한 지점이 먼저 · 겹치면 한 번만', () => {
    expect(myBranches({ branch: '하남점', branchRoles: [{ branch: '잠실점', role: 'member' }, { branch: '하남점', role: 'leader' }] })).toEqual(['하남점', '잠실점']);
  });
  it('지점별 역할이 없으면 내 지점 하나', () => {
    expect(myBranches({ branch: '하남점' })).toEqual(['하남점']);
  });
});
