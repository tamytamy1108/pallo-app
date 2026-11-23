/**
 * 챕터 보상 상자: 이미 연 상자 (이슈 #7). 키 `${레벨}:${과}` — 진도 키(stepKey)의 앞 두 칸과 같아요.
 * 한 번 연 상자는 맵에서 열린 모습으로 보이고, 다시 누르면 받은 보상을 바로 보여 줘요.
 * 실서비스: 진도 API 가 '보상 받음'을 저장하고 XP · 배지를 지급해요. 지금은 앱을 켜 둔 동안만 기억해요.
 */
import { createStore } from '@/lib/store';

const store = createStore<Record<string, true>>({});

export const chestKey = (lv: number | string, unit: number | string) => `${lv}:${unit}`;
export const useChestOpened = (key: string) => store.useStore((s) => key in s);
export const isChestOpened = (key: string) => key in store.get();
export function markChestOpened(key: string) {
  store.set((s) => (key in s ? s : { ...s, [key]: true }));
}
