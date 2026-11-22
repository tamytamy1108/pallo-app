/**
 * '소리가 비슷하면 인정' 규칙이 특정 낱말이 아니라 모든 낱말에 통하는지 확인해요.
 * 레슨의 모든 낱말 + 자주 쓰는 낱말에, 음성 인식 · 한국어 말투로 생기는 변형을 자동으로 만들어 넣어요.
 */
import { patternTasks } from '@/data/lessons';

import { matchSpeech, sameWord, wordKey } from '../words';

const EVERYDAY = [
  'coffee', 'very', 'think', 'thank', 'right', 'water', 'friend', 'seat', 'window', 'black', 'english', 'menu', 'order', 'latte', 'something',
  'question', 'return', 'try', 'sit', 'have', 'light', 'charger', 'glad', 'busy', 'weekend', 'movie', 'favorite', 'usually', 'travel', 'flight',
  'vacation', 'reservation', 'problem', 'restaurant', 'expensive', 'cheap', 'really', 'tomorrow', 'yesterday', 'family', 'people', 'phone',
  'quick', 'check', 'room', 'bring', 'play', 'free', 'five', 'zoo', 'you', 'yes', 'one', 'can', 'get', 'go', 'like', 'want', 'need', 'help',
  'an', 'on', 'in', 'at', 'it', 'is', 'to', 'do', 'for', 'of', 'the', 'this', 'that', 'with', 'my', 'me', 'we', 'he', 'she', 'they',
];

const lessonWords = [...new Set(patternTasks().flatMap((t) => t.en.split(/\s+/).map(wordKey)))].filter(Boolean);
const ALL = [...new Set([...lessonWords, ...EVERYDAY])];

const swapOnce = (w: string, from: RegExp, to: string) => w.replace(from, to);

/** 음성 인식 · 말투로 실제로 생기는 변형들 (모두 인정돼야 해요) */
function variants(w: string): string[] {
  // a · I · oh 처럼 모음뿐인 말은 철자로만 비교해요 (변형 없음)
  if (!/[^aeiouy]/.test(w)) return [];
  const out = new Set<string>();
  // 한국어 말투: r↔l · v↔b · f↔p · th→s · z→s
  out.add(swapOnce(w, /r/, 'l'));
  out.add(swapOnce(w, /l/, 'r'));
  out.add(swapOnce(w, /v/, 'b'));
  out.add(swapOnce(w, /f/, 'p'));
  out.add(swapOnce(w, /th/, 's'));
  out.add(swapOnce(w, /z/, 's'));
  // 받아 적기 철자 차이: ph↔f · ck→k · c→k(a/o/u 앞) · 끝 e 붙이기/빼기 · 끝 자음 겹치기
  out.add(swapOnce(w, /f/, 'ph'));
  out.add(swapOnce(w, /ck/, 'k'));
  out.add(swapOnce(w, /c(?=[aou])/, 'k'));
  out.add(/e$/.test(w) ? w.slice(0, -1) : `${w}e`);
  out.add(w.replace(/([^aeiou])$/, '$1$1'));
  // 모음이 다르게 들림 (첫 모음 하나)
  const v = w.search(/[aeiou]/);
  if (v >= 0) out.add(w.slice(0, v) + (w[v] === 'a' ? 'o' : 'a') + w.slice(v + 1));
  out.delete(w);
  return [...out];
}

describe('모든 낱말: 비슷한 소리 변형을 인정해요', () => {
  test.each(ALL)('%s', (w) => {
    const bad = variants(w).filter((v) => !sameWord(v, w));
    expect({ word: w, notAccepted: bad }).toEqual({ word: w, notAccepted: [] });
  });
});

describe('모든 낱말: 문장 전체를 변형해서 말해도 끝까지 이어져요', () => {
  test.each(patternTasks().map((t) => t.en))('%s', (en) => {
    const words = en.split(/\s+/);
    const said = words.map((w) => variants(wordKey(w))[0] ?? w).join(' ');
    expect({ said, count: matchSpeech(said, words).count }).toEqual({ said, count: words.length });
  });
});

describe('진짜 다른 말은 인정하지 않아요', () => {
  const PAIRS: [said: string, word: string][] = [
    ['to', 'do'],
    ['do', 'to'],
    ['i', 'id'],
    ['a', 'i'],
    ['me', 'my'] /* 모음뿐 차이지만 뜻이 달라요 → 아래 주석 참고 */,
    ['half', 'have'],
    ['like', 'i'],
    ['go', 'no'],
    ['can', 'man'],
    ['get', 'got'] /* 모음 차이 */,
    ['sit', 'set'] /* 모음 차이 */,
    ['you', 'we'],
    ['this', 'kiss'],
    ['order', 'other'],
  ];
  // 모음만 다른 짧은 말(me · my, get · got, sit · set)은 음성 인식 혼동이 커서 '인정'하기로 했어요 → 여기서 빼요
  // 3소리 이상 낱말은 한 소리 차이를 인정해요 (iced ↔ ice 때문). 그래서 window ↔ widow 도 인정돼요
  const VOWEL_ONLY = new Set(['me|my', 'get|got', 'sit|set']);
  test.each(PAIRS.filter(([s, w]) => !VOWEL_ONLY.has(`${s}|${w}`)))('%s ↔ %s', (s, w) => {
    expect(sameWord(s, w)).toBe(false);
  });
});
