/**
 * PRO'S NOTE 한 장 (GET /me/pros-notes/{id}) 을 노트 화면 부품 모양(ProNote 항목 튜플)으로 바꾸고, 받은 노트면 열람을 남겨요.
 * 서버에 아직 없는 칸(항목 종류 · 예문 · 반에 남긴 인사 · 고마워요 · 친구들 반응)은 extras 가 없으면 비워 두고 화면이 그리지 않아요.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import type { ProNote } from '@/data/account';

import type { ProsNoteDetail } from './pros-notes';
import { markProsNoteRead } from './pros-notes';
import { prosNoteQuery, queryKeys } from './queries';

const WD = '일월화수목금토';

/**
 * 노트 화면 모양 — ProNote 와 같은 항목 튜플이라 항목 · 일기 · 표현 저장 부품을 그대로 써요.
 * team · when 은 서버 노트에 없어 빈 값이고, 수업 이름은 place 로 와요.
 */
export type NoteView = ProNote & {
  /** 수업 이름 (화면 머리 · 일기 · 저장한 표현 출처) */
  place: string;
  /** 내가 쓴 노트(리더)면 true */
  sent: boolean;
  /** 받은 사람 수 · 그중 연 사람 수 (보낸 노트) */
  total: number;
  readN: number;
  /** 받은 고마워요 수 — 서버에 아직 없으면 null (안 그려요) */
  thanksN: number | null;
  /** 친구들 반응(고마워요 바 · 보낸 마음) — 서버에 아직 없으면 false (안 그려요) */
  reactions: boolean;
};

/** 답변이 없을 때 항목 설명 자리 */
const noAnswer = (status: ProsNoteDetail['questions'][number]['status']) => (status === 'ANSWERING' ? '답변을 만들고 있어요' : '답변을 받지 못했어요');

export function toNoteView(d: ProsNoteDetail): NoteView {
  const [y, m, day] = d.note.course.date.split('-').map(Number);
  const x = d.extras;
  return {
    id: d.note.id,
    m,
    d: day,
    wd: WD[new Date(y, m - 1, day).getDay()],
    team: '',
    when: '',
    pro: d.note.leaderName,
    items: d.questions.map((q, i) => [x?.tags[i] ?? '질문', q.question, q.answer ?? noAnswer(q.status), x?.examples[i] ?? []]),
    bye: x?.bye ?? '',
    place: d.note.course.title,
    sent: d.note.viewerRole === 'LEADER',
    total: d.note.participantCount,
    readN: d.note.readCount,
    thanksN: x ? x.thanksCount : null,
    reactions: !!x,
  };
}

/** 노트 한 장 — 받은 노트를 처음 받아 오면 열람을 남기고 마이 '새 노트 n' 을 다시 받아요 */
export function useProsNote(id: string) {
  const q = useQuery({ ...prosNoteQuery(id), select: toNoteView });
  const read = useMarkProsNoteRead();
  const shouldMark = q.data != null && !q.data.sent;
  const { mutate } = read;
  useEffect(() => {
    if (shouldMark) mutate(id);
  }, [shouldMark, id, mutate]);
  return q;
}

/** 받은 노트 열람 기록 — 마이 카드의 '새 노트 n' 이 바뀌니 마이 집계를 무효화해요 */
export function useMarkProsNoteRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markProsNoteRead,
    // 열람 기록이 실패해도 노트는 그대로 보여요 — 다음에 열 때 다시 남겨요(멱등)
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.myPage }),
  });
}
