import { getMaps, toSituationMaps, type MapRow } from '../index';

const row = (o: Partial<MapRow>): MapRow => ({ id: 'x', preset: 'island-travel', lang: 'en', order: 1, title: 'X', series: 'X', color: '#000000', about: '', scenes: [], ...o });
const NOW = new Date(2026, 10, 23);

describe('toSituationMaps', () => {
  let warn: jest.SpyInstance;
  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => warn.mockRestore());

  test('앱에 든 JSON: 4개 맵 + 커밍순 칩, 샘플 공항 맵은 숨김', () => {
    const { maps, soon } = toSituationMaps(getMaps(), NOW);
    expect(maps.map((m) => m.id)).toEqual(['travel', 'biz', 'cafe', 'campus']);
    expect(soon).toEqual([{ id: 'next', title: '새 맵', when: '커밍순', lang: 0 }]);
    expect(maps[0].scenes[0].content).not.toBeNull();
    expect(maps[0].scenes[3].content).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });

  test('새 맵 = 데이터 한 줄 (있는 프리셋 다시 쓰기)', () => {
    const rows = getMaps().map((r) => (r.id === 'airport' ? { ...r, hidden: false, opensAt: null } : r));
    const airport = toSituationMaps(rows, NOW).maps.find((m) => m.id === 'airport');
    expect(airport).toMatchObject({ preset: 'island-travel', title: '공항', c: '#8FA6DC', isNew: true });
    expect(airport?.scenes).toHaveLength(3);
  });

  test('공개일 전이면 날짜 칩, 지나면 열린 맵', () => {
    const r = row({ id: 'a', opensAt: '2026-12-15' });
    expect(toSituationMaps([r], NOW).soon).toEqual([{ id: 'a', title: 'X', when: '12/15 열림', lang: 0 }]);
    expect(toSituationMaps([r], new Date(2026, 11, 15)).maps).toHaveLength(1);
  });

  test('모르는 프리셋은 여행 섬으로 그리지 않고 업데이트 칩 + 경고', () => {
    const { maps, soon } = toSituationMaps([row({ id: 'forest', preset: 'island-forest' })], NOW);
    expect(maps).toHaveLength(0);
    expect(soon[0].when).toBe('업데이트하면 열려요');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('island-forest'));
  });

  test('정류장보다 많은 장면은 잘라요 · 순서 · 언어 · 같은 id', () => {
    const scenes = Array.from({ length: 5 }, (_, i) => ({ no: i + 1, title: `s${i}`, sub: '', icon: 'chat', contentId: null }));
    const { maps } = toSituationMaps([row({ id: 'b', order: 2, lang: 'ja', preset: 'island-cafe', scenes }), row({ id: 'a', order: 1 }), row({ id: 'a', order: 3 })], NOW);
    expect(maps.map((m) => m.id)).toEqual(['a', 'b']);
    expect(maps[1]).toMatchObject({ lang: 1 });
    expect(maps[1].scenes).toHaveLength(3);
    expect(warn).toHaveBeenCalledTimes(2);
  });
});
