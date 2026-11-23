/**
 * 오늘의 학습 목표 — 하나뿐인 셈. 맞는 API: 19 `/me/progress` (오늘 끝낸 단계 · 서버가 날짜를 정해요).
 * Lv.1 · 2 레슨, Lv.3 · 4 레슨, 상황 장면, 구간 건너뛰기 모두 state/progress 의 markDone 이 처음 끝낼 때 여기에 적어요.
 * 홈 '오늘의 목표' 카드 · 축하 화면은 여기서만 읽어요. 날짜(기기 시각 · 자정 기준)마다 따로 세서, 자정이 지나면 0부터.
 */
import { useEffect } from 'react';

import { TODAY_GOAL } from '@/data/home';
import { createStore } from '@/lib/store';

/** 오늘 목표 개수 (프로토타입 DAILY_GOAL · 홈 '퀘스트 2개 깨기') */
export const DAILY_GOAL = TODAY_GOAL.total;

/** 기기 시각 기준 날짜 'YYYY-MM-DD' */
export const dayKey = (t: number = Date.now()) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** 며칠치 남겨 둘지 (연속 학습 계산용 · 그보다 오래된 날은 지워요) */
const KEEP_DAYS = 14;

type TodayGoal = {
  /** 지금 화면이 보는 날짜 — 자정이 지나면 바뀌어 화면이 다시 그려져요 */
  day: string;
  /** 날짜 → 그날 처음 끝낸 단계 키 (같은 키는 한 번만) */
  days: Record<string, string[]>;
};

const store = createStore<TodayGoal>({ day: dayKey(), days: {} });

const countOn = (s: TodayGoal, day: string) => s.days[day]?.length ?? 0;

/** 날짜가 바뀌었으면 맞춰요 (자정 타이머 · 읽을 때마다) */
function syncDay(now = Date.now()) {
  const day = dayKey(now);
  if (store.get().day !== day) store.set((s) => ({ ...s, day }));
  return day;
}

/** 처음 끝낸 단계를 오늘 목표에 적어요. 오늘 이미 적은 키면 그대로. 적은 뒤 오늘 개수를 돌려줘요 */
export function recordToday(key: string, now = Date.now()) {
  const day = syncDay(now);
  store.set((s) => {
    const list = s.days[day] ?? [];
    if (list.includes(key)) return s;
    const keep = Object.keys(s.days)
      .sort()
      .slice(-(KEEP_DAYS - 1))
      .filter((d) => d !== day);
    const days: Record<string, string[]> = {};
    keep.forEach((d) => (days[d] = s.days[d]));
    days[day] = [...list, key];
    return { ...s, days };
  });
  return countOn(store.get(), day);
}

/** 오늘 끝낸 단계 수 (목표를 넘어도 그대로 · 화면에서 Math.min) */
export const getTodayDone = (now = Date.now()) => countOn(store.get(), syncDay(now));

/** 오늘 끝낸 단계 수 — 자정이 지나면 0으로 다시 그려져요 */
export function useTodayDone() {
  useEffect(() => {
    syncDay();
    let id: ReturnType<typeof setTimeout>;
    const arm = () => {
      const next = new Date();
      next.setHours(24, 0, 1, 0);
      id = setTimeout(() => {
        syncDay();
        arm();
      }, next.getTime() - Date.now());
    };
    arm();
    return () => clearTimeout(id);
  }, []);
  return store.useStore((s) => countOn(s, s.day));
}

/** 테스트용: 처음 상태로 */
export const resetTodayGoal = () => store.set({ day: dayKey(), days: {} });
