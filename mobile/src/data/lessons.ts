/**
 * 레슨 문제 데이터 (가짜). 값은 프로토타입 Lv.1 1과 patterns 와 같아요.
 * 맞는 API: 18 `/lessons/:id` (과 콘텐츠 한 덩어리) · 20 `/me/progress/:lesson/:step` (진행 저장)
 */

export type Pattern = { id: string; pattern: string; short: string; meaning: string; focus: string; examples: [string, string][] };

/** 따라 말하기 문제: 한국어 뜻을 보고 섞인 단어 카드를 말로(또는 눌러서) 순서대로 이어요 */
export type ShadowTask = {
  type: 'shadow';
  en: string;
  ko: string;
  /** 위 머리: 오늘의 패턴 n · 예문 k/3 */
  head: { kicker: string; pattern: string; short: string; meaning: string };
  /** 패턴 부분 (보라 밑줄) */
  focus: RegExp;
};

const LESSON1_PATTERNS: Pattern[] = [
  {
    id: 'p1',
    pattern: "I'd like to + 동사",
    short: "I'd like to",
    meaning: '~하고 싶어요',
    focus: "i'?d like to|i would like to",
    examples: [
      ["I'd like to order an iced latte.", '아이스 라테 한 잔을 주문하고 싶어요.'],
      ["I'd like to sit somewhere quiet.", '좀 조용한 곳에 앉고 싶어요.'],
      ["I'd like to have something light.", '가벼운 걸 먹고 싶어요.'],
    ],
  },
  {
    id: 'p2',
    pattern: 'Do you have + 명사?',
    short: 'Do you have',
    meaning: '~이/가 있나요?',
    focus: 'do you have',
    examples: [
      ['Do you have this in black?', '이거 검은색 있나요?'],
      ['Do you have Wi-Fi?', '와이파이 있나요?'],
      ['Do you have a menu in English?', '영어로 된 메뉴판이 있나요?'],
    ],
  },
];

/** 오늘의 패턴: 패턴마다 예문 3개 따라 말하기 (프로토타입 runPattern) */
export function patternTasks(): ShadowTask[] {
  return LESSON1_PATTERNS.flatMap((p, pi) =>
    p.examples.map(([en, ko], k) => ({
      type: 'shadow' as const,
      en,
      ko,
      head: { kicker: `오늘의 패턴 ${pi + 1} · 예문 ${k + 1}/3`, pattern: p.pattern, short: p.short, meaning: p.meaning },
      focus: new RegExp(p.focus.replace(/'/g, "['’]"), 'i'),
    })),
  );
}

/** 잘했을 때 반응 (프로토타입 REACT_BY good 에서 몇 개) */
export const GOOD_REACTIONS: [string, string][] = [
  ['Way to go!', '잘했어요, 바로 그거예요!'],
  ['Nailed it!', '완벽하게 해냈어요!'],
  ['Great job!', '정말 잘했어요!'],
  ['Spot on!', '딱 맞았어요!'],
];

/** 틀렸을 때 보라 팔로 한마디 (프로토타입 REACT_BY bad) */
export const BAD_REACTIONS: [string, string][] = [
  ['So close!', '아깝다, 거의 맞았어요!'],
  ["No worries, you'll get it next time!", '괜찮아요, 다음엔 맞힐 거예요!'],
  ['Practice makes perfect.', '연습이 완벽을 만들어요.'],
  ["Let's give it another shot!", '한 번 더 해 봐요!'],
];
