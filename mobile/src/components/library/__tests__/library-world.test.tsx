import { act, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { LibraryWorld, type LibWorld } from '@/components/library/library-world';
import type { WorldCtl } from '@/components/library/world/world-view';

// 3D 지도 대신: 그렸는지 · 다시 돌았는지를 테스트가 다뤄요
type Fake = { id: string; active: boolean; drawn: boolean; replays: number[]; draw: () => void };
const fakes: Fake[] = [];
jest.mock('@/components/library/world/world-view', () => {
  const { useEffect, useRef } = jest.requireActual<typeof import('react')>('react');
  return {
    WorldView: ({ id, active = true, onDrawn, ctlRef }: { id: string; active?: boolean; onDrawn?: () => void; ctlRef?: { current: WorldCtl | null } }) => {
      const me = useRef<Fake | null>(null);
      if (!me.current) {
        me.current = { id, active, drawn: false, replays: [], draw: () => {} };
        fakes.push(me.current);
      }
      me.current.active = active;
      useEffect(() => {
        const f = me.current!;
        f.draw = () => {
          f.drawn = true;
          onDrawn?.();
        };
        if (ctlRef) ctlRef.current = { ready: () => f.drawn, replay: (d) => f.replays.push(d) };
      });
      return null;
    },
  };
});
// 움직임은 바로 끝 값으로 (테스트는 언제 무엇을 하는지만 봐요)
jest.mock('react-native-reanimated', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  const sv = (v: unknown) => ({ value: v, set(n: unknown) { this.value = n; }, get() { return this.value; } });
  return {
    __esModule: true,
    default: { View },
    Easing: { out: () => () => 0, ease: () => 0 },
    useSharedValue: (v: unknown) => jest.requireActual<typeof import('react')>('react').useState(() => sv(v))[0],
    useAnimatedStyle: (f: () => object) => f(),
    useReducedMotion: () => false,
    withTiming: (v: unknown) => v,
    withDelay: (_: number, v: unknown) => v,
  };
});
let mockLite = false;
let mockWeb = true;
jest.mock('@/components/library/world/world-support', () => ({ liteWorld: () => mockLite, warmAllInBackground: () => mockWeb }));
// 지도 칸은 라이브러리 화면 안에서만 미리 만들어요 (테스트엔 길 안내가 없어서 늘 보고 있는 것으로)
jest.mock('expo-router', () => ({ useIsFocused: () => true }));
jest.mock('@/components/ui/raised', () => ({ Raised: ({ children }: { children: ReactNode }) => children }));

const W = (slot: string, order: number): LibWorld => ({ slot, id: slot, sc: [['a', 'b', 'open']], order });
const study = W('study', -1);
const travel = W('travel', 0);
const biz = W('biz', 1);
const cafe = W('cafe', 2);
const of = (id: string) => fakes.filter((f) => f.id === id);
const tick = (ms: number) => act(async () => {
  jest.advanceTimersByTime(ms);
});
const draw = (id: string) => act(async () => of(id).at(-1)!.draw());

beforeEach(() => {
  fakes.length = 0;
  mockLite = false;
  mockWeb = true;
  jest.useFakeTimers();
});
afterEach(() => jest.useRealTimers());

describe('라이브러리 지도 바꾸기', () => {
  it('지금 지도가 그려진 뒤 다른 지도를 하나씩 미리 만들어요', async () => {
    await render(<LibraryWorld world={study} warm={[travel, biz]} onOpen={() => {}} />);
    expect(fakes.map((f) => f.id)).toEqual(['study']);
    await draw('study');
    await tick(1000);
    expect(fakes.map((f) => f.id)).toEqual(['study', 'travel']);
    expect(of('travel')[0].active).toBe(false);
    await tick(3000);
    expect(fakes).toHaveLength(2); // travel 이 다 그려질 때까지 다음 지도는 기다려요
    await draw('travel');
    await tick(1000);
    expect(fakes.map((f) => f.id)).toEqual(['study', 'travel', 'biz']);
  });

  it('다른 지도를 만드는 동안만 보이는 지도를 멈추고, 그 사이에는 움직여요', async () => {
    await render(<LibraryWorld world={study} warm={[travel, biz]} onOpen={() => {}} />);
    expect(of('study')[0].active).toBe(true); // 만드는 중 (아직 그리기 전)
    await draw('study');
    await tick(100);
    expect(of('study')[0].active).toBe(false); // travel 을 만드는 중
    await draw('travel');
    expect(of('study')[0].active).toBe(true); // 다음 차례(biz)를 기다리는 동안은 움직여요
    await tick(1000);
    expect(of('study')[0].active).toBe(false); // biz 를 만드는 중
    await draw('biz');
    expect(of('study')[0].active).toBe(true);
    expect(of('travel')[0].active).toBe(false);
  });

  it('미리 만든 지도로 바꾸면 새로 만들지 않고 바로 돌며 들어와요', async () => {
    const r = await render(<LibraryWorld world={study} warm={[travel]} onOpen={() => {}} />);
    await draw('study');
    await tick(1000);
    await draw('travel');
    await r.rerender(<LibraryWorld world={travel} warm={[study]} onOpen={() => {}} />);
    expect(of('travel')).toHaveLength(1);
    expect(of('travel')[0].active).toBe(true);
    expect(of('travel')[0].replays).toEqual([1]); // 스터디 맵(-1) → 상황 맵(0): 시계 방향
    expect(of('study')[0].active).toBe(false); // 새 지도가 돌며 들어오는 동안 앞 지도는 그리기를 멈춰요
    await tick(400);
    expect(of('study')).toHaveLength(1); // 앞 지도는 숨겨 두기만 (다시 돌아가면 바로)
  });

  it('폰은 지도가 화면에 보이는 동안 미리 만들지 않고, 지도가 화면 밖으로 가면 만들어요 (보는 지도가 멈칫거리지 않게)', async () => {
    mockWeb = false;
    const r = await render(<LibraryWorld world={study} warm={[travel]} onOpen={() => {}} visible />);
    await draw('study');
    await tick(5000);
    expect(fakes.map((f) => f.id)).toEqual(['study']);
    expect(of('study')[0].active).toBe(true);
    await r.rerender(<LibraryWorld world={study} warm={[travel]} onOpen={() => {}} visible={false} />);
    await tick(3000);
    expect(fakes.map((f) => f.id)).toEqual(['study', 'travel']);
  });

  it('메모리가 적은 폰은 다음에 갈 지도 두 장만 미리 만들어요', async () => {
    mockLite = true;
    await render(<LibraryWorld world={study} warm={[travel, biz, cafe]} onOpen={() => {}} />);
    await draw('study');
    await tick(1000);
    await draw('travel');
    await tick(1000);
    await draw('biz');
    await tick(3000);
    expect(fakes.map((f) => f.id)).toEqual(['study', 'travel', 'biz']);
  });

  it('왼쪽 맵으로 가면 반대로 돌아요', async () => {
    const r = await render(<LibraryWorld world={biz} warm={[travel]} onOpen={() => {}} />);
    await draw('biz');
    await tick(1000);
    await draw('travel');
    await r.rerender(<LibraryWorld world={travel} warm={[biz]} onOpen={() => {}} />);
    expect(of('travel')[0].replays).toEqual([-1]);
  });

  it('아직 안 만든 지도: 기다리지 않고 사진판부터 띄우고, 그려지면 같은 구도로 이어져요', async () => {
    const r = await render(<LibraryWorld world={travel} onOpen={() => {}} />);
    await draw('travel');
    await r.rerender(<LibraryWorld world={biz} onOpen={() => {}} />);
    expect(of('biz')).toHaveLength(0); // 탭 · 칩이 먼저 바뀌어 보이게, 새 지도는 두 프레임 뒤에 만들어요
    await tick(50);
    expect(of('biz')[0].replays).toEqual([]);
    await tick(150);
    await draw('biz');
    expect(of('biz')[0].replays).toEqual([]); // 사진판이 먼저 떴어요 → 돌지 않고 이어져요

    await r.rerender(<LibraryWorld world={cafe} onOpen={() => {}} />);
    await tick(50);
    await tick(1500);
    await draw('cafe');
    expect(of('cafe')[0].replays).toEqual([]); // 사진판이 먼저 떴어요 → 같은 구도로 이어져요
  });

  it('바꾼 직후 화면이 한 번 더 그려져도(같은 지도 · 새 객체) 새 지도가 올라와요', async () => {
    const r = await render(<LibraryWorld world={study} onOpen={() => {}} />);
    await draw('study');
    await r.rerender(<LibraryWorld world={W('travel', 0)} onOpen={() => {}} />);
    // 두 프레임이 지나기 전에 화면이 다시 그려져요 (NEW 끄기 · 스크롤 등) — 내용은 같고 객체만 새것
    await r.rerender(<LibraryWorld world={W('travel', 0)} onOpen={() => {}} />);
    await tick(50);
    expect(of('travel')).toHaveLength(1);
    await draw('travel');
    expect(of('travel')[0].replays).toEqual([]); // 안 만든 지도라 사진판부터 떠요 → 돌지 않고 이어져요
  });
});
