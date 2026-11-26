/**
 * 이벤트 탭 API — 백엔드 `MobileEventController` (`/app/api/v2/events`).
 * - GET /events       열린 이벤트 중 오늘(KST) 이후 것, 가까운 날짜순 (멤버 제안이 승인돼 열린 이벤트도 여기 나와요)
 * - GET /events/{id}  이벤트 하나 (없거나 닫혔으면 404)
 *
 * 아직 신청 · 마감 API 는 없어요 — 참여하기 · 찜은 지금처럼 기기 안에서만 돌아요.
 * 가짜 서버(EXPO_PUBLIC_API_MOCK=1)는 이 파일의 목록을 읽어요. 제안이 승인되면(가짜 서버 mockDecideEventProposal) 여기에 한 줄 생겨요.
 */
import { http } from './client';
import { apiConfig } from './config';
import type { EventProposal, EventProposalCard } from './event-proposals';
import { mock, mockNotFound } from './mock';

type Opts = { signal?: AbortSignal };

/** 백엔드 EventResponse — date 는 KST 달력 날짜(YYYY-MM-DD), 시각은 'HH:mm' (끝 '24:00' = 밤 12시) */
export type ServerEvent = {
  id: string;
  branchCode: string;
  branchName: string;
  categoryCode: string;
  categoryLabel: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  placeName: string | null;
  placeAddress: string | null;
  addressDetail: string | null;
  /** 정원 — null 이면 무관 */
  capacity: number | null;
  /** 1인 참가비(원) — 0 이면 무료 */
  fee: number;
  /** 사진 주소 — 0번이 대표 (없으면 card 가 대표) */
  photos: string[];
  card: EventProposalCard | null;
  /** 멤버가 제안해 열린 이벤트의 주최 멤버. 지점이 직접 연 이벤트면 null */
  host: { code: string; nickname: string } | null;
  /** 내가 주최한 이벤트인지 */
  mine: boolean;
  status: 'OPEN';
};

let mockEvents: ServerEvent[] = [];

/** 스토리 · 테스트용: 가짜 목록을 통째로 바꿔요 */
export function setMockEvents(rows: ServerEvent[]) {
  mockEvents = rows.map((r) => ({ ...r }));
}

/** 가짜 서버 승인: 제안(매니저가 고친 값이라 치고 그대로)으로 이벤트를 열어요 */
export function openMockEventFrom(p: EventProposal, hostName: string, id = `mock-event-${p.id}`): ServerEvent {
  const ev: ServerEvent = {
    id,
    branchCode: p.branchCode,
    branchName: p.branchName,
    categoryCode: p.categoryCode,
    categoryLabel: p.categoryLabel,
    title: p.title,
    description: p.description,
    date: p.date,
    startTime: p.startTime,
    endTime: p.endTime,
    placeName: p.placeName,
    placeAddress: p.placeAddress,
    addressDetail: p.addressDetail,
    capacity: p.expectedAttendees,
    fee: p.fee,
    photos: p.photos,
    card: p.card,
    host: { code: 'me', nickname: hostName },
    mine: true,
    status: 'OPEN',
  };
  mockEvents = [...mockEvents.filter((e) => e.id !== id), ev];
  return ev;
}

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** GET /events — 오늘 이후 열린 이벤트 (가까운 날짜 · 시작 시각 순) */
export function fetchEvents({ signal }: Opts = {}): Promise<ServerEvent[]> {
  if (apiConfig.useMock)
    return mock('events', () =>
      mockEvents
        .filter((e) => e.date >= todayIso())
        .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
        .map((e) => ({ ...e })),
    );
  return http.get('/events', { signal });
}

/** GET /events/{id} */
export function fetchEvent(id: string, { signal }: Opts = {}): Promise<ServerEvent> {
  if (apiConfig.useMock)
    return mock('event', () => {
      const e = mockEvents.find((r) => r.id === id);
      if (!e) throw mockNotFound();
      return { ...e };
    });
  return http.get(`/events/${id}`, { signal });
}
