/**
 * 연동된 지점 안내(GET /me/branch-guides) 훅 — 화면은 여기 훅만 불러요 (api/branch-guide).
 */
import { useQuery } from '@tanstack/react-query';

import { useMe } from '@/state/me';

import { myBranchContact } from './branch-guide';
import { branchGuidesQuery } from './queries';

/** 고객센터 '내 지점 전화' — 지점이 콘솔 지점 안내에 적은 전화번호. 연동된 지점이 없거나 번호를 안 적었으면 data 가 null */
export function useMyBranchContact() {
  const myBranch = useMe().branch;
  return useQuery({ ...branchGuidesQuery(), select: (rows) => myBranchContact(rows, myBranch) });
}
