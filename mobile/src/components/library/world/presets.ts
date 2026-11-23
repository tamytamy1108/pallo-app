/**
 * 맵 모양 프리셋 — 앱과 함께 나가는 3D 섬 모양 (scenes.js 의 BUILD).
 * 관리자 웹은 이 키 중 하나를 고르기만 해요. 새 모양 = 여기 한 줄 + scenes.js 에 BUILD 하나 + 앱 업데이트.
 * three.js 를 불러오지 않는 가벼운 파일이라 데이터 쪽(@/data/maps)에서도 읽어요.
 */

export type MapPreset = {
  /** scenes.js 의 BUILD 이름 */
  build: string;
  /** 정류장(장면) 자리 수 — 이보다 많은 장면은 지도에 못 올려요 */
  stops: number;
};

export const MAP_PRESETS = {
  'island-travel': { build: 'travel', stops: 8 },
  'island-biz': { build: 'biz', stops: 5 },
  'island-cafe': { build: 'cafe', stops: 3 },
  'island-campus': { build: 'campus', stops: 6 },
  /** 스터디 맵 (교재 책장 섬) — 상황 맵에는 쓰지 않아요 */
  'island-study': { build: 'study2', stops: 5 },
} as const satisfies Record<string, MapPreset>;

export type MapPresetKey = keyof typeof MAP_PRESETS;

export const isMapPreset = (key: string): key is MapPresetKey => Object.hasOwn(MAP_PRESETS, key);
