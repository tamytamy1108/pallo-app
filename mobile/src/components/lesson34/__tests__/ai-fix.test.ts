import { aiFix, notEnglish } from '../text';

// AI 대화 답 교정 규칙 (실제 앱은 AI 가 해요) — 자주 틀리는 것들이 고쳐지는지
const fix = (v: string) => aiFix(v, []).text;

describe('aiFix', () => {
  test.each([
    ['its so annoying', "It's so annoying."],
    ['he dont like it alot', "He doesn't like it a lot."],
    ['every weekends i sleep', 'Every weekend I sleep.'],
    ['there is many people', 'There are many people.'],
    ['people is crazy about it', 'People are crazy about it.'],
    ['yesterday I go to the park', 'Yesterday I went to the park.'],
    ['I didnt went there', "I didn't go there."],
    ['it taste good cuz i like sweet', 'It tastes good because I like sweet.'],
    ['I enjoy to swim', 'I enjoy swimming.'],
    ['it makes me to smile', 'It makes me smile.'],
    ['I go to home late', 'I go home late.'],
  ])('%s → %s', (a, b) => expect(fix(a)).toBe(b));
  test('바른 문장은 그대로 (바뀜 없음)', () => expect(aiFix('I love running every morning.', []).changed).toBe(false));
});

describe('notEnglish', () => {
  test('한국어', () => expect(notEnglish('저는 잘 모르겠어요')).toBe('ko'));
  test('알아볼 수 없는 말', () => expect(notEnglish('ㅋㅋㅋ')).toBe('ko'));
  test('자음만', () => expect(notEnglish('hhh ttt')).toBe('junk'));
  test('영어는 통과', () => expect(notEnglish('I like it')).toBeNull());
});
