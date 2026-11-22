/**
 * 이벤트 계산 (프로토타입 lgBody case 'event' · lgEvRow · svOf · lgAcct 를 옮긴 것).
 */
import { BRANCH_ACCOUNT, EVENT_ADDR, EVENT_DESC, EVENTS, SURVEY_LIB, SURVEY_SETS, type EventItem, type SurveyQuestion } from '@/data/events';
import { daysUntil, isPast, won } from '@/data/meet';

export const findEvent = (id: string) => EVENTS.find((e) => e.id === id);
export const feeText = (e: EventItem) => (e.fee ? won(e.fee) : '무료');
export const eventAddr = (e: EventItem) => EVENT_ADDR[e.id] || e.place;
export const eventDesc = (e: EventItem) => EVENT_DESC[e.id] || `${e.place}에서 만나요. 영어로 먼저 인사하고, 그다음은 편하게 이야기해요. 처음 오는 분도 환영이에요.`;
export const surveyOf = (e: EventItem): SurveyQuestion[] => (e.survey ? (SURVEY_SETS[e.survey] || []).map((k) => SURVEY_LIB[k]) : []);
/** 지점 입금 계좌 [은행, 계좌번호, 예금주] (예시 — 지점마다 하나) */
export const accountOf = (e: EventItem) => BRANCH_ACCOUNT[e.br] || BRANCH_ACCOUNT['연신내'];

/** 다가오는 이벤트: 마감 임박한 순(날짜 가까운 순, 같은 날이면 남은 자리 적은 순) · 지난 이벤트: 최근에 끝난 순 */
export function splitEvents(list: EventItem[]) {
  const up = list.filter((e) => !isPast(e)).sort((a, b) => daysUntil(a) - daysUntil(b) || a.max - a.cur - (b.max - b.cur));
  const past = list.filter(isPast).sort((a, b) => daysUntil(b) - daysUntil(a));
  return { up, past };
}
