import { clearSavedData } from '@/lib/store';
import { updateMe, type Me, type Role } from '@/state/me';

import { personaOf, USER_KIND_PATCH } from '../../.storybook/user-kinds';

type Ctx = { globals: Record<string, unknown> };

/**
 * 마이 · 계정 스토리 공통 바탕 — 기기에 남는 가게(나 · 설정 · 노트 · 표현함 · 신청 …)를 모두 처음 값으로 돌리고
 * 툴바 회원 유형을 다시 입힌다. 앞 스토리가 남긴 값(팔로우 · 읽음 · 신청 중 …)이 섞이지 않게 스토리마다 부른다.
 * 그다음 `patch` 로 나를 고친다 (이름 · 스파크 · 포인트 …). setup 이 함수를 돌려주면 스토리가 끝날 때 부른다.
 */
export function fresh(patch: Partial<Me> = {}, setup?: () => void | (() => void)) {
  return ({ globals }: Ctx) => {
    clearSavedData();
    updateMe({ ...USER_KIND_PATCH[personaOf(globals)], ...patch });
    return setup?.() ?? undefined;
  };
}

/** 회원(연동됨) 중 역할만 바꿔 본다 — 리더 · 매니저 */
export const asRole = (role: Exclude<Role, 'guest'>, setup?: () => void | (() => void)) => fresh({ role }, setup);

/** 팔로우 중인 멤버 (이름 → true) */
export const followingOf = (...names: string[]): Record<string, boolean> => Object.fromEntries(names.map((n) => [n, true]));
