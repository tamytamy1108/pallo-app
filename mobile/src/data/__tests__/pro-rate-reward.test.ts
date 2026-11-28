import { proRateRewardLine } from '../my';

describe('proRateRewardLine', () => {
  it('90% 이상이면 지금 받는 금액과 100%까지 남은 횟수', () => {
    expect(proRateRewardLine(14, 13)).toBe('100%까지 1회 · 지금 받으면 +150');
  });
  it('100% 면 +300', () => {
    expect(proRateRewardLine(10, 10)).toBe('100% 달성 · 다음 달 1일에 +300');
  });
  it('90% 아래면 90%까지 남은 횟수', () => {
    expect(proRateRewardLine(10, 7)).toBe('90%까지 2회 · 채우면 +150');
  });
  it('맡은 세션이 4개 아래면 보상 없음 안내', () => {
    expect(proRateRewardLine(3, 3)).toBe('맡은 세션이 4개 이상인 달만 출석률 스파크를 받아요');
  });
});
