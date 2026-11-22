/**
 * 레슨 (Lv.1 · 2) 단계 · 문제 데이터 (가짜). 값은 프로토타입 STUDY_STEPS.pattern · LV1_01 · LV2_01 · runPattern · runDialogue 와 같아요.
 * 맞는 API: 18 `/lessons/:id` (과 콘텐츠 한 덩어리) · 20 `/me/progress/:lesson/:step` (진행 저장)
 * 새 과는 LessonData 한 덩어리만 더하면 돼요 (LESSONS).
 */
import { LV1_01 } from '@/data/lesson-lv1';
import { LV2_01 } from '@/data/lesson-lv2';

/* ───────────── 과 콘텐츠 ───────────── */

/** 오늘의 패턴 (프로토타입 patterns[]: p 패턴 · short 형광펜 부분 · m 뜻 · re 쓰였는지 찾는 글자 · ex 예문) */
export type PatternDef = { id: string; p: string; short: string; m: string; re: string; ex: [string, string][] };
/** 대화문 한 줄: [인물, 영어, 뜻, 패턴 부분] */
export type DialogueLine = [string, string, string, string?];
/** Word · Speaking Bank 한 줄: [예문, 표현, 뜻 빈칸 문장, 빈칸 답] */
export type BankRow = [string, string, string, string];
/** 상황 활동 응대 대화 한 마디: [손님 영어, 손님 뜻, 내 답, 내 답 뜻] */
export type WcLine = [string, string, string, string];

export type LessonData = {
  lv: number;
  unit: number;
  title: string;
  ice: { en: string; ko: string; hint: string }[];
  patterns: PatternDef[];
  dialogue: { title: string; cast: string[]; roles: Record<string, string>; lines: DialogueLine[]; blank: { sp: string; ko: string; sample: string } };
  bankName: string;
  bank: BankRow[];
  /** 챌린지 상황 카드: [상황, 모범 답] */
  chal: [string, string][];
  actTitle: string;
  /** Lv.1 상황 활동: 교재 그림 속 인물 → 단어 카드 응대 대화 */
  scene?: {
    /** 교재 그림 이름 (assets/images/lesson/<photo>.jpg) */
    photo: string;
    people: { name: string; x: number; y: number; clue: string; say: string }[];
    talks: { who: string; me: string; lines: WcLine[] }[];
  };
  /** Lv.2 상황 역할극 (차례마다 미션) */
  act?: {
    who: string;
    me: string;
    title: string;
    intro: string;
    opener: string;
    lines: [string, string][];
    turns: { t: string; re: string }[];
    replies: string[][];
  };
  story: { title: string; ask: string; options: string[]; qs: [string, string][]; template: string; ex?: string[][][] };
  talk: { who: string; lines: [string, string][]; replies: string[][] };
};

const LESSONS: LessonData[] = [LV1_01, LV2_01];

export const getLesson = (lv: number, unit: number) => LESSONS.find((l) => l.lv === lv && l.unit === unit) ?? null;

/* ───────────── 단계 ───────────── */

export type Stage = 'pre' | 'main' | 'post';
export type StepId = 'pat' | 'dlg' | 'bank' | 'sit' | 'story' | 'talk' | 'quiz' | 'chal';
export type StepDef = { id: StepId; stage: Stage; t: string; d: string; xp: number };

/** 한 과의 단계 (프로토타입 STUDY_STEPS.pattern · xp = 처음 완료할 때 받는 포인트). 상황 활동 id 는 앱에서 'sit' (프로토타입 'act') */
export const STEP_DEFS: StepDef[] = [
  { id: 'pat', stage: 'pre', t: '오늘의 패턴', d: '패턴 카드 · 예문 듣고 따라 말하기', xp: 5 },
  { id: 'dlg', stage: 'pre', t: '대화문', d: '듣기 → 따라 말하기 → 마지막 대사 만들기', xp: 10 },
  { id: 'bank', stage: 'pre', t: 'Bank 퀴즈', d: '상황 표현 10개 뜻 맞히기', xp: 5 },
  { id: 'sit', stage: 'main', t: '상황 활동', d: '교재 활동을 AI와 역할극으로', xp: 15 },
  { id: 'story', stage: 'main', t: 'My Story', d: '내 경험 키워드 → 문단 완성', xp: 15 },
  { id: 'talk', stage: 'main', t: 'AI 프리토킹', d: '교재 질문으로 꼬리 질문 대화', xp: 15 },
  { id: 'quiz', stage: 'post', t: '스피킹 퀴즈', d: '한국어 보고 영어로 · 단어별 채점', xp: 10 },
  { id: 'chal', stage: 'post', t: '30초 말하기 챌린지', d: '처음 보는 상황에서 패턴 써 보기', xp: 10 },
];
export const STAGE_KO: Record<Stage, string> = { pre: '예습', main: '본학습', post: '복습' };

export const stepDef = (id: string) => STEP_DEFS.find((s) => s.id === id || (id === 'act' && s.id === 'sit')) ?? null;

/** 단계 이름 (프로토타입 stepTitle: Bank 는 과마다 이름이 달라요) */
export const stepTitle = (s: StepDef, D: LessonData) => (s.id === 'bank' ? `${D.bankName} 퀴즈` : s.id === 'sit' ? D.actTitle || s.t : s.t);

/** 다음에 할 단계: 같은 구역에서 안 한 단계 → 다음 구역 (프로토타입 finishStep 의 nxt) */
export function nextStepAfter(cur: StepDef, isDone: (id: StepId) => boolean) {
  const order: Stage[] = ['pre', 'main', 'post'];
  for (const st of order.slice(order.indexOf(cur.stage))) {
    const n = STEP_DEFS.find((s) => s.stage === st && s.id !== cur.id && !isDone(s.id));
    if (n) return n;
  }
  return null;
}

/* ───────────── 레슨 진행기 문제 (프로토타입 TKV.*) ───────────── */

/** 따라 말하기: 한국어 뜻을 보고 섞인 단어 카드를 말로(또는 눌러서) 순서대로 이어요 */
export type ShadowTask = {
  type: 'shadow';
  en: string;
  ko: string;
  kick?: string;
  /** 위 머리: 오늘의 패턴 n · 예문 k/3 */
  head?: { kicker: string; pattern: string; short: string; meaning: string };
  /** 패턴 부분 (보라 밑줄) */
  focus?: RegExp | null;
  /** 앞사람 대사 (대화문 역할 연기) */
  ctx?: { who: string; en: string; ko: string } | null;
  /** 내 역할 (대화문 역할 연기) — 노랑 말풍선에 뜻, 오른쪽에 내 인물 얼굴 */
  me?: string;
  /** My Story 따라 읽기: 한 문장씩 · 맞춘 문장만 글자로, 남은 문장은 회색 점선 */
  para?: { ss: string[]; k: number; all: string } | null;
};
/** 줄 순서 맞추기 */
export type OrderTask = { type: 'order'; lines: { who: string; en: string }[]; what?: string; after?: string; kick?: string };
/** 역할 고르기 → 내 대사만 따라 말하기 */
export type RoleTask = { type: 'role'; cast: string[]; roles: Record<string, string>; lines: DialogueLine[]; kick?: string; pool: string[] };
/** 단어 카드로 문장 만들기 */
export type BuildTask = { type: 'build'; en: string; ko: string; label?: string; kick?: string; pool: string[] };
/** 짝 맞추기 타임어택 */
export type MatchTask = { type: 'match'; id: string; pairs: [string, string][]; time: number; kick?: string };
/** 질문에 답하기 (처음 답변으로 저장 → 복습 Before / After) */
export type AnswerTask = { type: 'answer'; q: { en: string; ko: string; hint: string }; qi: number; key: string; kick?: string; pool: string[] };
/** 고르기: O/X · 듣고 고르기 · 빈칸 (소리 끄기면 readAlt 로) */
export type PickTask = {
  type: 'pick';
  kick?: string;
  label?: string;
  q?: { en?: string; ko?: string };
  /** 듣고 고르기: 이 문장을 들려줘요 (글로는 안 보여요) */
  play?: string;
  /** 소리 끄기일 때 대신 낼 문제 (글자 보고 고르기) */
  readAlt?: Omit<PickTask, 'readAlt'>;
  opts: string[];
  /** 정답 번호 (-1 이면 정답 없이 고르기만) */
  ans: number;
  ox?: boolean;
  explain?: string;
  limit?: number;
};
export type Task = ShadowTask | OrderTask | RoleTask | BuildTask | MatchTask | AnswerTask | PickTask;

/** 문제 유형마다 제한 시간 (초) · 시간 안에 맞히면 빠른 답 (프로토타입 TK_LIMIT · 말하기가 어려우면 1.5배) */
const TK_LIMIT: Partial<Record<Task['type'], number>> = { pick: 10, order: 20, build: 20, match: 60, shadow: 25, answer: 40 };
export const taskLimit = (t: Task, noSpeak: boolean) => {
  const b = TK_LIMIT[t.type];
  return b ? Math.round(b * (noSpeak ? 1.5 : 1)) : 0;
};

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[’']/g, "['’]");
export const patRe = (p: PatternDef) => new RegExp(p.re.replace(/'/g, "['’]"), 'i');
/** 다른 문제 카드에 섞을 낱말 (프로토타입 lessonWords) */
const lessonWords = (D: LessonData) => [...D.patterns.flatMap((p) => p.ex.flatMap((e) => e[0].split(/\s+/))), ...D.bank.flatMap((b) => b[0].split(/\s+/))];

/** 오늘의 패턴: 패턴마다 예문 3개 따라 말하기 (프로토타입 runPattern) */
export function patternTasks(D: LessonData = LV1_01): ShadowTask[] {
  return D.patterns.flatMap((p, pi) =>
    p.ex.slice(0, 3).map(([en, ko], k) => ({
      type: 'shadow' as const,
      en,
      ko,
      kick: `오늘의 패턴 · ${p.short}`,
      head: { kicker: `오늘의 패턴 ${pi + 1} · 예문 ${k + 1}/3`, pattern: p.p, short: p.short, meaning: p.m },
      focus: patRe(p),
    })),
  );
}

/** 대화문: 순서 맞추기 → 역할 골라 내 대사 따라 말하기 → 마지막 대사 만들기 (프로토타입 runDialogue) */
export function dialogueTasks(D: LessonData): Task[] {
  const G = D.dialogue;
  const pool = G.lines.flatMap((l) => l[1].split(/\s+/));
  return [
    { type: 'order', lines: G.lines.map((l) => ({ who: l[0], en: l[1] })), kick: '대화문 · ① 순서 맞추기', after: '이제 역할을 골라 연기해요' },
    { type: 'role', cast: G.cast, roles: G.roles, lines: G.lines, kick: '대화문 · ② 역할 고르기', pool },
    { type: 'build', en: G.blank.sample, ko: G.blank.ko, label: `마지막 대사 · ${G.blank.sp}`, kick: '대화문 · ③ 마지막 대사 만들기', pool },
  ];
}

/** 역할을 고르면 내 대사마다 따라 말하기 문제가 생겨요 (앞사람 대사를 말풍선으로) */
export function roleLineTasks(t: RoleTask, me: string): ShadowTask[] {
  return t.lines.flatMap((l, i) => {
    if (l[0] !== me) return [];
    const prev = t.lines[i - 1];
    return [
      {
        type: 'shadow' as const,
        en: l[1],
        ko: l[2],
        me,
        kick: `대화문 · ${me} 역할 연기`,
        focus: l[3] ? new RegExp(escapeRe(l[3]), 'i') : null,
        ctx: prev ? { who: prev[0], en: prev[1], ko: prev[2] } : null,
      },
    ];
  });
}

/** Word · Speaking Bank: 짝 맞추기 타임어택 (프로토타입 runBank) */
export const bankTasks = (D: LessonData): Task[] => [{ type: 'match', id: 'bank', pairs: D.bank.map((b) => [b[1], b[3]]), time: 30, kick: `${D.bankName} · 30초 타임어택` }];

/** My Story: 내 문단 문장 순서 맞추기 → 한 문장씩 따라 읽기 (프로토타입 runStory) */
export function storyTasks(para: string): Task[] {
  const sents = para
    .split(/(?<=[.!?])\s+/)
    .map((x) => x.trim())
    .filter(Boolean);
  // 따옴표로 끝나는 문장(… room.")까지 한 문장으로 끊어요
  const split1 = (x: string) =>
    x
      .split(/(?<=[.!?]["”’]?)\s+(?=["“A-Z])/)
      .map((y) => y.trim())
      .filter(Boolean);
  const groups = sents.map(split1);
  const total = groups.reduce((n, g) => n + g.length, 0);
  let no = 0;
  const shadows: ShadowTask[] = groups.flatMap((ss, ci) =>
    ss.map((en, si) => ({ type: 'shadow' as const, en, ko: `문장 ${++no}/${total}`, kick: 'My Story · ② 따라 읽기', para: ss.length > 1 ? { ss, k: si, all: sents[ci] } : null })),
  );
  return [{ type: 'order', what: '문장', lines: sents.map((en) => ({ who: '', en })), kick: 'My Story · ① 문장 순서 맞추기', after: '이제 한 문장씩 따라 읽어요' }, ...shadows];
}

/** 챌린지 마무리: 모범 답 따라 말하기 (프로토타입 runShadowFinish) */
export const chalFinishTasks = (model: string, sit: string): Task[] => [{ type: 'shadow', en: model, ko: sit, kick: '30초 챌린지 · 모범 답 따라 말하기' }];

/** 단어 카드에 섞을 낱말 */
export const lessonPool = lessonWords;

/** 스피킹 퀴즈 문제: 패턴 예문 3개씩 + Bank 표현 (프로토타입 speakItems) */
export const speakItems = (D: LessonData) => [
  ...D.patterns.flatMap((p) => p.ex.slice(0, 3).map(([en, ko]) => ({ en, ko, hint: p.p }))),
  ...D.bank.map(([en, k, ko, ans]) => ({ en, ko: ko.replace('___', ans), hint: k })),
];

/* ───────────── 반응 · 축하 문구 ───────────── */

/** 잘했을 때 반응 (프로토타입 REACT_BY[0].good) */
export const GOOD_REACTIONS: [string, string][] = [
  ['Nailed it!', '완벽하게 해냈어요!'],
  ['Spot on!', '딱 맞았어요!'],
  ['You got it!', '맞혔어요!'],
  ['Way to go!', '잘했어요, 바로 그거예요!'],
  ["That's exactly right!", '정확히 맞아요!'],
];

/** 틀렸을 때 보라 팔로 한마디 (프로토타입 REACT_BY[0].bad) */
export const BAD_REACTIONS: [string, string][] = [
  ['So close!', '아깝다, 거의 맞았어요!'],
  ["No worries, you'll get it next time!", '괜찮아요, 다음엔 맞힐 거예요!'],
  ['Practice makes perfect.', '연습이 완벽을 만들어요.'],
  ["Let's give it another shot!", '한 번 더 해 봐요!'],
];

/** 두 번 연속 맞히면 보라 팔로 응원 (프로토타입 CHEER.streak) */
export const CHEER_STREAK = ['잘하고 있어요!', '오, 감 잡았네요!', '이 기세로 쭉 가요!'];

/** 완료 화면 제목 (프로토타입 CEL_TITLE) */
export const CEL_TITLE = {
  perfect: ['완벽해요!', '하나도 안 틀렸어요!', '만점이에요!', '오늘 컨디션 최고!', '이건 그냥 실력이에요!'],
  good: ['훌륭해요!', '잘했어요!', '감 잡았어요!', '실력이 늘고 있어요!', '이 기세 좋아요!', '오늘도 해냈어요!'],
  tried: ['끝까지 해냈어요!', '포기하지 않았어요!', '틀린 만큼 배웠어요!', '한 걸음 더 왔어요!'],
};

export const pickOne = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)];
