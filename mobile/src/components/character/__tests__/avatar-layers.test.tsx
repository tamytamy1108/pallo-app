/**
 * 캐릭터 그리기 겹침 (components/character/avatar — 번들 그림 · 서버 카탈로그 레이어를 z 한 줄로) 테스트. 실행: npm test
 */
import { act, render } from '@testing-library/react-native';

import type { AssetCatalog, CatalogWearable } from '@/api/onboarding';
import { AvatarChar } from '@/components/character/avatar';
import { avFresh, type Avatar } from '@/data/my';
import { applyAvatarCatalog, resetAvatarCatalog } from '@/state/av-catalog';

// 그림은 그리는 대신 받은 값을 순서대로 적어 둬요 (그리는 순서 = 겹침 순서)
type ImgProps = { source: { uri?: string } | number; tintColor?: string };
const mockDrawn: ImgProps[] = [];
jest.mock('expo-image', () => ({
  Image: (p: ImgProps) => {
    mockDrawn.push(p);
    return null;
  },
}));
// 깜빡임(움직임)은 테스트에서 끄고 그려요 — 모듈만 대신해요
jest.mock('react-native-reanimated', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { __esModule: true, default: { View }, css: { keyframes: () => ({}) }, useReducedMotion: () => true };
});
// 글꼴 파일은 테스트에서 읽지 않아요 (말풍선 글자는 겹침과 무관)
jest.mock('@/constants/fonts', () => ({ Font: new Proxy({}, { get: () => 'System' }) }));
jest.mock('@/components/ui/text', () => ({ PText: jest.requireActual<typeof import('react-native')>('react-native').Text }));

const FULL = [-35 / 520, -214 / 332, 680 / 520, 580 / 332];
const base: AssetCatalog = { formatVersion: 1, canvas: { width: 680, height: 580 }, bodyBox: { x: 35, y: 214, width: 520, height: 332 }, pallolos: [] };
const item = (code: string, slot: string, layers: CatalogWearable['layers'], hat: CatalogWearable['hat'] = null): CatalogWearable => ({
  code,
  slot,
  name: code,
  rarity: 'BASIC',
  acquisition: 'SHOP',
  price: 0,
  rewardLabel: null,
  version: 1,
  layers,
  hat,
  flipUrl: null,
});
const layer = (url: string, z: number, tint: 'hair' | 'body' | null = null, part: 'back' | 'front' | null = null) => ({ url, rect: FULL, z, tint, part });

const bare = (eq: Partial<Avatar['eq']>): Avatar => {
  const a = avFresh();
  (Object.keys(a.eq) as (keyof Avatar['eq'])[]).forEach((k) => (a.eq[k] = null));
  return { ...a, eq: { ...a.eq, ...eq } };
};
/** 그려진 그림 순서 — 서버 그림은 주소, 번들 그림은 'bundle' */
const draw = async (av: Avatar) => {
  mockDrawn.length = 0;
  await render(<AvatarChar av={av} width={260} blink={false} />);
  return mockDrawn.map((p) => (typeof p.source === 'object' && p.source.uri ? p.source.uri : 'bundle'));
};
const tintOf = (uri: string) => mockDrawn.find((p) => typeof p.source === 'object' && p.source.uri === uri)?.tintColor;

afterEach(async () => act(async () => resetAvatarCatalog()));

describe('AvatarChar 겹침', () => {
  it('서버 그림이 없으면 번들 그림으로 그려요 (몸 + 털 비니)', async () => {
    const order = await draw(bare({ hat: 'h-beanie' }));
    expect(order.every((x) => x === 'bundle')).toBe(true);
    expect(order.length).toBeGreaterThanOrEqual(2);
  });

  it('서버 레이어는 z 순서로 몸(200) 앞뒤에 서요 — 뒤(100) · 몸 · 옷(300) · 모자(700)', async () => {
    await act(async () =>
      applyAvatarCatalog({
        ...base,
        items: [
          item('h-cap', 'hat', [layer('cap', 700)], { cover: true, clipY: 244 }),
          item('w-tee', 'wear', [layer('tee', 300)]),
          item('d-flag', 'hand', [layer('flag', 100)]),
        ],
      }),
    );
    const order = await draw(bare({ hat: 'h-cap', wear: 'w-tee', hand: 'd-flag' }));
    const body = order.indexOf('bundle');
    expect(order.indexOf('flag')).toBeLessThan(body);
    expect(order.indexOf('tee')).toBeGreaterThan(body);
    expect(order.indexOf('cap')).toBeGreaterThan(order.indexOf('tee'));
  });

  it('칠할 색: hair 레이어는 머리 색, body 레이어는 몸 색으로 칠해요', async () => {
    await act(async () =>
      applyAvatarCatalog({
        ...base,
        items: [item('hr-bowl', 'hair', [layer('back', 100, null, 'back'), layer('back-fill', 100, 'hair', 'back')]), item('e-sleepy', 'eye', [layer('lid', 400, 'body')])],
      }),
    );
    const av = { ...bare({ hair: 'hr-bowl', eye: 'e-sleepy' }), hc: '#123456', color: '#8B5CF6' };
    await draw(av);
    expect(tintOf('back')).toBeUndefined();
    expect(tintOf('back-fill')).toBe('#123456');
    expect(tintOf('lid')).toBe('#8B5CF6');
  });

  it('서버 그림과 번들 그림이 섞여도 같이 그려요 (서버에 없는 코드는 번들)', async () => {
    await act(async () => applyAvatarCatalog({ ...base, items: [item('w-tee', 'wear', [layer('tee', 300)])] }));
    const order = await draw(bare({ wear: 'w-tee', hat: 'h-beanie' }));
    expect(order).toContain('tee');
    expect(order.filter((x) => x === 'bundle').length).toBeGreaterThanOrEqual(2); // 몸 + 비니
  });
});
