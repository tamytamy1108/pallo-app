/**
 * 가짜 데이터 (Mock). 백엔드 API가 나오면 이 값을 서버에서 받아 와요.
 * 값은 프로토타입(prototype/index.html 의 NOTICES · NOTICE_D 5개)과 같아요. 공지는 서버(GET /notices) 모양 그대로예요.
 * 맞는 API: docs/appendix/api-inventory.md — 3 `/me` · 8 `/me/sessions/today` · 12 `/notices`
 */
import { Colors } from '@/constants/theme';

/** 서버 공지 종류 (백엔드 AppNoticeType · 점검 공지는 앱 목록에 안 와요) */
export type NoticeType = 'GENERAL' | 'EVENT' | 'UPDATE' | 'IMPORTANT';

export type NoticeTag = '공지' | '이벤트' | '새 소식';

/** 종류 → 화면 태그 (중요 공지도 '공지'로 보여요) */
export const NOTICE_TAG: Record<NoticeType, NoticeTag> = {
  GENERAL: '공지',
  IMPORTANT: '공지',
  EVENT: '이벤트',
  UPDATE: '새 소식',
};

/** 공지 목록 한 줄 — 백엔드 MobileNoticeResponse 와 1:1 */
export type Notice = {
  id: string;
  type: NoticeType;
  title: string;
  /** 게시 시각 (ISO) */
  publishAt: string;
  /** 내가 목록 맨 위에 고정했는지 (사람마다 달라요) */
  pinned: boolean;
  author: string;
  audience: string;
};

/** 공지 상세 — 백엔드 MobileNoticeDetailResponse 와 1:1. 본문은 줄바꿈으로 문단을 나눠요 */
export type NoticeDetail = Notice & {
  content: string;
  /** 첨부 이미지 주소 (순서대로) */
  images: string[];
};

/** 공지 띠 태그 색 (프로토타입과 같아요) */
export const NOTICE_TAG_STYLE: Record<NoticeTag, { bg: string; ink: string }> = {
  공지: { bg: Colors.ink, ink: Colors.white },
  이벤트: { bg: Colors.rosePink, ink: Colors.ink },
  '새 소식': { bg: Colors.yellow, ink: Colors.ink },
};

const HQ = { author: 'PALLO 본사', audience: '전 지점' };

/** 가짜 서버 공지 (최신순). pinned 는 가짜 서버가 고정 기록(api/home.ts)을 보고 채워요 */
export const NOTICE_DETAILS: NoticeDetail[] = [
  {
    id: 'n1',
    type: 'IMPORTANT',
    title: '이번 달 스터디 일정 안내',
    publishAt: '2026-11-10T01:00:00Z',
    pinned: false,
    ...HQ,
    content: [
      '12월 스터디는 12월 1일(월)부터 시작해요. 시간표는 지점마다 조금씩 달라요.',
      '연말에는 12월 24일 ~ 26일, 31일 ~ 1월 1일에 세션이 없어요. 그 주는 이용권 기간이 자동으로 늘어나요.',
      '새 시간표는 마이 > 연기 · 팀 · 지점 변경에서 바로 신청할 수 있어요.',
    ].join('\n'),
    images: [],
  },
  {
    id: 'n2',
    type: 'EVENT',
    title: 'PALLO 연말 랭귀지 파티',
    publishAt: '2026-11-08T01:00:00Z',
    pinned: false,
    ...HQ,
    content: ['11월 29일(토) 저녁 7시, 전 지점 회원이 함께하는 연말 랭귀지 파티를 열어요.', '음식 한 가지씩 가져오고 영어로 소개해요. 회원은 무료, 친구 1명까지 함께 와도 돼요.'].join('\n'),
    images: [],
  },
  {
    id: 'n3',
    type: 'UPDATE',
    title: '새 교재 · 업데이트 소식',
    publishAt: '2026-11-03T01:00:00Z',
    pinned: false,
    ...HQ,
    content: ['Lv.1 교재가 4교로 바뀌었어요. 1과 ~ 6과 예문과 대화문이 새로 들어왔어요.', '라이브러리에서 바뀐 교재로 예습 · 복습을 할 수 있어요.'].join('\n'),
    images: [],
  },
  {
    id: 'n4',
    type: 'GENERAL',
    title: '라운지 이용 규칙 안내',
    publishAt: '2026-10-27T01:00:00Z',
    pinned: false,
    ...HQ,
    content: '라운지 이용 규칙을 정리했어요. 광고 · 연락처 공유 · 무례한 말은 신고되면 매니저가 24시간 안에 확인해요.',
    images: [],
  },
  {
    id: 'n5',
    type: 'GENERAL',
    title: '앱 알림 설정이 바뀌었어요',
    publishAt: '2026-10-15T01:00:00Z',
    pinned: false,
    ...HQ,
    content: '수업 · 라운지 · 이벤트 알림을 따로 켜고 끌 수 있어요. 마이 > 설정 > 알림에서 바꿔 주세요.',
    images: [],
  },
];

/** 목록 모양 (본문 · 이미지 빼고) */
export const NOTICES: Notice[] = NOTICE_DETAILS.map(({ content: _c, images: _i, ...n }) => n);

/** 홈 Notice board 띠에 도는 공지 (앞의 3개 · 프로토타입 NOTICES) */
export const BOARD_NOTICES = NOTICES.slice(0, 3);

/** 게시 시각 → 'YYYY.MM.DD' (한국 날짜) */
export function noticeDate(iso: string): string {
  const d = new Date(Date.parse(iso) + 9 * 60 * 60 * 1000);
  return `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${String(d.getUTCDate()).padStart(2, '0')}`;
}

export const ME = { name: 'Tammy' };

/** 스터디 맵 구역 (예습 · 본학습 · 복습) — 프로토타입 MAP_STAGE */
export type Stage = 'pre' | 'main' | 'post';
export const STAGES: { key: Stage; label: string; color: string }[] = [
  { key: 'pre', label: '예습', color: Colors.yellow },
  { key: 'main', label: '본학습', color: Colors.rosePink },
  { key: 'post', label: '복습', color: Colors.sky },
];

/** 한 과의 단계 (프로토타입 STUDY_STEPS.pattern). 맞는 API: 18 `/lessons/:id` · 19 `/me/progress`
 * min: 걸리는 시간(분) · xp: 처음 끝내면 받는 포인트 */
export const LESSON_STEPS: { id: string; stage: Stage; title: string; min: number; xp: number }[] = [
  { id: 'pat', stage: 'pre', title: '오늘의 패턴', min: 5, xp: 5 },
  { id: 'dlg', stage: 'pre', title: '대화문', min: 6, xp: 10 },
  { id: 'bank', stage: 'pre', title: 'Bank 퀴즈', min: 3, xp: 5 },
  { id: 'sit', stage: 'main', title: '상황 활동', min: 8, xp: 15 },
  { id: 'story', stage: 'main', title: 'My Story', min: 7, xp: 15 },
  { id: 'talk', stage: 'main', title: 'AI 프리토킹', min: 6, xp: 15 },
  { id: 'quiz', stage: 'post', title: '스피킹 퀴즈', min: 5, xp: 10 },
  { id: 'chal', stage: 'post', title: '30초 말하기 챌린지', min: 3, xp: 10 },
];

/** 내 교재 · 진도 (예시) */
export const MY_BOOK = {
  level: 'Lv.1',
  lessonCount: 20,
  weekLessons: [5, 6],
  /** 레벨마다 이번 주 반 진도 = 늘 두 과 (월화토 A과 · 수목일 B과 · 임시 · 반 진도 API 가 생기면 서버 값으로). 홈 스터디 맵이 보고 있는 레벨 것을 보여요 */
  weekByLevel: { 1: [5, 6], 2: [5, 6], 3: [101, 102], 4: [101, 102] } as Record<number, number[]>,
  titles: { 1: 'Cafe Complaint', 2: 'Operation Cookbook' } as Record<number, string>,
  doneSteps: [] as string[],
};

/** 오늘 내 세션 (시작 시각은 오늘 날짜의 시:분) */
export const TODAY_SESSION = { startHour: 20, startMinute: 0 };
