/**
 * 시즌 보상 진행 · 받은 보상 (data/rewards 규칙). 기기에 남아요.
 * 지금은 서버가 없어서 진행은 샘플이고, 개발용 ?reward=santa 로 '받음'을 흉내 내요.
 * 서버가 생기면 GET /me/rewards 응답으로 progress · got 를 채우고, 받은 창을 닫으면 POST /me/rewards/{id}/seen.
 */
import { addNoti } from '@/components/home/noti-state';
import { REWARD } from '@/data/rewards';
import { createStore } from '@/lib/store';
import { grantAvatarItems } from '@/state/avatar';

type RewardState = {
  /** 규칙마다 지금까지 센 수 */
  progress: Record<string, number>;
  /** 받은 때 (ms) */
  got: Record<string, number>;
  /** 받은 창을 본 보상 */
  seen: Record<string, true>;
};

const store = createStore<RewardState>({ progress: { santa: 0, crown: 0, medal: 0 }, got: {}, seen: {} }, { persist: { key: 'rewards' } });

export const useRewards = store.useStore;

/** 아직 안 본 받은 보상 하나 (받은 창에 띄워요) */
export const useUnseenReward = () => store.useStore((s) => Object.keys(s.got).find((id) => !s.seen[id]) ?? null);

/** 받침 있으면 '을', 없으면 '를' (황금 왕관을 · 산타 세트를) */
const eul = (w: string) => {
  const c = w.charCodeAt(w.length - 1) - 0xac00;
  return c >= 0 && c < 11172 && c % 28 ? '을' : '를';
};

/** 보상 지급: 아이템을 가진 것에 넣고 · 받은 창 · 알림 (서버가 자동 지급한 결과를 받았을 때와 같아요) */
export function grantReward(id: string) {
  const r = REWARD[id];
  if (!r || store.get().got[id]) return;
  grantAvatarItems(r.items);
  store.set((s) => ({ ...s, progress: { ...s.progress, [id]: r.need }, got: { ...s.got, [id]: Date.now() } }));
  addNoti({ id: `reward-${id}`, kind: 'event', icon: 'flag', text: `시즌 보상 · ${r.name}${eul(r.name)} 받았어요! ${r.rule}${eul(r.rule)} 채웠어요. 꾸미기에서 입어 보세요`, time: '방금', href: `/me/customize?try=${id}`, read: false });
}

export { eul };

export const markRewardSeen = (id: string) => store.set((s) => ({ ...s, seen: { ...s.seen, [id]: true } }));

/** 개발용: 받은 보상을 처음 상태로 (다시 흉내 낼 때) */
export const resetRewards = () => store.set({ progress: { santa: 0, crown: 0, medal: 0 }, got: {}, seen: {} });
