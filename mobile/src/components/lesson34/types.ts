/*
 * Lv.3 · 4 레슨 문제(블록) 모양 — 프로토타입 TKV.* 에 넘기던 객체를 그대로 데이터로.
 * 블록: say · pick · match · explain · choose · blind · duo · score · read(다듬은 글 다시 읽기)
 */
import type { SlotKey } from './text';

export type Head = { k?: string; p?: string; m?: string };
/** 묻는 말풍선: who 가 없으면 팔로(보라)가 물어요 */
export type Ask = { who?: string; c?: string; en: string; ko?: string };
export type CheckFn = RegExp | ((v: string) => boolean);
export type CheckRule = [string, CheckFn];

/** 문제 위에 얹는 카드 (프로토타입 t.card 자리) */
export type CardBlock =
  | { kind: 'kw2'; items: { w: string; m: string; star?: boolean }[] }
  | { kind: 'chips'; items: string[]; label?: string; on?: boolean }
  | { kind: 'bg'; text: string }
  | { kind: 'before'; label: string; text: string }
  | { kind: 'plain'; label: string; en: string }
  | { kind: 'useful'; label: string; en: string };

/** 말한 뒤 결과 아래에 더 보여 줄 것 (저널 정리 · 질문 날카로움) */
export type SayExtra =
  | { kind: 'journal'; date: string; text: string; marks: RegExp[]; use: string[]; used: string[]; fixes: [string, string][] }
  | { kind: 'sharp'; n: number; who: string; c: string; en: string; ko: string };

export type SaveCtx = { checksOn: number };
/** save 가 돌려주면: extra(결과 아래) · next(뒤 문제를 이걸로 바꿔요) */
export type SaveOut = { extra?: SayExtra; next?: Task34[] } | void;

export type SayTask = {
  type: 'say';
  kick: string;
  head?: Head;
  ask?: Ask;
  card?: CardBlock;
  /** 준비 시간(초) — 말하기 전에 원형 시계 (보라) */
  prep?: number;
  /** 말 시작 제한(초) — 화면이 열리면 바로 시계가 돌아요 */
  startIn?: number;
  /** 말하는 시간(초) */
  limit?: number;
  /** 먼저 읽어 주는 문장 (듣고 바로 말하기) */
  listen?: string;
  combo?: boolean;
  checks?: CheckRule[];
  /** 체크 몇 개면 통과 (없으면 전부) */
  need?: number;
  minWords?: number;
  marks?: RegExp[];
  model?: string;
  modelLabel?: string;
  modelKo?: string;
  prompt?: string;
  prepTip?: string;
  ph?: string;
  okMsg?: string;
  noMsg?: string;
  /** 칸 나누기 (선택 · 이유 · 예시 · 사회적 관점) */
  split?: { keys: SlotKey[]; ex?: string[] };
  /** 통과하면 팔로의 꼬리 질문 [질문, 뜻, 예시 답] */
  follow?: [string, string, string];
  upgrade?: boolean;
  /** 정답이 하나인 말하기 (바꿔 말하기): 틀리면 힌트 → 정답 카드 */
  exact?: boolean;
  oneLine?: boolean;
  noWrite?: boolean;
  /** 즉흥 룰렛 토픽 */
  roulette?: { en: string; ko: string }[];
  /** 디베이트 라운드 (점수 계산에 들어가요) */
  deb?: boolean;
  /** 말하기가 어려워요: 쓰기로 바꾸기 어려운 문제는 고르기로 */
  alt?: PickTask;
  save?: (v: string, ctx: SaveCtx) => SaveOut;
};

export type PickTask = {
  type: 'pick';
  kick?: string;
  head?: Head;
  label?: string;
  /** 문제 카드: big(큰 낱말) · ex(예문 + 뜻) · en(문장) · ko · blank(빈칸 문장) */
  q?: { en?: string; ko?: string; big?: string; ex?: [string, string]; blank?: string };
  /** 듣고 고르기 */
  play?: string;
  /** 소리 끄기일 때 대신 (글자 보고 고르기) */
  readAlt?: PickTask;
  limit?: number;
  combo?: boolean;
  opts: string[];
  /** 정답 번호 (-1 이면 아무거나 · 편 고르기) */
  ans: number;
  keep?: boolean;
  /** 정답 듣기 문장 (false 면 듣기 없음) */
  sayAns?: string | false;
  noCards?: boolean;
  mark?: [string, string];
  explain?: string;
  footMsg?: string;
  ox?: boolean;
  /** 고른 뒤 뒤에 끼울 문제 */
  then?: (sel: number, ok: boolean) => Task34[];
};

export type MatchTask = { type: 'match'; kick: string; id: string; pairs: [string, string][]; time: number };
export type ExplainTask = { type: 'explain'; kick: string; head?: Head; k: string; title: string; body?: string; ex?: [string, string?][]; note?: string; go?: string; listen?: string };
export type ChooseTask = { type: 'choose'; kick: string; head?: Head; n: number; items: { en: string; ko: string }[]; msg?: string; make: (idx: number[]) => Task34[] };
export type BlindTask = { type: 'blind'; kick: string; head?: Head; lines: [string, string][]; max?: number; go?: string };
export type DuoTask = { type: 'duo'; kick: string; head?: Head; who: string; c: string; lines: [string, string, (1 | undefined)?][]; ph?: string; result?: { title: string; items: (mine: string[]) => string[] } };
export type ScoreTask = { type: 'score'; kick: string; keys: string[] };
/** 다듬은 글을 다시 소리 내어 읽기 (프로토타입 journal ② · TKV.shadow pass) */
export type ReadTask = { type: 'read'; kick: string; en: string; ko: string; label: string };

export type Task34 = SayTask | PickTask | MatchTask | ExplainTask | ChooseTask | BlindTask | DuoTask | ScoreTask | ReadTask;

/** 문제마다 쌓는 기록 (디베이트 점수 · 콤보) */
export type LogItem = { k: string; v: string; ok: boolean; late?: boolean; deb?: boolean };
