import { studyStreak } from '../progress';

const at = (m: number, d: number, h = 12) => new Date(2026, m - 1, d, h).getTime();

describe('연속 학습 (라이브러리 공부 코너)', () => {
  const now = at(11, 26, 20);
  it('오늘까지 하루도 안 빠지면 며칠째인지', () => {
    expect(studyStreak({ a: at(11, 24), b: at(11, 25), c: at(11, 26, 9) }, now)).toBe(3);
  });
  it('오늘 아직 안 했으면 어제까지 이어진 날', () => {
    expect(studyStreak({ a: at(11, 24), b: at(11, 25) }, now)).toBe(2);
  });
  it('하루 빠지면 끊겨요', () => {
    expect(studyStreak({ a: at(11, 23), b: at(11, 25) }, now)).toBe(1);
    expect(studyStreak({}, now)).toBe(0);
  });
});
