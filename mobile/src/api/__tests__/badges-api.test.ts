/**
 * 내 배지 (api/badges.ts · api/use-badges.ts toBadge) — 가짜 서버 모양과 서버 배지 → 배지 칸 바꾸기.
 */
import { MY_BADGES } from '@/data/my';

import { fetchMyBadges, fetchUnseenBadges, markBadgesSeen } from '../badges';
import { setMockOptions } from '../mock';
import { badgeProgress, toBadge } from '../use-badges';

jest.mock('../config', () => ({
  apiConfig: { env: 'dev', baseUrl: '', useMock: true, mockDelayMs: 0, timeoutMs: 15000 },
}));

afterEach(() => setMockOptions({ delayMs: 0, fail: [] }));

describe('내 배지 API (가짜 서버)', () => {
  it('배지 모두 보기는 예시 배지를 같은 순서로 · 받은 것은 earned', async () => {
    const rows = await fetchMyBadges();
    expect(rows.map((b) => b.code)).toEqual(MY_BADGES.map((b) => b.code));
    expect(rows.filter((b) => b.earned).map((b) => b.code)).toEqual(MY_BADGES.filter((b) => b.on).map((b) => b.code));
  });

  it('안 본 배지는 없고, 본 것으로 보내기는 그대로 끝나요', async () => {
    await expect(fetchUnseenBadges()).resolves.toEqual([]);
    await expect(markBadgesSeen(['first-hangout'])).resolves.toBeUndefined();
  });

  it('서버가 실패하면 오류로 받아요', async () => {
    setMockOptions({ fail: ['myBadges'] });
    await expect(fetchMyBadges()).rejects.toMatchObject({ code: 'mock_fail' });
  });
});

describe('서버 배지 → 배지 칸', () => {
  it('그림 주소 · 이름 · 설명 · 받았는지를 옮겨요', () => {
    expect(
      toBadge({ code: 'first-hangout', name: '첫 번개', description: '번개 첫 참여', imageUrl: 'https://cdn.example/badge-images/a.png', earned: false }),
    ).toEqual({ code: 'first-hangout', ic: 'heart', imageUrl: 'https://cdn.example/badge-images/a.png', name: '첫 번개', desc: '번개 첫 참여', on: false, earnedAt: null, cond: null });
  });

  it('조건 · 진행이 오면 cond 로 모으고, 아이콘은 조건 유형 · 기준 숫자로', () => {
    const b = toBadge({ code: 'hangout-5', name: '번개 단골', description: '번개 5번 참여', imageUrl: null, earned: false, earnedAt: null, conditionType: 'HANGOUT_JOIN_COUNT', threshold: 5, progress: 2 });
    // 번개 5번부터는 더 센 번개 아이콘 (번개 단골)
    expect(b.ic).toBe('boltPower');
    expect(b.cond).toEqual({ type: 'HANGOUT_JOIN_COUNT', threshold: 5, progress: 2 });
    const first = toBadge({ code: 'first-hangout', name: '첫 번개', description: '번개 첫 참여', imageUrl: null, earned: true, earnedAt: null, conditionType: 'HANGOUT_JOIN_COUNT', threshold: 1, progress: 1 });
    expect(first.ic).toBe('bolt');
  });
});

describe('배지 진행', () => {
  const base = { code: 'x', name: 'x', description: 'x', imageUrl: null, earnedAt: null };
  it('못 받은 배지: 지금 값 · 남은 만큼 · 비율', () => {
    expect(badgeProgress(toBadge({ ...base, earned: false, conditionType: 'HANGOUT_JOIN_COUNT', threshold: 5, progress: 2 }))).toEqual({ cur: 2, need: 5, left: 3, ratio: 0.4 });
  });
  it('받은 배지는 가득 · 기준보다 더 쌓여도 넘치지 않아요', () => {
    expect(badgeProgress(toBadge({ ...base, earned: true, conditionType: 'POST_LIKES_ON_ONE_POST', threshold: 50, progress: 80 }))).toEqual({ cur: 50, need: 50, left: 0, ratio: 1 });
  });
  it('셀 수 없거나(null) · 랭킹(낮을수록 좋음) · 조건 없음이면 막대 없음', () => {
    expect(badgeProgress(toBadge({ ...base, earned: false, conditionType: 'STUDY_STREAK_DAYS', threshold: 7, progress: null }))).toBeNull();
    expect(badgeProgress(toBadge({ ...base, earned: false, conditionType: 'WEEKLY_RANK_TOP', threshold: 3, progress: 8 }))).toBeNull();
    expect(badgeProgress(toBadge({ ...base, earned: false }))).toBeNull();
  });
});
