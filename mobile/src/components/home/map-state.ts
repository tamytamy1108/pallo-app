/** 홈 스터디 맵 상태. 마지막으로 연 단계는 state/progress 의 last 하나만 써요 (라이브러리와 같은 기록) */
import { createStore } from '@/lib/store';

/** 교재 문제 데이터가 들어온 과 (프로토타입 LV1: 1과만 · 나머지는 '교재가 들어오면 열려요') */
export const OPEN_UNITS: Record<number, number[]> = { 1: [1] };

/** 다른 곳(오늘의 목표 카드)에서 '지금 정류장 팝업 열기'를 부탁할 때 (숫자가 바뀌면 열어요) */
const stopAsk = createStore(0);
export const useStopAsk = () => stopAsk.useStore();
export const askCurrentStop = () => stopAsk.set((n) => n + 1);
