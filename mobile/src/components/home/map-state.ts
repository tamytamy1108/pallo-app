/**
 * 홈 스터디 맵이 기억하는 것: 과마다 마지막으로 연 단계 (프로토타입 ST.last).
 * 캐릭터는 이 단계 위에 서요 (없으면 아직 안 한 첫 단계). 실제 앱은 진도 API(19 `/me/progress`)의 마지막 위치를 써요.
 */
import { createStore } from '@/lib/store';

const store = createStore<Record<string, string>>({});

export const useLastStep = (lv: number, unit: number) => store.useStore((s) => s[`${lv}:${unit}`]);
export const setLastStep = (lv: number, unit: number, step: string) => store.set((s) => ({ ...s, [`${lv}:${unit}`]: step }));

/** 교재 문제 데이터가 들어온 과 (프로토타입 LV1: 1과만 · 나머지는 '교재가 들어오면 열려요') */
export const OPEN_UNITS: Record<number, number[]> = { 1: [1] };

/** 다른 곳(오늘의 목표 카드)에서 '지금 정류장 팝업 열기'를 부탁할 때 (숫자가 바뀌면 열어요) */
const stopAsk = createStore(0);
export const useStopAsk = () => stopAsk.useStore();
export const askCurrentStop = () => stopAsk.set((n) => n + 1);
