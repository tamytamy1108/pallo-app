/**
 * 가까운 지점 — 거리 글자 · 내 위치에서 본 자리 · 보내는 위치 깎기 · 가까운 순 목록 판정 · 가짜 서버 정렬.
 */
import { formatDistance, mockBranchOptions, nearestBranches, relativePlace, roundLatLng, type BranchOption } from '../onboarding';

jest.mock('../config', () => ({
  apiConfig: { env: 'dev', baseUrl: '', useMock: true, mockDelayMs: 0, timeoutMs: 15000 },
}));

const row = (over: Partial<BranchOption> = {}): BranchOption => ({ code: 'A', name: 'A점', status: 'ACTIVE', linkStatus: null, region: '서울', distanceMeters: null, direction: null, ...over });

describe('formatDistance', () => {
  it('1km 안은 10m 단위 (최소 10m)', () => {
    expect(formatDistance(0)).toBe('10m');
    expect(formatDistance(4)).toBe('10m');
    expect(formatDistance(354)).toBe('350m');
    expect(formatDistance(999)).toBe('1000m');
  });
  it('1km ~ 10km 는 소수 한 자리, 그 밖은 정수 km', () => {
    expect(formatDistance(1000)).toBe('1.0km');
    expect(formatDistance(8793)).toBe('8.8km');
    expect(formatDistance(9999)).toBe('10.0km');
    expect(formatDistance(10000)).toBe('10km');
    expect(formatDistance(20021)).toBe('20km');
  });
});

describe('relativePlace', () => {
  it('방위 + 거리', () => {
    expect(relativePlace(row({ distanceMeters: 8793, direction: 'SE' }))).toBe('남동쪽 8.8km');
    expect(relativePlace(row({ distanceMeters: 640, direction: 'N' }))).toBe('북쪽 640m');
  });
  it('방위가 없으면(바로 옆) 거리만, 거리를 모르면 null', () => {
    expect(relativePlace(row({ distanceMeters: 30, direction: null }))).toBe('30m');
    expect(relativePlace(row())).toBeNull();
  });
});

it('roundLatLng — 소수 셋째 자리까지만 보내요', () => {
  expect(roundLatLng({ lat: 37.566535, lng: 126.977969 })).toEqual({ lat: 37.567, lng: 126.978 });
});

describe('nearestBranches', () => {
  it('거리를 하나라도 받았으면 받은 순서 그대로', () => {
    const rows = [row({ code: 'B', distanceMeters: 100 }), row({ code: 'A' })];
    expect(nearestBranches(rows)).toBe(rows);
  });
  it('거리가 하나도 없으면 null (지역 묶음)', () => {
    expect(nearestBranches([row(), row({ code: 'B' })])).toBeNull();
    expect(nearestBranches([])).toBeNull();
  });
});

describe('mockBranchOptions', () => {
  it('위치를 안 주면 거리 없이 이름 순서 그대로', () => {
    expect(mockBranchOptions().every((b) => b.distanceMeters == null && b.direction == null)).toBe(true);
  });
  it('위치를 주면 가까운 순, 좌표 없는 지점은 맨 뒤', () => {
    const rows = mockBranchOptions({ lat: 37.5665, lng: 126.978 });
    const known = rows.filter((b) => b.distanceMeters != null).map((b) => b.distanceMeters as number);
    expect(known.length).toBeGreaterThan(0);
    expect(known).toEqual([...known].sort((a, b) => a - b));
    const firstUnknown = rows.findIndex((b) => b.distanceMeters == null);
    if (firstUnknown >= 0) expect(rows.slice(firstUnknown).every((b) => b.distanceMeters == null)).toBe(true);
  });
});
