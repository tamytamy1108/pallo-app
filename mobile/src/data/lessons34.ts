/**
 * Lv.3 · 4 레슨 (프리토킹 레벨) — 단계 목록 · 회차 콘텐츠 찾기 (가짜). 값 · id 는 프로토타입 STUDY_STEPS.topic · .debate 그대로예요.
 * 맞는 API: 18 `/lessons/:id` (회차 콘텐츠) · 21 `/lessons/:id/steps/:step` (단계 콘텐츠)
 *          · 19 `/me/progress` · 20 `/me/progress/:lesson/:step` (진행 · 완료)
 */
import { LV3_101, LV3_101_SQ } from '@/data/lesson34-lv3';
import { LV4_101, LV4_HW } from '@/data/lesson34-lv4';

export type Stage = 'pre' | 'main' | 'post';
/** 단계 (xp = 처음 끝낼 때 받는 포인트) */
export type Step34 = { id: string; t: string; d: string; min: number; xp: number };

/** 키워드: [표현, 뜻, 예문, 예문 뜻] */
export type Keyword = [string, string, string, string];
/** DAILY TOPIC 질문: kw = 키워드 번호 · fq = 꼬리 질문 · more = 더 이야기하기 · tw = 주제 낱말(벗어났는지 볼 때) */
export type DailyQ = { en: string; ko: string; kw: number[]; fq: [string, string][]; more: [string, string]; tw: RegExp };
/** 대화 중 바로 고쳐 주는 규칙: [찾기, 고치기, 이유] (실제 앱은 AI 교정) */
export type LiveFix = [RegExp, (v: string) => string, string];
export type SpeakItem = { en: string; ko: string; hint: string };

export type Lv3Unit = {
  title: string;
  daily: DailyQ[];
  keywords: Keyword[];
  /** 지난주 단어: [단어, 뜻, 예문] */
  /** [낱말, 뜻, 예문, 빈칸 예문 더…] — 지난주 단어 빈칸 채우기에 예문을 다 써요 */
  prev: [string, string, string, ...string[]][];
  topic: {
    title: string;
    follow: [string, string];
    lines: [string, string][];
    expr: [string, string][];
    /** 독해 질문: [질문, 뜻, 모범 답] */
    /** [질문, 뜻, 정답, 오답 보기] — 독해 질문은 3개 중 고르기 */
    check: [string, string, string, string[]?][];
  };
  /** fill: 미리 써 둔 일기 · 문장마다 빈칸(___) 하나 [문장, 정답 표현, 뜻] */
  journal: { title: string; q: string; ko: string; use: string[]; sample: string; fill: [string, string, string][] };
  live: LiveFix[];
};

export type FreeQ = { bg: string; en: string; ko: string };
export type Side = { t: string; ko: string; arg: string };
export type Debate = {
  q: string;
  qKo: string;
  warm?: [string, string][];
  situation: string;
  situationKo: string;
  A: Side;
  B: Side;
  askA: string[];
  askB: string[];
  reply?: { A: string; B: string };
  /** USEFUL LINE: [표현, 예문, 쓰임] */
  useful?: [string, string, string];
  /** key 의 뒤 n개가 DEBATE KEY EXPRESSIONS */
  dkey?: number;
};
export type Lv4Unit = {
  ice: { en: string; ko: string; hint: string }[];
  free: FreeQ[];
  /** SAY IT BETTER: [평소 표현, 업그레이드 표현, 쓰임?] */
  better: [string, string, string?][];
  /** KEY EXPRESSIONS: [표현, 뜻, 예문] */
  key: [string, string, string][];
  debate: Debate;
};

export const STEPS34: Record<3 | 4, Record<Stage, Step34[]>> = {
  3: {
    pre: [
      { id: 'kwl', t: 'KEYWORDS 익히기', d: '키워드 12개 · 예문 듣고 뜻 고르기', min: 4, xp: 5 },
      { id: 'tread', t: 'JOURNAL 지문 읽기', d: 'Forgotten Name · 듣고 읽기', min: 4, xp: 5 },
      { id: 'match', t: 'USEFUL EXPRESSIONS', d: '지문 표현 6개 짝 맞추기', min: 2, xp: 5 },
      { id: 'pick6', t: '오늘의 질문 미리 보기', d: '질문 6개 훑고 3개 별표 · 답은 본학습에서', min: 2, xp: 5 },
    ],
    main: [
      { id: 'warm', t: '지난주 단어로 말하기', d: '단어 4개 · 5초 안에 뜻 → 그 단어로 한 문장', min: 3, xp: 5 },
      { id: 'dtalk', t: 'AI 대화 · DAILY TOPIC', d: '필수 · 질문 6개를 AI와 차례로 · 꼬리 질문으로 이어 가요', min: 12, xp: 25 },
      { id: 'ttalk', t: 'TOPIC 이야기하기', d: '꼬리 질문 · 독해 질문 2개 · 표현으로 내 질문 만들기', min: 5, xp: 10 },
    ],
    post: [
      { id: 'quiz', t: '스피킹 퀴즈', d: '키워드 · 표현 문장을 한국어 보고 영어로', min: 5, xp: 10 },
      { id: 'journal', t: 'JOURNAL · 말하는 일기', d: '요즘 내 일상 · 빈칸에 표현 넣어 일기 완성', min: 6, xp: 15 },
      { id: 'ba', t: 'Before / After', d: 'AI 대화 때 답과 지금 답 비교', min: 3, xp: 10 },
    ],
  },
  4: {
    pre: [
      { id: 'free', t: 'FREE TALK 준비', d: '5개 중 2개 골라 1분씩 · 사회적 관점까지', min: 6, xp: 10 },
      { id: 'key', t: 'KEY EXPRESSIONS', d: '뜻 타임어택 → 표현마다 10초 즉석 문장', min: 4, xp: 5 },
      { id: 'side', t: '내 입장 정하기', d: 'SITUATION 듣기 → 편 고르기 → 1분 30초 리허설', min: 5, xp: 10 },
    ],
    main: [
      { id: 'free2', t: 'FREE TALK · 1:1', d: 'AI와 질문 5개 · SAY IT BETTER 표현 2개 넣기 미션', min: 8, xp: 15 },
      { id: 'deb', t: 'DEBATE · AI 3라운드', d: '1차 주장 → 반박 20 · 15 · 10초 → 정리 · 점수와 MVP', min: 10, xp: 20 },
      { id: 'fq', t: 'FOLLOW-UP 질문 만들기', d: '상대를 흔들 질문 · 날카로움 1~5 · 상대 질문에 1분 답', min: 5, xp: 15 },
    ],
    post: [
      { id: 'better', t: 'SAY IT BETTER 즉시 변환', d: '평소 표현을 듣고 5초 안에 업그레이드 표현으로', min: 2, xp: 10 },
      { id: 'swap', t: '편 바꾸기', d: '반대편이 되어 1분 발언 · 생각의 폭 넓히기', min: 3, xp: 10 },
      { id: 'final', t: 'FINAL POSITION + 즉흥 룰렛', d: '처음 ↔ 지금 입장 · 보너스 15초 준비 1분 스피치', min: 4, xp: 10 },
    ],
  },
};
export const ORDER3: Stage[] = ['pre', 'main', 'post'];

/** 회차: 데이터가 있는 회차만 (나머지는 라이브러리에서 '준비 중') */
export type Unit34 = { lv: 3; no: number; title: string; D: Lv3Unit; sq: SpeakItem[] } | { lv: 4; no: number; title: string; D: Lv4Unit };
/**
 * Lv.4 는 한국어 해석 없이 보여요 (2026-11-29): 질문 · 토론 주제 · 상황 지문 · 편 이름의 해석을 비워요.
 * KEY EXPRESSIONS 뜻 (짝 맞추기 문제) · SAY IT BETTER 쓰임 설명은 그대로 둬요. 해석 칸이 비면 화면이 그 줄을 안 그려요.
 */
const noKo4 = (D: Lv4Unit): Lv4Unit => ({
  ...D,
  ice: D.ice.map((q) => ({ ...q, ko: '' })),
  free: D.free.map((q) => ({ ...q, ko: '' })),
  debate: { ...D.debate, qKo: '', situationKo: '', warm: D.debate.warm?.map(([en]): [string, string] => [en, '']), A: { ...D.debate.A, ko: '' }, B: { ...D.debate.B, ko: '' } },
});
const UNITS: Unit34[] = [
  { lv: 3, no: 101, title: 'The Present', D: LV3_101, sq: LV3_101_SQ },
  { lv: 4, no: 101, title: 'The Present', D: noKo4(LV4_101) },
  { lv: 4, no: 102, title: 'Behind the Mask', D: noKo4(LV4_HW) },
];
export const findUnit34 = (lv: number, no: number) => UNITS.find((u) => u.lv === lv && u.no === no);

/** 단계 찾기 (같은 회차 예습 → 본학습 → 복습 순서로 펼친 목록 안에서) */
export function findStep34(lv: 3 | 4, id: string) {
  const all = ORDER3.flatMap((stage) => STEPS34[lv][stage].map((s) => ({ ...s, stage })));
  const index = all.findIndex((s) => s.id === id);
  const step = all[index];
  return step ? { step, all, index } : null;
}

/** 회차 이름 (프로토타입 lessonName: Lv.3 '#101 The Present' · Lv.4 'The Present') */
export const unitName34 = (u: Unit34) => (u.lv === 3 ? `#${u.no} ${u.title}` : u.title);
