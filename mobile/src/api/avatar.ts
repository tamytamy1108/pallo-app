/**
 * 캐릭터 꾸미기 API (api-inventory 34 · 36, docs/api/openapi.yaml `/me/avatar` · `/me/avatar/purchase`).
 * 가짜 서버는 state/avatar.ts 의 buyAndSave 로 이 기기 안에서 사고 저장해요.
 * 진짜 서버: 응답(모습 · 가진 것 · 잔액)을 state/avatar · state/me 에 넣어요.
 */
import type { Avatar, AvCat } from '@/data/my';
import { applyAvatarState, buyAndSave, getMyAvatar, getOwned } from '@/state/avatar';
import { getMe } from '@/state/me';

import { http } from './client';
import { apiConfig } from './config';
import { ApiError } from './errors';
import { mock } from './mock';

/** 서버 모양 (AvatarLook): 앱 hc = hairColor · eq = equipped */
export type AvatarLook = {
  color: string;
  flip: boolean;
  bg: string;
  hairColor: string;
  say: string;
  equipped: Record<AvCat, string | null>;
};
export type MyAvatarState = { look: AvatarLook; owned: string[]; sparks: number };
export type PurchaseResult = { spent: number; bought: string[] };

export const toLook = (a: Avatar): AvatarLook => ({ color: a.color, flip: a.flip, bg: a.bg, hairColor: a.hc, say: a.say, equipped: { ...a.eq } });
export const fromLook = (l: AvatarLook): Avatar => ({ color: l.color, flip: l.flip, bg: l.bg, hc: l.hairColor, say: l.say, eq: { ...l.equipped } });

/** 서버 상태를 기기에 넣어요. 스파크는 스파크 도메인이 생기기 전까지 서버가 0 을 보내니 아직 넣지 않아요 (기기 값 그대로) */
export function applyServer(s: MyAvatarState) {
  applyAvatarState({ saved: fromLook(s.look), own: s.owned });
}

/** 서버 오류 코드 (openapi `/me/avatar/purchase` error) */
export const INSUFFICIENT_SPARKS = 'insufficient_sparks';
export const PRICE_CHANGED = 'price_changed';

/**
 * 36 POST /me/avatar/purchase — 사고 저장하기 (스파크 차감 + 저장을 한 번에).
 * expectedCost = 화면에 보여 준 합계 · requestId = 같은 구매를 다시 보낼 때 두 번 빼지 않게
 */
export function purchaseAvatar(d: Avatar, expectedCost: number, requestId: string): Promise<PurchaseResult> {
  if (apiConfig.useMock)
    return mock('purchaseAvatar', () => {
      const r = buyAndSave(d);
      if (!r.ok) throw new ApiError({ kind: 'client', status: 409, code: INSUFFICIENT_SPARKS, message: `스파크가 ${r.short.toLocaleString()}개 모자라요` });
      return { spent: r.cost, bought: r.need };
    });
  return http
    .post<MyAvatarState & PurchaseResult>('/me/avatar/purchase', { look: toLook(d), expectedCost, clientRequestId: requestId })
    .then((res) => {
      applyServer(res);
      return { spent: res.spent, bought: res.bought };
    });
}

/** 34 GET /me/avatar — 저장한 모습 · 가진 것 (가짜 서버는 이 기기에 남긴 값 그대로) */
export function fetchMyAvatar({ signal }: { signal?: AbortSignal } = {}): Promise<MyAvatarState> {
  if (apiConfig.useMock) return mock('myAvatar', () => ({ look: toLook(getMyAvatar()), owned: [...getOwned()], sparks: getMe().sparks }));
  return http.get<MyAvatarState>('/me/avatar', { signal });
}

/** 34 PUT /me/avatar — 새로 살 것이 없을 때 모습만 저장 */
export function saveAvatar(d: Avatar): Promise<void> {
  if (apiConfig.useMock)
    return mock('saveAvatar', () => {
      buyAndSave(d);
    });
  return http.put<MyAvatarState>('/me/avatar', toLook(d)).then(applyServer);
}
