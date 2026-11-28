/**
 * 꾸미기 카탈로그 (state/av-catalog — 서버 GET /asset-catalog 의 아이템 · 배경 · 효과 ↔ 앱 번들) 테스트. 실행: npm test
 */
import type { AssetCatalog, CatalogStageItem, CatalogWearable } from '@/api/onboarding';
import { AV_BG, AV_ITEMS } from '@/data/my';

import { applyAvatarCatalog, avBgs, avItem, avItems, resetAvatarCatalog } from '../av-catalog';

const base: AssetCatalog = {
  formatVersion: 1,
  canvas: { width: 680, height: 580 },
  bodyBox: { x: 35, y: 214, width: 520, height: 332 },
  pallolos: [],
};
const FULL = [-35 / 520, -214 / 332, 680 / 520, 580 / 332];

const wearable = (over: Partial<CatalogWearable>): CatalogWearable => ({
  code: 'w-new',
  slot: 'wear',
  name: '새 옷',
  rarity: 'RARE',
  acquisition: 'SHOP',
  price: 300,
  rewardLabel: null,
  version: 1,
  layers: [{ url: 'https://cdn/w-new.png', rect: FULL, z: 300, tint: null, part: null }],
  hat: null,
  flipUrl: null,
  ...over,
});
const stage = (over: Partial<CatalogStageItem>): CatalogStageItem => ({
  code: 'cream',
  name: '크림 룸',
  rarity: 'BASIC',
  acquisition: 'SHOP',
  price: 0,
  rewardLabel: null,
  version: 1,
  z: 0,
  faceColor: '#FBF6EA',
  imageUrl: 'https://cdn/bg-cream.png',
  ...over,
});

afterEach(resetAvatarCatalog);

describe('서버 목록이 없으면 앱 번들', () => {
  it('처음(아직 못 받음)에는 번들 아이템 · 배경', () => {
    expect(avItems()).toBe(AV_ITEMS);
    expect(avBgs()).toBe(AV_BG);
  });
  it('가짜 서버처럼 꾸미기 목록이 없는 응답은 번들을 그대로 써요', () => {
    applyAvatarCatalog(base);
    expect(avItems()).toBe(AV_ITEMS);
    expect(avBgs()).toBe(AV_BG);
  });
});

describe('서버 목록을 받으면', () => {
  it('판매 중 아이템만 · 서버 순서 그대로, 등급은 한글 · 보상은 잠김 이유로', () => {
    applyAvatarCatalog({
      ...base,
      items: [
        wearable({ code: 'hr-bowl', slot: 'hair', rarity: 'BASIC', price: 0 }),
        wearable({ code: 'h-santa', slot: 'hat', rarity: 'SEASON', acquisition: 'REWARD', price: 0, rewardLabel: '12월 출석 7일 보상', hat: { cover: false, clipY: null } }),
        wearable({ code: 'w-new' }),
      ],
      backgrounds: [],
      effects: [],
    });
    expect(avItems().map((i) => i.id)).toEqual(['hr-bowl', 'h-santa', 'w-new']);
    expect(avItem('hr-bowl')).toMatchObject({ cat: 'hair', hair: true, rare: '기본', price: 0, lock: undefined });
    expect(avItem('h-santa')).toMatchObject({ cat: 'hat', hat: true, rare: '시즌', lock: '12월 출석 7일 보상', cover: undefined });
    expect(avItem('w-new')).toMatchObject({ cat: 'wear', name: '새 옷', rare: '레어', price: 300 });
  });

  it('머리를 덮는 모자의 아랫선은 캔버스 px → 캐릭터 좌표(몸 상자 위 214 를 빼요)', () => {
    applyAvatarCatalog({ ...base, items: [wearable({ code: 'h-cap', slot: 'hat', hat: { cover: true, clipY: 244 } })] });
    expect(avItem('h-cap')).toMatchObject({ cover: true, clipY: 30 });
  });

  it('모르는 칸(새 앱 기능)은 건너뛰어요', () => {
    applyAvatarCatalog({ ...base, items: [wearable({ code: 'x-wing', slot: 'wing' }), wearable({ code: 'w-new' })] });
    expect(avItems().map((i) => i.id)).toEqual(['w-new']);
  });

  it('배경 효과는 fx 칸 아이템으로, 배경은 프로필 바탕색과 함께', () => {
    applyAvatarCatalog({
      ...base,
      items: [],
      effects: [stage({ code: 'fx-snow', name: '눈송이', z: 50, faceColor: null, imageUrl: 'https://cdn/fx-snow.png' })],
      backgrounds: [stage({ code: 'night', name: '서울 야경', rarity: 'EPIC', price: 400, faceColor: '#2A2148' })],
    });
    expect(avItem('fx-snow')).toMatchObject({ cat: 'fx', layer: 'fx', name: '눈송이' });
    expect(avBgs()).toEqual([{ id: 'night', name: '서울 야경', price: 400, rare: '에픽', lock: undefined, face: '#2A2148' }]);
  });

  it('서버 목록에서 빠진(숨긴) 코드도 번들에 있으면 찾아요 — 이미 입은 모습이 그대로 그려지게', () => {
    applyAvatarCatalog({ ...base, items: [wearable({ code: 'w-new' })] });
    expect(avItems().some((i) => i.id === 'h-beanie')).toBe(false);
    expect(avItem('h-beanie')?.name).toBe('털 비니');
  });
});
