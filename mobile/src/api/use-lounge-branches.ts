/**
 * 라운지 · 이벤트가 같이 쓰는 지점 목록 — `GET /branches` (지점 시트와 같은 서버 목록, branchOptionsQuery).
 *
 * 고른 지점은 화면에 지점 이름(key)으로 남아요 (스토리 줄 · 지도 · 이벤트 같은 아직 가짜인 칸이 이름으로 거르니까).
 * 서버에 거르기를 보낼 때는 branchCodesOf 로 코드로 바꿔요.
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { branchOptionsQuery } from './queries';

export type LoungeBranch = {
  /** 고를 때 · 저장할 때 쓰는 값 (서버 지점 이름 그대로) */
  key: string;
  code: string;
  /** 보이는 이름 — 늘 '…점' */
  name: string;
  /** 권역 탭 (주소가 없으면 '기타') */
  region: string;
};

export const withJeom = (n: string) => (n.endsWith('점') ? n : `${n}점`);
/** 같은 지점 이름인지 ('가산' = '가산점') */
export const sameBranch = (a: string, b: string) => withJeom(a) === withJeom(b);

const EMPTY: LoungeBranch[] = [];

/** 라운지 지점 목록 (가나다순은 서버 순서 그대로). 받기 전 · 실패하면 빈 목록 */
export function useLoungeBranches(): LoungeBranch[] {
  const q = useQuery(branchOptionsQuery());
  return useMemo(() => (q.data ? q.data.map((b) => ({ key: b.name, code: b.code, name: withJeom(b.name), region: b.region ?? '기타' })) : EMPTY), [q.data]);
}

/** 고른 지점 이름들 → 서버 지점 코드 (목록에 없는 이름은 빠져요) */
export function branchCodesOf(list: LoungeBranch[], names: string[]): string[] {
  return names.flatMap((n) => list.filter((b) => sameBranch(b.key, n)).map((b) => b.code));
}
