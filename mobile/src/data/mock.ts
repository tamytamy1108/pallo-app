/**
 * 가짜 데이터 (Mock). 백엔드 API가 나오면 이 값을 서버에서 받아 와요.
 * 값은 프로토타입(prototype/index.html 의 NOTICES · NOTICE_D)과 같아요.
 * 맞는 API: docs/appendix/api-inventory.md — 3 `/me` · 8 `/me/sessions/today` · 12 `/notices`
 */
import { Colors } from '@/constants/theme';

export type NoticeTag = '공지' | '이벤트' | '새 소식';

export type Notice = {
  id: string;
  tag: NoticeTag;
  title: string;
  date: string;
  author: string;
  audience: string;
  body: string[];
  /** 아래 고정 바에 들어가는 행동 버튼 */
  cta?: { label: string; action: 'schedule' | 'event' | 'library' };
};

/** 공지 띠 태그 색 (프로토타입과 같아요) */
export const NOTICE_TAG_STYLE: Record<NoticeTag, { bg: string; ink: string }> = {
  공지: { bg: Colors.ink, ink: Colors.white },
  이벤트: { bg: Colors.rosePink, ink: Colors.ink },
  '새 소식': { bg: Colors.yellow, ink: Colors.ink },
};

export const NOTICES: Notice[] = [
  {
    id: 'n1',
    tag: '공지',
    title: '이번 달 스터디 일정 안내',
    date: '2026.11.10',
    author: 'PALLO 본사',
    audience: '전 지점',
    body: [
      '12월 스터디는 12월 1일(월)부터 시작해요. 시간표는 지점마다 조금씩 달라요.',
      '연말에는 12월 24일 ~ 26일, 31일 ~ 1월 1일에 세션이 없어요. 그 주는 이용권 기간이 자동으로 늘어나요.',
      '새 시간표는 마이 > 연기 · 팀 · 지점 변경에서 바로 신청할 수 있어요.',
    ],
    cta: { label: '시간표 보고 신청하기', action: 'schedule' },
  },
  {
    id: 'n2',
    tag: '이벤트',
    title: '지점 이벤트 소식',
    date: '2026.11.08',
    author: '영등포점',
    audience: '영등포점',
    body: [
      '11월 마지막 주 금요일 저녁, 영등포점에서 ‘Thanksgiving 포틀럭 파티’를 열어요.',
      '음식 한 가지씩 가져오고 영어로 소개해요. 회원은 무료, 친구 1명까지 함께 와도 돼요.',
    ],
    cta: { label: '이벤트 신청하기', action: 'event' },
  },
  {
    id: 'n3',
    tag: '새 소식',
    title: '새 교재 · 업데이트 소식',
    date: '2026.11.03',
    author: 'PALLO 본사',
    audience: '전 지점',
    body: ['Lv.1 교재가 4교로 바뀌었어요. 1과 ~ 6과 예문과 대화문이 새로 들어왔어요.', '라이브러리에서 바뀐 교재로 예습 · 복습을 할 수 있어요.'],
    cta: { label: '라이브러리 열기', action: 'library' },
  },
];

export const ME = { name: 'Tammy' };

/** 스터디 맵 구역 (예습 · 본학습 · 복습) — 프로토타입 MAP_STAGE */
export type Stage = 'pre' | 'main' | 'post';
export const STAGES: { key: Stage; label: string; color: string }[] = [
  { key: 'pre', label: '예습', color: Colors.yellow },
  { key: 'main', label: '본학습', color: Colors.rosePink },
  { key: 'post', label: '복습', color: Colors.sky },
];

/** 한 과의 단계 (프로토타입 STUDY_STEPS.pattern). 맞는 API: 18 `/lessons/:id` · 19 `/me/progress` */
export const LESSON_STEPS: { id: string; stage: Stage; title: string }[] = [
  { id: 'pat', stage: 'pre', title: '오늘의 패턴' },
  { id: 'dlg', stage: 'pre', title: '대화문' },
  { id: 'bank', stage: 'pre', title: 'Bank 퀴즈' },
  { id: 'sit', stage: 'main', title: '상황 활동' },
  { id: 'story', stage: 'main', title: 'My Story' },
  { id: 'talk', stage: 'main', title: 'AI 프리토킹' },
  { id: 'quiz', stage: 'post', title: '스피킹 퀴즈' },
  { id: 'chal', stage: 'post', title: '30초 말하기 챌린지' },
];

/** 내 교재 · 진도 (예시) */
export const MY_BOOK = {
  level: 'Lv.1',
  lessonCount: 20,
  weekLessons: [5, 6],
  titles: { 1: 'Cafe Complaint', 2: 'Operation Cookbook' } as Record<number, string>,
  doneSteps: [] as string[],
};

/** 오늘 내 세션 (시작 시각은 오늘 날짜의 시:분) */
export const TODAY_SESSION = { startHour: 20, startMinute: 0 };
