import { findEvent } from '@/components/event/event-model';
import { addProposal, setAnswers, toggleIn, type Proposal, type SurveyAnswers } from '@/components/meet/meet-store';
import type { EventItem } from '@/data/events';

/**
 * 이벤트 스토리 공용 값 — 가짜 데이터(data/events)의 이벤트를 id 로 꺼낸다.
 * 다가오는 / 지난 은 기기 날짜로 갈린다 (2026-11 말 기준: m2 · e1 · e4 · e2 다가옴, e3 · e5 · e6 · e7 지남).
 * m2 = 유료 · 할인 전 금액 · 파티 설문 / e1 = 무료 / e4 = 여행 · 캠프 설문 / e7 = 지난 유료 / e6 = 지난 무료
 */
export const ev = (id: string): EventItem => {
  const e = findEvent(id);
  if (!e) throw new Error(`없는 이벤트 ${id}`);
  return e;
};

/** 신청했다고 (설문 답 포함) — freshDevice 안에서 */
export function applied(id: string, answers?: SurveyAnswers) {
  toggleIn('joined', id);
  if (answers) setAnswers(id, answers);
}

/** 파티 설문(after · table · allergy)에 다 답한 값 */
export const PARTY_ANSWERS: SurveyAnswers = { 0: 0, 1: [0, 1], 2: '갑각류 알레르기가 있어요' };

/**
 * 자리를 꽉 채운다 (가짜 데이터에 다가오는 마감 이벤트가 없어서) — 정리 함수가 원래 인원으로 돌린다.
 * beforeEach 에서 `return fillUp('e1')`.
 */
export function fillUp(id: string) {
  const e = ev(id);
  const cur = e.cur;
  e.cur = e.max;
  return () => {
    e.cur = cur;
  };
}

/** 네트워크 없이 보이는 예시 사진 (색 바탕 + 글자 SVG) */
export function sampleImage(bg: string, word: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="${bg}"/><text x="150" y="170" font-size="56" font-family="sans-serif" font-weight="900" text-anchor="middle" fill="#1E1A2B">${word}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** 내가 보낸 제안 (사진 없음 · 있음) */
export const PROPOSALS: Proposal[] = [
  { id: 'pr-story-1', title: '한강 영어 피크닉', br: '하남점', date: '2026-12-19', cat: '액티비티' },
  { id: 'pr-story-2', title: '아주 긴 제목의 크리스마스 영어 보드게임 나이트 — 친구 데려와도 돼요', br: '연신내', date: '2027-01-09', cat: '파티', cover: sampleImage('#D0798E', 'XMAS') },
];
export const proposed = (list: Proposal[] = PROPOSALS) => [...list].reverse().forEach(addProposal);
