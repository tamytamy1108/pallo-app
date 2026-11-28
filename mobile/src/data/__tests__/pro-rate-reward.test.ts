import { proRateReward } from '../my';

describe('proRateReward', () => {
  it('90% 이상이면 +150 예정, 100%까지 남은 횟수', () => {
    expect(proRateReward(14, 13)).toEqual({ kind: 'on', rate: 93, earned: 150, next: { need: 1, amount: 300, minRate: 100 } });
  });
  it('100% 면 +300 예정, 다음 단계 없음', () => {
    expect(proRateReward(10, 10)).toEqual({ kind: 'on', rate: 100, earned: 300, next: null });
  });
  it('90% 아래면 아직 없음, 90%까지 남은 횟수', () => {
    expect(proRateReward(10, 7)).toEqual({ kind: 'on', rate: 70, earned: 0, next: { need: 2, amount: 150, minRate: 90 } });
  });
  it('89.6% 는 아직 90% 가 아니에요 (반올림하면 90 이어도)', () => {
    expect(proRateReward(48, 43)).toMatchObject({ rate: 90, earned: 0, next: { need: 1, amount: 150 } });
  });
  it('맡은 세션이 4개 아래면 보상 없음', () => {
    expect(proRateReward(3, 3)).toEqual({ kind: 'few', rate: 100 });
  });
});
