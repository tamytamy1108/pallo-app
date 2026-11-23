/**
 * 포인트(P · 랭킹 점수) · 스파크(✦ · 상점 재화) 장부 — 가짜 서버. 맞는 API(예정): `POST /me/rewards` · `GET /me/rewards`.
 * 받을 때마다 한 줄(이벤트)을 남기고, 같은 이벤트 id 는 두 번 받지 않아요 (서버도 id 로 중복을 막아요).
 * 잔액은 state/me 의 weekPoints · sparks 에 같이 반영해서 마이 · 랭킹 · 꾸미기가 바로 바뀌어요.
 *
 * 얼마를 주는지는 부르는 쪽 데이터에 있어요 (단계 xp · ATTEND_POINTS · SPARK_ATTEND). 여기는 규칙을 만들지 않아요.
 * 스파크 주는 규칙은 아직 정책이 정해지지 않았어요 — 지금은 세션 출석만 연결 (data/my.ts SPARK_EARN 참고).
 */
import { createStore } from '@/lib/store';

import { getMe, updateMe } from './me';

export type Currency = 'points' | 'sparks';

/**
 * 왜 받았는지. 늘리기만 해요 (서버 enum 과 같게).
 * step: 단계 처음 끝냄 · speed: 빠른 답 보너스 · skip: 구간 건너뛰기(테스트 통과) · attend: 세션 출석 · shop: 꾸미기 상점에서 씀
 */
export type RewardType = 'step' | 'speed' | 'skip' | 'attend' | 'shop';

export type RewardEvent = {
  /** 이벤트 id — 같은 일로 두 번 받지 않게 (예: 'step:1:1:pat' · 'attend:2026-11-23:1'). 화폐마다 한 번 */
  id: string;
  type: RewardType;
  currency: Currency;
  /** 받으면 +, 쓰면 - */
  amount: number;
  /** 기록한 시각 (ms) */
  at: number;
};

const store = createStore<{ events: RewardEvent[] }>({ events: [] });

export const useRewards = () => store.useStore((s) => s.events);
export const listRewards = (currency?: Currency) => store.get().events.filter((e) => !currency || e.currency === currency);
/** 같은 id 라도 포인트 · 스파크는 따로 받아요 (출석 한 번 → +30P · +50✦) */
export const hasReward = (id: string, currency: Currency = 'points') => store.get().events.some((e) => e.id === id && e.currency === currency);

/** 장부에 한 줄 남기고 잔액에 더해요. 이미 받은 id · 0 이면 아무것도 안 하고 false */
export function award(e: Omit<RewardEvent, 'at'> & { at?: number }): boolean {
  if (!e.amount || hasReward(e.id, e.currency)) return false;
  const event: RewardEvent = { ...e, at: e.at ?? Date.now() };
  store.set((s) => ({ events: [...s.events, event] }));
  const me = getMe();
  if (e.currency === 'points') updateMe({ weekPoints: me.weekPoints + e.amount });
  else updateMe({ sparks: me.sparks + e.amount });
  return true;
}

/** 포인트 받기 (편하게 쓰는 짧은 이름) */
export const awardPoints = (id: string, type: RewardType, amount: number) => award({ id, type, currency: 'points', amount });
export const awardSparks = (id: string, type: RewardType, amount: number) => award({ id, type, currency: 'sparks', amount });

/** 테스트용: 장부 비우기 (잔액은 건드리지 않아요) */
export const resetLedger = () => store.set({ events: [] });
