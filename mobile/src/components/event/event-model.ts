/**
 * 이벤트 계산 (프로토타입 lgBody case 'event' · lgEvRow · svOf · lgAcct 를 옮긴 것).
 */
import { BRANCH_ACCOUNT, EVENT_ADDR, EVENT_DESC, EVENTS, SURVEY_LIB, SURVEY_SETS, type EventItem, type SurveyQuestion } from '@/data/events';
import { daysUntil, isPast, MONTHS, WEEK, won } from '@/data/meet';
import type { ServerEvent } from '@/api/events';
import type { CardDesign } from '@/data/poster-colors';

export const findEvent = (id: string) => EVENTS.find((e) => e.id === id);

/** 서버 분류 코드 → 칩 종류 (나머지는 '전체'에서만) */
const KIND_OF: Record<string, EventItem['ev']> = { PARTY: 'party', CLASS: 'class', TRIP: 'trip' };
/** 정원 무관일 때 계산용 정원 (화면에는 '인원 무관'으로만 보여요) */
export const NO_CAP = 9999;

/**
 * 서버 이벤트(GET /events) → 이벤트 한 줄. 멤버가 제안해 열린 이벤트면 주최가 그 멤버(hostMember)예요.
 * 신청 API 가 아직 없어서 함께하는 인원은 주최 1명부터 (참여하기는 기기 안에서만 +1).
 */
export function fromServer(r: ServerEvent): EventItem {
  const [y, m, d] = r.date.split('-').map(Number);
  const wd = WEEK[new Date(y, m - 1, d).getDay()];
  const place = r.placeName ?? r.addressDetail ?? '장소는 곧 알려 드려요';
  const addr = [r.placeAddress, r.addressDetail].filter(Boolean).join(' ') || place;
  return {
    id: r.id,
    ev: KIND_OF[r.categoryCode] ?? 'etc',
    kind: r.categoryLabel,
    br: r.branchName,
    year: y,
    mon: MONTHS[m - 1],
    day: String(d),
    wd: `${wd} ${r.startTime}`,
    title: r.title,
    place,
    addr,
    desc: r.description,
    host: r.host?.nickname ?? r.branchName,
    hostMember: r.host ? { name: r.host.nickname, branch: r.branchName } : undefined,
    mine: r.mine,
    cur: r.host ? 1 : 0,
    max: r.capacity ?? NO_CAP,
    noCap: r.capacity == null,
    fee: r.fee || undefined,
    posters: r.photos,
    card: r.card ? { color: r.card.color, words: r.card.words, design: (r.card.design ?? undefined) as CardDesign | undefined } : undefined,
  };
}
export const feeText = (e: EventItem) => (e.fee ? won(e.fee) : '무료');
export const eventAddr = (e: EventItem) => e.addr || EVENT_ADDR[e.id] || e.place;
export const eventDesc = (e: EventItem) => e.desc || EVENT_DESC[e.id] || `${e.place}에서 만나요. 영어로 먼저 인사하고, 그다음은 편하게 이야기해요. 처음 오는 분도 환영이에요.`;
export const surveyOf = (e: EventItem): SurveyQuestion[] => (e.survey ? (SURVEY_SETS[e.survey] || []).map((k) => SURVEY_LIB[k]) : []);
/** 지점 입금 계좌 [은행, 계좌번호, 예금주] (예시 — 지점마다 하나) */
export const accountOf = (e: EventItem) => BRANCH_ACCOUNT[e.br] || BRANCH_ACCOUNT['연신내'];

/** 다가오는 이벤트: 마감 임박한 순(날짜 가까운 순, 같은 날이면 남은 자리 적은 순) · 지난 이벤트: 최근에 끝난 순 */
export function splitEvents(list: EventItem[]) {
  const up = list.filter((e) => !isPast(e)).sort((a, b) => daysUntil(a) - daysUntil(b) || a.max - a.cur - (b.max - b.cur));
  const past = list.filter(isPast).sort((a, b) => daysUntil(b) - daysUntil(a));
  return { up, past };
}
