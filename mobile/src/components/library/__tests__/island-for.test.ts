import { islandFor } from '@/components/library/library-state';
import { BOOKS } from '@/data/library';

// 영어 책장: 0 = Lv.0(잠김) · 1 = Lv.1(내 레벨) · 2 = Lv.2 …
const en = BOOKS[0];
const step = (lv: number, at: number) => ({ lv, unit: 1, step: 'pat', at });

describe('팔로가 서는 섬', () => {
  it('처음 들어오면 내 레벨 섬', () => {
    expect(islandFor(en, { pick: null, pickAt: 0 }, null)).toBe(1);
  });
  it('공부한 적이 있으면 최근에 공부한 레벨 섬', () => {
    expect(islandFor(en, { pick: null, pickAt: 0 }, step(2, 100))).toBe(2);
  });
  it('공부한 뒤에 고른 섬이 있으면 고른 섬', () => {
    expect(islandFor(en, { pick: 3, pickAt: 200 }, step(2, 100))).toBe(3);
  });
  it('고른 뒤에 다른 레벨을 공부하면 공부한 레벨 섬', () => {
    expect(islandFor(en, { pick: 3, pickAt: 100 }, step(2, 200))).toBe(2);
  });
  it('두 레벨이 내 레벨이면 낮은 레벨 섬', () => {
    const both = en.map((b, i) => (i === 1 || i === 2 ? { ...b, mine: true } : { ...b, mine: false }));
    expect(islandFor(both, { pick: null, pickAt: 0 }, null)).toBe(1);
  });
});
