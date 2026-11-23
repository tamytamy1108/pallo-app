/**
 * 라이브러리 — 단계 구성 · 이름 규칙 + 가짜 서버 값(책장 BOOKS). 값은 프로토타입 LANGS · LIB · STUDY_STEPS 그대로예요.
 * 맞는 API: 16 `/library/maps` (맵 칩) · 17 `/library/books` (책장 · 과 목록) · 18 `/lessons/:id` · 24 `/lessons/:id/listen-items`
 * 화면은 BOOKS 를 직접 읽지 않고 api/queries 의 bookShelfQuery · situationMapsQuery 로 받아요.
 * - 상황 맵 · 장면은 @/data/maps 의 JSON 한 줄에서 와요 (한 줄 = 칩 · 3D 지도 · 장면 목록이 저절로).
 *   3D 지도 모양은 그 줄의 preset 키 (components/library/world/presets.ts).
 */
import { Colors } from '@/constants/theme';

import { STUDY_LEVELS } from './library-lessons';
import { LISTEN_ITEMS } from './library-listen';
import { localSceneListenItems, sceneIdOf, type Scene, type SituationMap, type SoonMap } from './situation';

export type StageKey = 'pre' | 'main' | 'post';
export type StudyKind = 'pattern' | 'topic' | 'debate';

/** 단계 하나 (xp = 처음 끝낼 때 받는 포인트) */
export type Step = { id: string; t: string; d: string; min: number; xp: number };

export type Pdf = { path: string; name: string; size: string };

/** 과 화면 위 요약 카드에 쓰는 것만 (과 콘텐츠 전체는 레슨 화면이 따로 받아요) */
export type LessonSummary =
  | { kind: 'pattern'; patterns: { p: string; m: string }[]; bankName: string; actTitle: string }
  | { kind: 'topic'; topicTitle: string; pdf?: Pdf }
  | { kind: 'debate'; q: string; qKo: string; pdf?: Pdf };

export type Lesson = { no: number; title: string; sub: string; pats?: string[]; data?: LessonSummary };

export type StudyLevel = { lv: number; series: string; c: string; kind: StudyKind; total?: number; about: string; lessons: Lesson[] };

/** 언어별 책장의 한 권 (study 가 없으면 잠긴 섬 · 교재 소개만) */
export type Book = { id: string; n: string; l: string; s?: string; c: string; jp?: boolean; lab?: string; study?: StudyLevel; mine?: boolean };

export type ListenItem = { en: string; ko: string; tag: string };

export type { Scene, SituationMap, SoonMap };

/** 공부하는 언어 (프로토타입 LANGS) */
export const LANGS = [
  { ko: '영어', g: 'EN', color: Colors.langEn, ink: Colors.white },
  { ko: '일본어', g: 'あ', color: Colors.langJa, ink: Colors.ink },
  { ko: '중국어', g: '中', color: Colors.langZh, ink: Colors.white },
  { ko: '스페인어', g: 'ES', color: Colors.langEs, ink: Colors.ink },
] as const;

/** 가짜 서버 값: 언어별 책장 (프로토타입 LIB). 영어는 Lv.0 (잠김) + 교재 4권, 일본어는 표지만, 중국어 · 스페인어는 아직 없어요 */
export const BOOKS: Book[][] = [
  [
    { id: 'en-0', n: 'PALLO', l: 'Lv.0', s: 'HELLO ENGLISH', c: '#4A82C8' },
    ...STUDY_LEVELS.map((L) => ({ id: `en-${L.lv}`, n: 'PALLO', l: `Lv.${L.lv}`, s: L.series, c: L.c, study: L, mine: L.lv === 1 })),
  ],
  [
    { id: 'ja-0', n: '日本語の花', l: 'レベル 0', c: '#1E73C2', jp: true, lab: 'Lv.0' },
    { id: 'ja-05', n: '日本語の花', l: 'レベル 0.5', c: '#4F86C9', jp: true, lab: 'Lv.0.5' },
    { id: 'ja-1', n: '日本語の旅', l: 'レベル 1', c: '#2A7F5A', jp: true, lab: 'Lv.1' },
    { id: 'ja-2', n: '日本語の夢', l: 'レベル 2', c: '#7C6CC0', jp: true, lab: 'Lv.2' },
  ],
  [],
  [],
];

/** shelf = 17 `/library/books` 로 받은 책장 */
export const findBook = (shelf: Book[][], id: string) => shelf.flat().find((b) => b.id === id);

/** 3D 지도 이름표에 쓰는 짧은 교재 이름 */
const SHORT: Record<string, string> = { 'HELLO ENGLISH': 'HELLO', 'EVERYDAY ENGLISH': 'EVERYDAY', 'REAL ENGLISH': 'REAL', 'TOPIC TALK': 'TOPIC TALK', 'FREE TALK & DEBATE': 'DEBATE' };
export const bookTag = (b: Book) => `${b.lab ?? b.l} ${b.jp ? '' : (SHORT[b.s ?? ''] ?? '')}`.trim();

/** 맵의 언어 (없으면 영어) */
export const mapLang = (m: SituationMap | SoonMap) => m.lang;
/** 장면 id = '맵 id-장면 번호' (프로토타입 lkOf). /scene/[id] · sceneKey(id) 에 그대로 써요 */
export const sceneId = sceneIdOf;
/** 콘텐츠가 있는 장면만 열려요 */
export const sceneOpen = (s: Scene) => !!s.contentId;

/**
 * 레벨 구성마다 단계 (프로토타입 STUDY_STEPS). 아이스브레이킹은 모든 레벨에서 뺐어요.
 * 단계 id 는 레슨 화면 주소에 그대로 써요 — Lv.1 · 2 의 상황 활동만 프로토타입 'act' 대신 레슨 A 경로 id 'sit'.
 */
export const STUDY_STEPS: Record<StudyKind, Record<StageKey, Step[]>> = {
  pattern: {
    pre: [
      { id: 'pat', t: '오늘의 패턴', d: '패턴 카드 · 예문 듣고 따라 말하기', min: 5, xp: 5 },
      { id: 'dlg', t: '대화문', d: '듣기 → 따라 말하기 → 마지막 대사 만들기', min: 6, xp: 10 },
      { id: 'bank', t: 'Bank 퀴즈', d: '상황 표현 10개 뜻 맞히기', min: 3, xp: 5 },
    ],
    main: [
      { id: 'sit', t: '상황 활동', d: '교재 활동을 AI와 역할극으로', min: 8, xp: 15 },
      { id: 'story', t: 'My Story', d: '내 경험 키워드 → 문단 완성', min: 7, xp: 15 },
      { id: 'talk', t: 'AI 프리토킹', d: '교재 질문으로 꼬리 질문 대화', min: 6, xp: 15 },
    ],
    post: [
      { id: 'quiz', t: '스피킹 퀴즈', d: '한국어 보고 영어로 · 단어별 채점', min: 5, xp: 10 },
      { id: 'chal', t: '30초 말하기 챌린지', d: '처음 보는 상황에서 패턴 써 보기', min: 3, xp: 10 },
    ],
  },
  topic: {
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
  debate: {
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

export const STAGES: StageKey[] = ['pre', 'main', 'post'];
export const STAGE_KO: Record<StageKey, string> = { pre: '예습', main: '본학습', post: '복습' };
export const STAGE_COLOR: Record<StageKey, string> = { pre: Colors.yellow, main: Colors.rosePink, post: Colors.sky };

/** 책장에서 레벨 찾기 (교재가 있는 권의 study) */
export const findLevel = (shelf: Book[][], lv: number) => shelf.flat().find((b) => b.study?.lv === lv)?.study;

/** 과 id (주소 /unit/[id]) = '레벨-과 번호' (프로토타입 lkOf) */
export const unitId = (lv: number, no: number) => `${lv}-${no}`;
export const parseUnitId = (id: string) => {
  const [lv, no] = id.split('-').map(Number);
  return { lv, no };
};

/** 번호 칸 글자 (프로토타입 noLabel): 토픽형은 #54, 나머지는 두 자리 */
export const noLabel = (L: StudyLevel, no: number) => (L.kind === 'topic' ? `#${no}` : String(no).padStart(2, '0'));
/** 과 이름 (프로토타입 lessonName) */
export const lessonName = (L: StudyLevel, ls: Lesson) => (L.kind === 'topic' ? `#${ls.no} ${ls.title}` : L.kind === 'debate' ? ls.title : `${ls.no}과 ${ls.title}`);
/** 단계 이름 (프로토타입 stepTitle): Bank → 'Word Bank 퀴즈', 상황 활동 → 교재 활동 이름 */
export const stepTitle = (s: Step, d?: LessonSummary) => (d?.kind === 'pattern' && s.id === 'bank' ? `${d.bankName} 퀴즈` : d?.kind === 'pattern' && s.id === 'sit' ? d.actTitle : s.t);

/** 리스닝 룸 문장 (프로토타입 lrItemsOf · lrItemsOfLevel) */
export const listenItemsOf = (key: string) => LISTEN_ITEMS[key] ?? [];
export const listenItemsOfLevel = (L: StudyLevel) => L.lessons.filter((ls) => ls.data).flatMap((ls) => listenItemsOf(unitId(L.lv, ls.no)));
export const listenItemsOfMap = (m: SituationMap) => m.scenes.flatMap(localSceneListenItems);
