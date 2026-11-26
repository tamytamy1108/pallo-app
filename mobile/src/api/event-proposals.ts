/**
 * 이벤트 제안 API — 백엔드 `MobileEventProposalController` (`/app/api/v2/event-proposals`) + 사진 업로드(`/uploads/images/event-photo`).
 * - GET    /event-proposals              내 제안 전부 (최근 보낸 순) → 이벤트 탭 '내가 제안한 이벤트'
 * - GET    /event-proposals/categories   분류 선택지 (지점 콘솔 마스터데이터 '이벤트 분류')
 * - POST   /event-proposals              제안 보내기 (이용 중 회원만 — 아니면 409)
 * - DELETE /event-proposals/{id}         대기 중인 내 제안 취소 (이미 처리됐으면 409)
 * - POST   /uploads/images/event-photo   사진 한 장 (multipart file) → { path } — 보내기 전에 올려 path 만 넘겨요
 *
 * 매니저가 승인하면 서버가 그 내용(매니저가 고친 것)으로 이벤트를 열어요. 반려면 사유가 같이 와요.
 * 가짜 서버(EXPO_PUBLIC_API_MOCK=1)는 이 파일의 목록을 읽고 써요.
 */
import { Platform } from 'react-native';

import { http } from './client';
import { apiConfig } from './config';
import { ApiError } from './errors';
import { mock, mockNotFound } from './mock';

type Opts = { signal?: AbortSignal };

export type EventProposalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED';

/** 만든 카드 — 색('#RRGGBB') · 줄마다 글자(빈 줄 포함) · 무늬 */
export type EventProposalCard = { color: string; words: string[]; design: string | null };

/** 백엔드 EventProposalResponse — date 는 KST 달력 날짜(YYYY-MM-DD), 시각은 'HH:mm' (끝 '24:00' = 밤 12시) */
export type EventProposal = {
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
  /** 예상 인원 — null 이면 무관 */
  expectedAttendees: number | null;
  /** 1인 참가비(원) — 0 이면 무료 */
  fee: number;
  /** 사진 주소 — 0번이 대표 */
  photos: string[];
  card: EventProposalCard | null;
  status: EventProposalStatus;
  rejectionReason: string | null;
  decidedAt: string | null;
  createdAt: string;
};

/** 분류 선택지 (마스터데이터 EVENT_CATEGORY) */
export type EventCategory = { code: string; label: string };

/** POST /event-proposals 본문 — photoPaths 는 업로드 응답 path 를 화면 순서대로 */
export type EventProposalBody = {
  branchCode: string;
  categoryCode: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  placeName: string | null;
  placeAddress: string | null;
  addressDetail: string | null;
  expectedAttendees: number | null;
  fee: number;
  photoPaths: string[];
  card: EventProposalCard | null;
};

const MOCK_CATEGORIES: EventCategory[] = [
  { code: 'PARTY', label: '파티' },
  { code: 'CLASS', label: '클래스' },
  { code: 'TRIP', label: '여행' },
  { code: 'ACTIVITY', label: '액티비티' },
  { code: 'HOBBY', label: '취미' },
  { code: 'SELF_IMPROVEMENT', label: '자기계발' },
  { code: 'ETC', label: '기타' },
];

let mockRows: EventProposal[] = [];
let mockSeq = 0;

/** 스토리 · 테스트용: 가짜 목록을 통째로 바꿔요 */
export function setMockEventProposals(rows: EventProposal[]) {
  mockRows = rows.map((r) => ({ ...r }));
}

/** GET /event-proposals — 내 제안 전부 (최근 보낸 순) */
export function fetchMyEventProposals({ signal }: Opts = {}): Promise<EventProposal[]> {
  if (apiConfig.useMock) return mock('eventProposals', () => mockRows.map((r) => ({ ...r })));
  return http.get('/event-proposals', { signal });
}

/** GET /event-proposals/categories */
export function fetchEventCategories({ signal }: Opts = {}): Promise<EventCategory[]> {
  if (apiConfig.useMock) return mock('eventCategories', () => [...MOCK_CATEGORIES]);
  return http.get('/event-proposals/categories', { signal });
}

/**
 * POST /event-proposals. 가짜 서버는 화면이 아는 지점 이름을 받아 남겨요 (진짜 서버는 스스로 붙여요).
 * 실패: 날짜(1주 뒤 ~ 90일) · 시간 · 사진/카드 400, 꺼진 분류 · 운영 중 아닌 지점 404, 이용 중 회원이 아니면 409.
 */
export function createEventProposal(body: EventProposalBody, names: { branchName: string }): Promise<EventProposal> {
  if (apiConfig.useMock)
    return mock('createEventProposal', () => {
      const saved: EventProposal = {
        id: `mock-proposal-${++mockSeq}`,
        branchCode: body.branchCode,
        branchName: names.branchName,
        categoryCode: body.categoryCode,
        categoryLabel: MOCK_CATEGORIES.find((c) => c.code === body.categoryCode)?.label ?? body.categoryCode,
        title: body.title,
        description: body.description,
        date: body.date,
        startTime: body.startTime,
        endTime: body.endTime,
        placeName: body.placeName,
        placeAddress: body.placeAddress,
        addressDetail: body.addressDetail,
        expectedAttendees: body.expectedAttendees,
        fee: body.fee,
        photos: body.photoPaths,
        card: body.card,
        status: 'PENDING',
        rejectionReason: null,
        decidedAt: null,
        createdAt: new Date().toISOString(),
      };
      mockRows = [saved, ...mockRows];
      return { ...saved };
    });
  return http.post('/event-proposals', body);
}

/** DELETE /event-proposals/{id} — 대기 중일 때만 (이미 처리됐으면 409) */
export function cancelEventProposal(id: string): Promise<void> {
  if (apiConfig.useMock)
    return mock('cancelEventProposal', () => {
      const row = mockRows.find((r) => r.id === id);
      if (!row) throw mockNotFound();
      if (row.status !== 'PENDING') throw new ApiError({ kind: 'client', status: 409, code: 'illegal_operation', message: '이미 처리된 이벤트 제안입니다.' });
      row.status = 'CANCELED';
    });
  return http.delete(`/event-proposals/${id}`);
}

/**
 * POST /uploads/images/event-photo — 고른 사진(기기 uri) 한 장을 올리고 서버 path 를 돌려줘요.
 * 폰은 { uri, name, type } 를 그대로 FormData 에 넣고, 웹은 uri(blob:) 를 Blob 으로 읽어 넣어요.
 * 가짜 서버는 uri 를 그대로 path 로 돌려줘요(화면에 바로 보이게).
 */
export async function uploadEventPhoto(uri: string): Promise<string> {
  if (apiConfig.useMock) return mock('uploadEventPhoto', () => uri);
  const form = new FormData();
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    form.append('file', blob, `event.${blob.type === 'image/png' ? 'png' : 'jpg'}`);
  } else {
    const png = uri.toLowerCase().endsWith('.png');
    // RN FormData 는 파일을 { uri, name, type } 로 받아요 (DOM 타입에는 없는 모양이라 넓혀 넣어요)
    form.append('file', { uri, name: png ? 'event.png' : 'event.jpg', type: png ? 'image/png' : 'image/jpeg' } as unknown as Blob);
  }
  const res = await http.post<{ path: string }>('/uploads/images/event-photo', form);
  return res.path;
}
