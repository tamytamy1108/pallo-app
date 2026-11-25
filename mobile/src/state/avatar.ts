/**
 * 내 캐릭터 꾸미기 — 저장한 모습 · 가진 아이템. 맞는 API: 34 `/me/avatar` · 36 `/me/avatar/purchase`.
 * 담당: 마이 A. 스파크 잔액은 state/me 의 sparks 를 같이 써요.
 * 저장하기 전 고르는 중인 모습(draft)은 꾸미기 화면이 들고 있어요 — [원래대로] = 여기 저장된 모습.
 */
import { AV_BG, AV_ITEM, AV_OWN0, AVC_LIST, avFresh, type AvCat, type Avatar } from '@/data/my';
import { createStore } from '@/lib/store';
import { award } from '@/state/ledger';
import { getMe } from '@/state/me';

type AvatarState = { saved: Avatar; own: string[] };

// 기기에 남아요 (프로토타입 `pallo-av`)
const store = createStore<AvatarState>({ saved: avFresh(), own: AV_OWN0 }, { persist: { key: 'avatar', load: loadAvatar } });

/** 저장된 모습 · 가진 것 확인: 아이템 목록이 바뀌어 없어진 것은 빼고, 새로 생긴 기본 아이템은 더해요 */
function loadAvatar(saved: unknown, initial: AvatarState): AvatarState {
  if (!saved || typeof saved !== 'object') return initial;
  const s = saved as Partial<AvatarState>;
  const a = s.saved;
  if (!a || typeof a !== 'object' || !a.eq) return initial;
  const fresh = avFresh();
  const eq = { ...fresh.eq };
  (Object.keys(eq) as AvCat[]).forEach((cat) => {
    const id = a.eq[cat];
    if (id === null || (typeof id === 'string' && AV_ITEM[id])) eq[cat] = id;
  });
  const color = typeof a.color === 'string' && (a.color[0] === '#' || AVC_LIST.some((c) => c[0] === a.color)) ? a.color : fresh.color;
  const bg = typeof a.bg === 'string' && (a.bg[0] === '#' || AV_BG.some((b) => b.id === a.bg)) ? a.bg : fresh.bg;
  const own = Array.isArray(s.own) ? [...new Set([...AV_OWN0, ...s.own.filter((k): k is string => typeof k === 'string')])] : initial.own;
  return {
    saved: { ...fresh, ...a, color, bg, eq, hc: typeof a.hc === 'string' ? a.hc : fresh.hc, say: typeof a.say === 'string' ? a.say : '', flip: !!a.flip },
    own,
  };
}

/** 저장된 내 모습 (홈 맵 · 마이 · 프로필 · 랭킹이 같이 써요) */
export const useMyAvatar = () => store.useStore((s) => s.saved);
export const getMyAvatar = () => store.get().saved;
export const useOwned = () => store.useStore((s) => s.own);

/** 직접 고른 색('#…')은 무료 · 나머지는 가진 것만 (프로토타입 avOwn) */
export const isOwned = (own: readonly string[], key: string) => key[0] === '#' || key.startsWith('bg:#') || own.includes(key);

export const cloneAvatar = (a: Avatar): Avatar => ({ ...a, eq: { ...a.eq } });

/** 새로 사야 하는 것 합계 · 이름 (프로토타입 avCost) */
export function avatarCost(d: Avatar, own: readonly string[]) {
  let cost = 0;
  const need: string[] = [];
  if (!isOwned(own, d.color)) {
    const c = AVC_LIST.find((k) => k[0] === d.color);
    if (c) {
      cost += c[2];
      need.push(c[1]);
    }
  }
  if (!isOwned(own, 'bg:' + d.bg)) {
    const b = AV_BG.find((k) => k.id === d.bg);
    if (b) {
      cost += b.price;
      need.push(b.name);
    }
  }
  Object.values(d.eq).forEach((id) => {
    const it = id ? AV_ITEM[id] : null;
    if (it && !isOwned(own, it.id)) {
      cost += it.price;
      need.push(it.name);
    }
  });
  return { cost, need };
}

const look = (a: Avatar) => JSON.stringify([a.color, a.bg, a.eq, a.flip, a.hc, a.say]);
export const avatarChanged = (d: Avatar, saved: Avatar) => look(d) !== look(saved);

/**
 * 몸 색만 바꿔 저장 (가입 끝에 캐릭터 고르기에서 고른 색을 옮겨요). 그 색은 가진 것으로 쳐요 — 가입 때 고른 색은 값을 받지 않아요.
 * 맞는 API: 4 `PATCH /me` 의 캐릭터 값을 서버가 /me/avatar 에도 반영.
 */
export function setAvatarBody(color: string) {
  store.set(({ saved, own }) => ({ saved: { ...cloneAvatar(saved), color }, own: own.includes(color) ? own : [...own, color] }));
}

/** 사고 저장하기: 스파크가 모자라면 저장하지 않고 모자란 수를 돌려줘요 */
export function buyAndSave(d: Avatar): { ok: true; cost: number; need: string[] } | { ok: false; short: number } {
  const { own } = store.get();
  const { cost, need } = avatarCost(d, own);
  const sparks = getMe().sparks;
  if (cost > sparks) return { ok: false, short: cost - sparks };
  const add = [d.color, 'bg:' + d.bg, ...Object.values(d.eq).filter((x): x is string => !!x)].filter((k) => !isOwned(own, k));
  award({ id: `shop:${Date.now()}`, type: 'shop', currency: 'sparks', amount: -cost });
  store.set({ saved: cloneAvatar(d), own: [...own, ...add] });
  return { ok: true, cost, need };
}

/** 서버가 돌려준 모습 · 가진 것으로 바꿔요 (api/avatar.ts — PUT /me/avatar · POST /me/avatar/purchase 응답) */
export function applyAvatarState(s: { saved: Avatar; own: readonly string[] }) {
  store.set({ saved: cloneAvatar(s.saved), own: [...new Set([...AV_OWN0, ...s.own])] });
}
