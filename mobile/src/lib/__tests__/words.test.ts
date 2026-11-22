/**
 * 채점(말한 글자 → 몇 장 이었나) 테스트.
 * 음성 인식이 실제로 받아 적는 여러 모양을 미리 넣어 봐요. 실행: npm test
 * 각 줄: [받아 적힌 말, 이어져야 할 장 수, 틀린 낱말(없으면 null)]
 */
import { matchSpeech, sameWord } from '../words';

type Case = [said: string, count: number, wrong: string | null];

const LATTE = "I'd like to order an iced latte.".split(' '); // 7장
const MENU = 'Do you have a menu in English?'.split(' '); // 7장
const LIGHT = "I'd like to have something light.".split(' '); // 6장
const WIFI = 'Do you have Wi-Fi?'.split(' '); // 4장
const QUIET = "I'd like to sit somewhere quiet.".split(' '); // 6장

function check(words: string[], cases: Case[]) {
  for (const [said, count, wrong] of cases) {
    const r = matchSpeech(said, words);
    expect({ said, count: r.count, wrong: r.wrongAt == null ? null : r.tokens[r.wrongAt] }).toEqual({ said, count, wrong });
  }
}

describe('정확히 말했을 때', () => {
  test('그대로 · 대소문자 · 문장부호 · 둥근 따옴표', () =>
    check(LATTE, [
      ["I'd like to order an iced latte", 7, null],
      ["i'd LIKE to order an iced latte!", 7, null],
      ['I’d like to order an iced latte.', 7, null],
    ]));
  test('빈 말 · 공백만', () =>
    check(LATTE, [
      ['', 0, null],
      ['   ', 0, null],
    ]));
});

describe('음성 인식이 다르게 받아 적는 경우 (맞게 봐줘요)', () => {
  test('줄임말을 풀어 적음: I would ↔ I’d', () => check(LATTE, [['I would like to order an iced latte', 7, null]]));
  test('짧은 낱말 모음 차이: on · in ↔ an', () =>
    check(LATTE, [
      ["I'd like to order on iced latte", 7, null],
      ["I'd like to order in iced latte", 7, null],
    ]));
  test('an 을 짧게 말했을 때 받아 적히는 여러 모양: Ann · Anne · N · own', () =>
    check(LATTE, [
      ["I'd like to order Ann iced latte", 7, null],
      ["I'd like to order Anne iced latte", 7, null],
      ["I'd like to order N iced latte", 7, null],
      ["I'd like to order own iced latte", 7, null],
    ]));
  test('이어진 4장 뒤에서 an 부터 이어 말하기 (on · in)', () => {
    const rest = LATTE.slice(4);
    for (const said of ['on iced latte', 'in iced latte', 'On', 'Ann ice latte']) expect(matchSpeech(said, rest).count).toBeGreaterThanOrEqual(1);
  });
  test('같은 소리: too ↔ to', () => check(LATTE, [["I'd like too order an iced latte", 7, null]]));
  test('띄어쓰기 자리가 다름: a nice ↔ an iced', () => check(LATTE, [["I'd like to order a nice latte", 7, null]]));
  test('끝소리가 빠짐: ice ↔ iced', () => check(LATTE, [["I'd like to order an ice latte", 7, null]]));
  test('한두 글자 차이: lottie ↔ latte · manu ↔ menu · englich ↔ English', () => {
    check(LATTE, [["I'd like to order an iced lottie", 7, null]]);
    check(MENU, [['do you have a manu in englich', 7, null]]);
  });
  test('한 낱말이 둘로: some thing ↔ something', () => check(LIGHT, [["I'd like to have some thing light", 6, null]]));
  test('하이픈 낱말: wifi · why fi ↔ Wi-Fi', () =>
    check(WIFI, [
      ['do you have wifi', 4, null],
      ['do you have Wi-Fi', 4, null],
      ['do you have why fi', 4, null],
    ]));
  test('한국어 말투로 들린 낱말: right ↔ light (r/l)', () => check(LIGHT, [["I'd like to have something right", 6, null]]));
  test('비슷한 소리: quite ↔ quiet', () => check(QUIET, [["I'd like to sit somewhere quite", 6, null]]));
});

describe('말하는 사람의 버릇 (맞게 봐줘요)', () => {
  test('군말: um · uh', () => check(LATTE, [["um I'd like to uh order an iced latte", 7, null]]));
  test('더듬기 · 되풀이: I I’d like like to', () => check(LATTE, [["I I'd like like to order an iced latte", 7, null]]));
  test('뒤에 말을 더 붙임', () => check(LATTE, [["I'd like to order an iced latte please thank you", 7, null]]));
  test('고쳐 말하기: have 를 말했다가 order 로', () => check(LATTE, [["I'd like to have I'd like to order an iced latte", 7, null]]));
});

describe('중간에서 멈춤 (틀림 아님 → 이어서 말해요)', () => {
  test('앞부분만', () =>
    check(LATTE, [
      ["I'd like to", 3, null],
      ["I'd like to order an", 5, null],
    ]));
  test('멈춘 뒤 군말 · 같은 말 되풀이만 있음', () =>
    check(LATTE, [
      ["I'd like to um", 3, null],
      ["I'd like to to", 3, null],
    ]));
});

describe('진짜로 틀렸을 때 (틀린 낱말을 찾아요)', () => {
  test('패턴을 틀림: I like ↔ I’d like (봐주지 않아요)', () => check(LATTE, [['I like to order', 0, 'I']]));
  test('다른 낱말: have ↔ order', () => check(LATTE, [["I'd like to have an iced latte", 3, 'have']]));
  test('자음이 다름: to ↔ do · half ↔ have', () => {
    check(MENU, [['to you have a menu in English', 0, 'to']]);
    check(MENU, [['do you half a menu', 2, 'half']]);
  });
  test('순서가 바뀜: latte 를 먼저', () => check(LATTE, [["I'd like to latte", 3, 'latte']]));
  test('군말 뒤의 틀린 말을 찾아요', () => check(LATTE, [["I'd like to um have", 3, 'have']]));
});

describe('틀린 낱말 뒤의 맞는 부분도 찾아요 (ahead)', () => {
  test('order 대신 have: 뒤의 an iced latte 는 맞게 말함', () => {
    const r = matchSpeech("I'd like to have an iced latte", LATTE);
    expect(r.count).toBe(3);
    expect(r.ahead).toEqual([4, 5, 6]);
    expect(r.wrong.map((k) => r.tokens[k])).toEqual(['have', 'an', 'iced', 'latte']);
  });
  test('틀린 곳이 두 군데: 맞는 조각만 골라요', () => {
    const r = matchSpeech("I'd like to have an cold latte", LATTE);
    expect(r.count).toBe(3);
    expect(r.ahead).toEqual([4, 6]);
  });
  test('처음부터 틀려도 뒤는 찾아요', () => {
    const r = matchSpeech('I like to order an iced latte', LATTE);
    expect(r.count).toBe(0);
    expect(r.ahead).toEqual([1, 2, 3, 4, 5, 6]);
  });
  test('다 맞으면 ahead 는 없어요', () => {
    expect(matchSpeech("I'd like to order an iced latte", LATTE).ahead).toEqual([]);
  });
  test('빠진 낱말만 따로 다시 말하면 (화면은 멈춘 뒤 새로 들은 말만 봐요)', () => {
    expect(matchSpeech('order', LATTE.slice(3)).count).toBe(1);
  });
});

describe('앞 순서로 봐서 어긋난 곳부터 끝까지 전부 오답', () => {
  test("I'd like to light have something: I'd like to 까지만 정답", () => {
    const r = matchSpeech("I'd like to light have something", LIGHT);
    expect(r.count).toBe(3);
    expect(r.wrong.map((k) => r.tokens[k])).toEqual(['light', 'have', 'something']);
  });
  test("I'd like to have light something: I'd like to have 까지만 정답", () => {
    const r = matchSpeech("I'd like to have light something", LIGHT);
    expect(r.count).toBe(4);
    expect(r.wrong.map((k) => r.tokens[k])).toEqual(['light', 'something']);
  });
  test('군말은 오답으로 치지 않아요', () => {
    const r = matchSpeech("I'd like to um have something", LIGHT);
    expect(r.count).toBe(5);
    expect(r.wrong).toEqual([]);
  });
});

describe('순서를 바꾸거나 다른 말을 끼우면 틀림', () => {
  test('Do you wifi have: do you 까지 맞고, wifi 가 틀린 말', () => {
    const r = matchSpeech('Do you wifi have', WIFI);
    expect(r.count).toBe(2);
    expect(r.tokens[r.wrongAt!]).toBe('wifi');
    expect(r.ahead).toEqual([]);
    expect(r.wrong.map((k) => r.tokens[k])).toEqual(['wifi', 'have']);
  });
  test('사이에 다른 말: I’d like to really order', () => {
    const r = matchSpeech("I'd like to really order an iced latte", LATTE);
    expect(r.count).toBe(3);
    expect(r.tokens[r.wrongAt!]).toBe('really');
  });
  test('고쳐 말하기는 괜찮아요: to have… to order', () => {
    expect(matchSpeech("I'd like to have to order an iced latte", LATTE).count).toBe(7);
  });
});

describe('같은 칸에서 여러 번 틀린 뒤 봐주기 (forgive)', () => {
  test('latte 가 nothing 으로 들려도, 2번 넘게 틀린 칸이면 그 자리 말을 인정', () => {
    expect(matchSpeech("I'd like to order an iced nothing", LATTE).count).toBe(6);
    expect(matchSpeech("I'd like to order an iced nothing", LATTE, { forgive: 6 }).count).toBe(7);
  });
  test('가운데 낱말은 뒤 낱말이 맞게 이어질 때만', () => {
    expect(matchSpeech("I'd like to order an nothing latte", LATTE, { forgive: 5 }).count).toBe(7);
    expect(matchSpeech("I'd like to order an nothing", LATTE, { forgive: 5 }).count).toBe(5);
  });
  test('군말은 봐주지 않아요', () => {
    expect(matchSpeech("I'd like to order an iced um", LATTE, { forgive: 6 }).count).toBe(6);
  });
});

describe('sameWord 경계', () => {
  test('너무 다른 짧은 말은 인정하지 않아요', () => {
    expect(sameWord('to', 'do')).toBe(false);
    expect(sameWord('i', 'id')).toBe(false);
    expect(sameWord('a', 'i')).toBe(false);
  });
  test('숫자로 적힌 말', () => {
    expect(matchSpeech('I have 2 cats', ['I', 'have', 'two', 'cats']).count).toBe(4);
  });
});
