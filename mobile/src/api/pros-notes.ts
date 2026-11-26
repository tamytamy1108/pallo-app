/**
 * PRO'S NOTE 한 장 — `GET /app/api/v2/me/pros-notes/{id}` · `POST /me/pros-notes/{id}/read` (백엔드 MobileProsNoteV2Controller).
 * 마이 PRO'S NOTE 카드(GET /me/mypage proNote)에서 열어요. 쓴 리더나 받은 사람만 볼 수 있고(아니면 404), 열람은 받은 사람만 남아요.
 * 서버 노트는 리더가 수업 중 정리한 질문 + AI 답변이에요.
 *
 * `extras` 는 서버에 아직 없는 칸 — 가짜 서버만 채워요(항목 종류 · 예문 · 반에 남긴 인사 · 고마워요 · 친구들 반응).
 * 서버 응답엔 없으니 화면은 그 칸을 그리지 않아요(항목 종류는 '질문', 예문 없음).
 */
import { markNoteRead } from '@/components/account/store';
import { PRO_NOTES, PRO_SENT_NOTES, teamNameByNo, TODAY, type ProNoteTag } from '@/data/account';
import { getMe } from '@/state/me';

import { http } from './client';
import { apiConfig } from './config';
import { mock, mockNotFound } from './mock';

type Opts = { signal?: AbortSignal };

export type ProsNoteAnswerStatus = 'ANSWERING' | 'ANSWERED' | 'FAILED';

export type ProsNoteDetail = {
  note: {
    id: string;
    course: {
      courseId: string;
      /** 수업 이름 (제목이 없으면 서버가 '언어 시각 수업'으로) */
      title: string;
      languageLabel: string;
      branchName: string;
      /** KST 'YYYY-MM-DD' */
      date: string;
      /** 'HH:mm' */
      time: string;
      endTime: string;
    };
    leaderName: string;
    questionCount: number;
    /** 받은 사람 수 */
    participantCount: number;
    /** 연 사람 수 — 쓴 리더에게만 (받은 사람에겐 0) */
    readCount: number;
    sentAt: string;
    /** 내가 쓴 노트면 LEADER, 받은 노트면 PARTICIPANT */
    viewerRole: 'LEADER' | 'PARTICIPANT';
    previewQuestion: string;
  };
  questions: {
    id: string;
    question: string;
    /** 답변 — 아직 없거나 실패면 null */
    answer: string | null;
    status: ProsNoteAnswerStatus;
    askedAt: string;
  }[];
  /** 서버에 아직 없는 칸 (가짜 서버만) — 없으면 그 칸을 안 그려요 */
  extras?: {
    /** 질문마다 항목 종류 · 예문 (questions 와 같은 순서) */
    tags: ProNoteTag[];
    examples: string[][];
    /** 반에 남긴 인사 */
    bye: string;
    /** 받은 고마워요 수 (보낸 노트) */
    thanksCount: number;
  };
};

const pad = (n: number) => String(n).padStart(2, '0');

/** 가짜 서버: 예시 노트(받은 PRO_NOTES · 보낸 PRO_SENT_NOTES)를 서버 모양으로 */
function mockProsNote(id: string): ProsNoteDetail {
  const sent = PRO_SENT_NOTES.find((x) => x.id === id);
  const n = sent ?? PRO_NOTES.find((x) => x.id === id);
  if (!n) throw mockNotFound();
  const date = `${TODAY.getFullYear()}-${pad(n.m)}-${pad(n.d)}`;
  const [, time = '19:00'] = n.when.split(' ');
  return {
    note: {
      id: n.id,
      course: { courseId: n.team, title: teamNameByNo(n.team), languageLabel: '영어', branchName: getMe().branch, date, time, endTime: time },
      leaderName: sent ? getMe().name : n.pro,
      questionCount: n.items.length,
      participantCount: sent ? sent.total : 0,
      readCount: sent ? sent.readN : 0,
      sentAt: `${date}T13:00:00Z`,
      viewerRole: sent ? 'LEADER' : 'PARTICIPANT',
      previewQuestion: n.items[0]?.[1] ?? '',
    },
    questions: n.items.map(([, title, body], i) => ({ id: `${n.id}-${i}`, question: title, answer: body, status: 'ANSWERED', askedAt: `${date}T12:00:00Z` })),
    extras: { tags: n.items.map(([tag]) => tag), examples: n.items.map(([, , , ex]) => ex), bye: n.bye, thanksCount: sent ? sent.thanksN : 0 },
  };
}

/** GET /me/pros-notes/{id} */
export function fetchProsNote(id: string, { signal }: Opts = {}): Promise<ProsNoteDetail> {
  if (apiConfig.useMock) return mock('prosNote', () => mockProsNote(id));
  return http.get(`/me/pros-notes/${encodeURIComponent(id)}`, { signal });
}

/** POST /me/pros-notes/{id}/read — 받은 노트 열람 기록 (멱등 · 쓴 리더는 아무것도 안 바뀜) */
export function markProsNoteRead(id: string): Promise<void> {
  if (apiConfig.useMock) return mock('prosNoteRead', () => markNoteRead(id));
  return http.post<void>(`/me/pros-notes/${encodeURIComponent(id)}/read`);
}
