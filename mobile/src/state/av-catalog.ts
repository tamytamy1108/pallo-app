/**
 * 꾸미기 카탈로그 — 서버 에셋 카탈로그(GET /asset-catalog, app-hub '에셋 관리'에서 올린 것)의 캐릭터 아이템 · 배경 · 배경 효과.
 * 서버가 목록을 보내 주면 그 목록(판매 중만 · 화면 순서 · 가격 · 잠김)과 그림(레이어 주소)을 쓰고,
 * 아직 못 받았거나 가짜 서버(목업)라 목록이 없으면 앱 번들(data/av-items.ts · components/character/av-assets.ts)을 써요.
 * 코드는 서버와 번들이 같아요(예: h-cap) — 저장한 모습 · 가진 것은 코드로 기억해요.
 * 맞는 API: GET /asset-catalog (api/onboarding.ts fetchAssetCatalog). 동기화는 api/use-avatar-catalog.ts.
 */
import type { AssetCatalog, CatalogRarity, CatalogStageItem, CatalogWearable } from '@/api/onboarding';
import { AV_BG, AV_ITEMS, type AvBg, type AvCat, type AvItem, type AvRare } from '@/data/my';
import { createStore } from '@/lib/store';

/** 공통 캔버스(680 × 580) 안 몸 상자 위치 — 모자 아랫선(캔버스 px)을 캐릭터 좌표로 옮길 때 (서버 bodyBox 와 같아요) */
const BODY_BOX_Y = 214;

/** 서버 그림 한 장: 주소 · 몸 상자(520 × 332) 기준 비율 자리 · 겹침 순서 · 칠할 색 · 헤어 앞뒤 */
export type AvArtLayer = {
  url: string;
  rect: readonly [number, number, number, number];
  z: number;
  tint: 'hair' | 'body' | null;
  part: 'back' | 'front' | null;
};

type CatalogState = {
  /** null = 서버 목록 없음(번들 사용) */
  items: AvItem[] | null;
  bgs: AvBg[] | null;
  /** 아이템 코드 → 서버 그림 레이어 */
  art: Record<string, AvArtLayer[]>;
  /** 무대 그림(무대 전체에 늘여 그려요) — 배경은 'bg:' + id, 효과는 id */
  stage: Record<string, string>;
};

const EMPTY: CatalogState = { items: null, bgs: null, art: {}, stage: {} };
const store = createStore<CatalogState>(EMPTY);

const RARE: Record<CatalogRarity, AvRare> = { BASIC: '기본', COMMON: '일반', RARE: '레어', EPIC: '에픽', SEASON: '시즌' };
const SLOTS: readonly AvCat[] = ['hair', 'eye', 'hat', 'face', 'wear', 'mitt', 'shoe', 'hand', 'acc'];

/** 보상으로만 받는 것은 잠김 이유(보상 조건)를 달아요 */
const lockOf = (x: { acquisition: 'SHOP' | 'REWARD'; rewardLabel: string | null }) =>
  x.acquisition === 'REWARD' ? (x.rewardLabel ?? '보상으로 받아요') : undefined;

function toItem(w: CatalogWearable): AvItem | null {
  const cat = SLOTS.find((s) => s === w.slot);
  if (!cat) return null; // 모르는 칸(새 앱 기능)은 건너뛰어요
  return {
    id: w.code,
    cat,
    name: w.name,
    price: w.price,
    rare: RARE[w.rarity] ?? '일반',
    lock: lockOf(w),
    // 서버 그림은 레이어마다 z 로 겹쳐요 — layer 는 번들 그림 자리 이름이라 서버 아이템에선 쓰지 않아요
    layer: cat === 'hair' ? 'back' : 'front',
    hat: cat === 'hat' || undefined,
    hair: cat === 'hair' || undefined,
    cover: w.hat?.cover || undefined,
    clipY: w.hat?.cover && w.hat.clipY != null ? w.hat.clipY - BODY_BOX_Y : undefined,
  };
}

const toFx = (e: CatalogStageItem): AvItem => ({ id: e.code, cat: 'fx', name: e.name, price: e.price, rare: RARE[e.rarity] ?? '일반', lock: lockOf(e), layer: 'fx' });
const toBg = (b: CatalogStageItem): AvBg => ({ id: b.code, name: b.name, price: b.price, rare: RARE[b.rarity] ?? '일반', lock: lockOf(b), face: b.faceColor ?? '#FBF6EA' });

/**
 * 서버 카탈로그를 넣어요. 아이템 · 배경 목록이 없는 응답(가짜 서버 · 옛 서버)은 번들을 그대로 써요.
 * 배경 효과는 아이템 목록(fx 칸)에 같이 들어가요 — 번들과 같은 모양.
 */
export function applyAvatarCatalog(c: AssetCatalog) {
  if (!c.items && !c.backgrounds) return;
  const art: Record<string, AvArtLayer[]> = {};
  const stage: Record<string, string> = {};
  let items: AvItem[] | null = null;
  if (c.items) {
    items = [];
    for (const w of c.items) {
      const it = toItem(w);
      if (!it) continue;
      items.push(it);
      art[w.code] = w.layers.map((l) => ({ url: l.url, rect: [l.rect[0], l.rect[1], l.rect[2], l.rect[3]], z: l.z, tint: l.tint, part: l.part }));
    }
    for (const e of c.effects ?? []) {
      items.push(toFx(e));
      stage[e.code] = e.imageUrl;
    }
  }
  let bgs: AvBg[] | null = null;
  if (c.backgrounds) {
    bgs = c.backgrounds.map(toBg);
    for (const b of c.backgrounds) stage['bg:' + b.code] = b.imageUrl;
  }
  store.set({ items, bgs, art, stage });
}

/** 꾸미기 아이템 전체 (서버 목록 · 없으면 번들) — 화면 · 훅 안에서는 useAvItems */
export const avItems = (): readonly AvItem[] => store.get().items ?? AV_ITEMS;
export const avBgs = (): readonly AvBg[] => store.get().bgs ?? AV_BG;

const indexCache = new WeakMap<readonly AvItem[], Record<string, AvItem>>();
const indexOf = (list: readonly AvItem[]) => {
  let m = indexCache.get(list);
  if (!m) {
    m = Object.fromEntries(list.map((i) => [i.id, i]));
    indexCache.set(list, m);
  }
  return m;
};

/** 코드로 아이템 찾기 — 서버 목록에 없으면(숨김 · 판매 끝) 번들에서 찾아요. 저장한 모습이 그대로 그려지게 */
export const avItem = (id: string): AvItem | undefined => indexOf(avItems())[id] ?? indexOf(AV_ITEMS)[id];

export const useAvItems = (): readonly AvItem[] => store.useStore((s) => s.items) ?? AV_ITEMS;
export const useAvBgs = (): readonly AvBg[] => store.useStore((s) => s.bgs) ?? AV_BG;

/** 그리는 쪽(components/character/avatar.tsx)이 쓰는 서버 그림 — 바뀌면 다시 그려요 */
export const useAvArt = () => store.useStore((s) => s.art);
export const useStageArt = () => store.useStore((s) => s.stage);

/** 테스트 · 로그아웃: 번들로 되돌려요 */
export const resetAvatarCatalog = () => store.set(EMPTY);
