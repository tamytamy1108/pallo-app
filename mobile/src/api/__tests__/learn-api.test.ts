import { toSituationMaps } from '@/data/maps';

import { fetchBookShelf, fetchPatternLesson, fetchSceneContent, fetchSituationMaps, fetchUnit34 } from '../learn';
import { setMockOptions } from '../mock';

jest.mock('../config', () => ({
  apiConfig: { env: 'dev', baseUrl: '', useMock: true, mockDelayMs: 0, timeoutMs: 15000 },
}));

afterEach(() => setMockOptions({ delayMs: 0, fail: [] }));

describe('학습 가짜 API (16 · 17 · 18)', () => {
  it('16 맵 줄은 화면 모양으로 바꾸면 열린 맵 · 장면 contentId 가 나와요', async () => {
    const rows = await fetchSituationMaps();
    const { maps } = toSituationMaps(rows, new Date(2026, 10, 23));
    expect(maps.map((m) => m.id)).toEqual(['travel', 'biz', 'cafe', 'campus']);
    expect(maps[0].scenes[0].contentId).toBe('travel-1');
  });

  it('16 돌려준 줄을 고쳐도 앱에 든 원본은 그대로예요', async () => {
    const first = await fetchSituationMaps();
    first[0].scenes[0].title = '바뀜';
    const again = await fetchSituationMaps();
    expect(again[0].scenes[0].title).not.toBe('바뀜');
  });

  it('17 책장: 언어 4칸 · 영어 Lv.1 은 내 교재 · 과 목록이 같이 와요', async () => {
    const shelf = await fetchBookShelf();
    expect(shelf).toHaveLength(4);
    const lv1 = shelf[0].find((b) => b.id === 'en-1');
    expect(lv1).toMatchObject({ mine: true });
    expect(lv1?.study?.lessons.length).toBeGreaterThan(0);
  });

  it('18 과 콘텐츠: 교재 · Lv.3/4 회차 · 상황 장면', async () => {
    await expect(fetchPatternLesson(1, 1)).resolves.toMatchObject({ lv: 1, unit: 1 });
    await expect(fetchUnit34(3, 101)).resolves.toMatchObject({ lv: 3, no: 101 });
    await expect(fetchSceneContent('travel-1')).resolves.toHaveProperty('flow');
  });

  it('18 없는 과 · 장면은 NOT_FOUND', async () => {
    await expect(fetchPatternLesson(1, 99)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(fetchUnit34(4, 999)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(fetchSceneContent('nope-1')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('?mockFail=maps,books,lesson 으로 오류 화면을 볼 수 있어요', async () => {
    setMockOptions({ fail: ['maps', 'books', 'lesson'] });
    await expect(fetchSituationMaps()).rejects.toMatchObject({ code: 'MOCK_FAIL' });
    await expect(fetchBookShelf()).rejects.toMatchObject({ code: 'MOCK_FAIL' });
    await expect(fetchSceneContent('travel-1')).rejects.toMatchObject({ code: 'MOCK_FAIL' });
  });
});
