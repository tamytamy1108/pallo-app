/**
 * 스피킹 퀴즈 · My Story 키워드 · AI 프리토킹 채점 (프로토타입 gradeWords · kwCheck · ftGrade · ftFix 와 같은 규칙) 테스트. 실행: npm test
 */
import { checkKeyword, fixedText, fixSentence, gradeTalk, gradeWords, typoSuggest } from '../words';

const PATTERNS = ["i'?d like to|i would like to", 'do you have', "it (doesn'?t|does not|isn'?t|is not|'s not)"];

describe('스피킹 퀴즈 단어별 채점', () => {
  test('똑같이 말하면 만점', () => {
    expect(gradeWords('Do you have this in black?', 'Do you have this in black?').perfect).toBe(true);
  });
  test('축약형은 펼쳐서 비교 (I would ↔ I’d)', () => {
    expect(gradeWords('I would like to return this', "I'd like to return this.").perfect).toBe(true);
    expect(gradeWords('it does not work', "It doesn't work.").perfect).toBe(true);
  });
  test('빠진 단어는 그 칸만 틀려요', () => {
    const g = gradeWords('Do you have in black', 'Do you have this in black?');
    expect(g.ok).toEqual([true, true, true, false, true, true]);
    expect(g.perfect).toBe(false);
  });
});

describe('My Story 키워드 검사', () => {
  const ex = ['home last Friday', 'my office at lunch'];
  test('한 글자 다르면 오타 후보 두 개', () => {
    const r = checkKeyword('hom last Friday', ex, ex);
    expect(r.kind).toBe('typo');
    if (r.kind === 'typo') {
      expect(r.word).toBe('hom');
      expect(r.options.map((o) => o.word)).toContain('home');
      expect(r.options[0].value).toMatch(/last Friday$/);
    }
  });
  test('한글 · 영어가 아닌 말은 고칠 말 하나', () => {
    expect(checkKeyword('집', ex, ex)).toEqual({ kind: 'bad', msg: '영어로 적어요', fix: 'home last Friday' });
    expect(checkKeyword('hh', ex, ex).kind).toBe('bad');
  });
  test('아는 말이면 그대로', () => {
    expect(checkKeyword('my office at lunch', ex, ex).kind).toBe('ok');
    expect(typoSuggest('home', [])).toBeNull();
  });
});

describe('AI 프리토킹 반응', () => {
  test('약함: 2단어 이하 · haha 같은 말 · 한글', () => {
    expect(gradeTalk('haha', PATTERNS).k).toBe('weak');
    expect(gradeTalk('yes ok sure', PATTERNS).k).toBe('weak');
    expect(gradeTalk('좋아요', PATTERNS).why).toBe('영어로 답해 볼까요?');
  });
  test('보통: 짧은 한 문장', () => {
    expect(gradeTalk('I like an ocean view.', PATTERNS).k).toBe('ok');
  });
  test('좋음: 오늘의 패턴 · 이유 · 7단어 이상', () => {
    expect(gradeTalk("I'd like to have a big window.", PATTERNS)).toMatchObject({ k: 'good', why: '오늘의 패턴을 썼어요' });
    expect(gradeTalk('I like quiet rooms because I sleep early.', PATTERNS)).toMatchObject({ k: 'good', why: '이유까지 말했어요' });
  });
});

describe('프리토킹 고치기 (스펠링 · 문법 몇 가지)', () => {
  test('소문자 i → I, 철자 한 글자', () => {
    const parts = fixSentence('i want a sofft bed', []);
    expect(fixedText(parts)).toBe('I want a soft bed');
  });
  test("it don't → doesn't, he have → has, a + 모음 → an", () => {
    expect(fixedText(fixSentence("It don't work", []))).toBe("It doesn't work");
    expect(fixedText(fixSentence('he have a apple', []))).toBe('he has an apple');
  });
});
