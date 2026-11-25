import { agoLabel, dateLabel, whenLabel } from '../when';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
// 2026-11-25 15:00 KST
const NOW = Date.UTC(2026, 10, 25, 6, 0);

describe('agoLabel', () => {
  it('7일 안은 상대 시간', () => {
    expect(agoLabel(NOW - 10 * 1000, NOW)).toBe('방금');
    expect(agoLabel(NOW - 5 * MIN, NOW)).toBe('5분 전');
    expect(agoLabel(NOW - 3 * HOUR, NOW)).toBe('3시간 전');
    expect(agoLabel(NOW - DAY, NOW)).toBe('어제');
    expect(agoLabel(NOW - 6 * DAY, NOW)).toBe('6일 전');
    expect(agoLabel(NOW - 7 * DAY, NOW)).toBe('7일 전');
  });
  it('7일이 넘으면 날짜 · 올해가 아니면 연도까지', () => {
    expect(agoLabel(NOW - 8 * DAY, NOW)).toBe('11.17');
    expect(dateLabel(Date.UTC(2025, 0, 5, 3), NOW)).toBe('2025.01.05');
  });
});

describe('whenLabel', () => {
  it('앱에서 올린 글은 at 으로 다시 계산해요', () => {
    expect(whenLabel('방금', NOW - 2 * HOUR, NOW)).toBe('2시간 전');
    expect(whenLabel('방금', NOW - 20 * DAY, NOW)).toBe('11.05');
  });
  it('예시 글도 같은 규칙', () => {
    expect(whenLabel('6일 전', undefined, NOW)).toBe('6일 전');
    expect(whenLabel('2주 전', undefined, NOW)).toBe('11.11');
    expect(whenLabel('11.18', undefined, NOW)).toBe('11.18');
  });
});
