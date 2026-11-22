/**
 * 상황 퀴즈 문제 만들기 (프로토타입 sitQuizItems 그대로).
 * 같은 상황 15개를 레벨마다 다른 방식 · 다른 보기로 물어요.
 * - Lv.0 왕기초: 장면 단어 8개(한국어 → 영어 단어) + 기초 문법 7개(빈칸) · 답하면 문법 팁
 * - Lv.1 입문: 한국어 뜻 → 표현 · 쉬운 빈칸 (3문제마다 하나)
 * - Lv.2 기초: 한국어 상황(+상대의 말) → 표현 · 빈칸
 * - Lv.3 중급: 상대의 영어 말을 듣고 답 (한국어 없음) · 말이 없는 상황은 딱 맞는 말 고르기
 * - Lv.4 고급: 글자 없이 듣기만 하고 답 · 가장 자연스러운 말 고르기 (직역 함정)
 */
import type { QuizLevel } from '@/data/situation';
import type { SceneContent } from '@/data/situation-content';

import { shuffle } from './parts';

/** 문제 위 칸 · 아래 칸에 들어가는 것 */
export type QuizPart =
  | { k: 'word'; text: string } // .sq-word 큰 한국어 낱말
  | { k: 'prompt'; text: string } // .st-prompt 굵은 글씨 (뜻)
  | { k: 'ctx'; text: string } // .sq-ctx 상황 설명
  | { k: 'blank'; before: string; after: string } // 빈칸 문장 (.st-blk)
  | { k: 'bubble'; who: string; line: string; hide: boolean }; // .sq-bub 상대의 말 (Lv.4 는 글자 없이)

export type QuizItem = {
  kick: string;
  top: QuizPart;
  q?: QuizPart;
  ans: string;
  /** 오답 보기 후보 (앞에서부터 3개) */
  opts: string[];
  /** 문법 팁 (Lv.0 문법) */
  tip?: string;
  /** 결과 · 저장에 쓰는 [영어 문장, 뜻] */
  mk: [string, string];
  /** 문제가 나오면 읽어 줄 상대의 말 */
  auto?: string;
};

/** 문장에서 빈칸 단어 하나를 빈칸으로 (처음 나오는 곳) */
function blankOf(sentence: string, word: string): QuizPart {
  const at = sentence.indexOf(word);
  if (at < 0) return { k: 'blank', before: sentence, after: '' };
  return { k: 'blank', before: sentence.slice(0, at), after: sentence.slice(at + word.length) };
}

export function quizItems(c: SceneContent, lv: QuizLevel): QuizItem[] {
  const who = c.rp.who;
  if (lv === 0 && c.q0.length) {
    return c.q0.map((row) => {
      if (row[0] === 'w') {
        const [, ko, x, ans, wr] = row;
        return { kick: '이 단어를 영어로 하면?', top: { k: 'word', text: ko }, ans, opts: wr, mk: [x, `${ko} = ${ans}`] };
      }
      const [, ko, x, ans, wr, tip] = row;
      const [before, after] = x.split('___');
      return { kick: '빈칸에 맞는 말을 골라요 · 기초 문법', top: { k: 'prompt', text: ko }, q: { k: 'blank', before, after: after ?? '' }, ans, opts: wr, tip, mk: [x.replace('___', ans), `${ko} · ${tip}`] };
    });
  }
  const Q = c.quiz;
  const others = (i: number) => shuffle(Q.filter((_, k) => k !== i).map((q) => q[2]));
  const bubble = (line: string, hide = false): QuizPart => ({ k: 'bubble', who, line, hide });
  const ctx = (text: string): QuizPart => ({ k: 'ctx', text });
  return Q.map((q, i): QuizItem => {
    const [cx, l, a, k, b, near, awk, wb] = q;
    const mk: [string, string] = [a, k];
    if (b && i % 3 === 2 && lv <= 2) {
      // 빈칸 오답: 그 문제의 오답 2개 + 다른 문제의 빈칸 단어 (정답 문장에 없는 것)
      const more = Q.map((_, n) => Q[(i + 5 + n) % Q.length][4]).filter((x): x is string => !!x && x !== b && !wb.includes(x) && x.length > 3 && !a.includes(x));
      return {
        kick: lv === 1 ? '빈칸에 들어갈 말을 골라요' : '빈칸을 채워 이 상황에 맞는 문장을 완성해요',
        top: lv === 1 ? { k: 'prompt', text: k } : ctx(cx),
        q: blankOf(a, b),
        ans: b,
        opts: [...wb.filter(Boolean), ...more].slice(0, 3),
        mk,
      };
    }
    if (lv === 1) return { kick: '뜻에 맞는 표현을 골라요', top: { k: 'prompt', text: k }, ans: a, opts: others(i).slice(0, 3), mk };
    if (lv === 2) return { kick: '이 상황에서 뭐라고 할까요?', top: ctx(cx), q: l ? bubble(l) : undefined, ans: a, opts: [near[0], ...others(i).slice(0, 2)], mk };
    if (lv === 3)
      return l
        ? { kick: '상대의 말에 알맞게 답해요', top: bubble(l), ans: a, opts: [...near, others(i)[0]], mk, auto: l }
        : { kick: '이 상황에 딱 맞는 말을 골라요', top: ctx(cx), ans: a, opts: [...near, awk], mk };
    return l
      ? { kick: '듣고 가장 자연스럽게 답해요', top: bubble(l, true), q: ctx(cx), ans: a, opts: [...near, awk], mk: [a, `${who}: ${l} → ${k}`], auto: l }
      : { kick: '원어민처럼 가장 자연스러운 말을 골라요', top: ctx(cx), ans: a, opts: [...near, awk], mk };
  });
}

/** 보기 4개: 정답 + 오답 앞에서 3개를 섞어요 */
export const optionsOf = (it: QuizItem) => shuffle([it.ans, ...it.opts.filter((x) => x && x !== it.ans).slice(0, 3)]);

