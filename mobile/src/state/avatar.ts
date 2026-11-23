/**
 * 내 캐릭터 꾸미기 — 저장한 모습 · 가진 아이템. 맞는 API: 34 `/me/avatar` · 36 `/me/avatar/purchase`.
 * 담당: 마이 A. 스파크 잔액은 state/me 의 sparks 를 같이 써요.
 * 저장하기 전 고르는 중인 모습(draft)은 꾸미기 화면이 들고 있어요 — [원래대로] = 여기 저장된 모습.
 */
import { AV_BG, AV_ITEM, AV_OWN0, AVC_LIST, avFresh, type Avatar } from '@/data/my';
import { createStore } from '@/lib/store';
import { award } from '@/state/ledger';
import { getMe } from '@/state/me';

type AvatarState = { saved: Avatar; own: string[] };

const store = createStore<AvatarState>({ saved: avFresh(), own: AV_OWN0 });

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
