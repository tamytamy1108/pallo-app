/**
 * 기기 저장 (createStore 의 persist): 저장 → 다시 켜면(모듈을 새로 불러오면) 그대로 · 모양이 바뀐 저장은 버려요.
 * 테스트에서는 파일 대신 메모리 칸을 써요.
 */
const mockDisk = new Map<string, string>();

jest.mock('@/lib/device-storage', () => {
  const actual = jest.requireActual('@/lib/device-storage');
  return {
    ...actual,
    readRaw: (key: string) => mockDisk.get(key) ?? null,
    writeLater: (key: string, make: () => string | null) => {
      const text = make();
      if (text == null) mockDisk.delete(key);
      else mockDisk.set(key, text);
    },
    removeAllSaved: () => mockDisk.clear(),
  };
});

type StoreModule = typeof import('@/lib/store');
const fresh = (): StoreModule => {
  let mod: StoreModule | undefined;
  jest.isolateModules(() => {
    mod = jest.requireActual('@/lib/store');
  });
  if (!mod) throw new Error('store module not loaded');
  return mod;
};

beforeEach(() => mockDisk.clear());

describe('createStore persist', () => {
  it('앱을 다시 켜도 저장한 값으로 시작해요', () => {
    const a = fresh().createStore({ n: 0, name: 'x' }, { persist: { key: 't' } });
    a.set({ n: 3, name: 'y' });
    const b = fresh().createStore({ n: 0, name: 'x' }, { persist: { key: 't' } });
    expect(b.get()).toEqual({ n: 3, name: 'y' });
  });

  it('새로 늘린 필드는 처음 값으로 채워요', () => {
    mockDisk.set('t', JSON.stringify({ v: 1, d: { n: 5 } }));
    const s = fresh().createStore({ n: 0, added: true }, { persist: { key: 't' } });
    expect(s.get()).toEqual({ n: 5, added: true });
  });

  it('version 이 다르거나 깨진 저장은 버려요', () => {
    mockDisk.set('t', JSON.stringify({ v: 1, d: { n: 5 } }));
    expect(fresh().createStore({ n: 0 }, { persist: { key: 't', version: 2 } }).get()).toEqual({ n: 0 });
    mockDisk.set('t', '{oops');
    expect(fresh().createStore({ n: 0 }, { persist: { key: 't' } }).get()).toEqual({ n: 0 });
  });

  it('save · load 로 잠깐 쓰는 값을 빼요', () => {
    const opts = {
      persist: {
        key: 't',
        save: (s: { keep: number; tmp: number }) => ({ keep: s.keep }),
        load: (v: unknown, init: { keep: number; tmp: number }) => ({ ...init, ...(v as object) }),
      },
    };
    fresh().createStore({ keep: 0, tmp: 0 }, opts).set({ keep: 1, tmp: 9 });
    expect(fresh().createStore({ keep: 0, tmp: 0 }, opts).get()).toEqual({ keep: 1, tmp: 0 });
  });

  it('clearSavedData 는 처음 값으로 돌리고 저장을 지워요', () => {
    const m = fresh();
    const s = m.createStore({ n: 0 }, { persist: { key: 't' } });
    s.set({ n: 2 });
    m.clearSavedData();
    expect(s.get()).toEqual({ n: 0 });
    expect(mockDisk.size).toBe(0);
  });
});

describe('packValue · unpackValue', () => {
  const { packValue, unpackValue } = jest.requireActual('@/lib/device-storage') as typeof import('@/lib/device-storage');

  it('정규식은 남기고 되돌려요', () => {
    const v = { tasks: [{ focus: /i'?d like/i, n: 1 }], i: 2 };
    const back = unpackValue(JSON.parse(JSON.stringify(packValue(v)))) as typeof v;
    expect(back.tasks[0].focus).toBeInstanceOf(RegExp);
    expect(back.tasks[0].focus.test("I'd like")).toBe(true);
    expect(back.i).toBe(2);
  });

  it('함수가 들어 있으면 저장하지 않아요', () => {
    expect(packValue({ make: () => 1 })).toBeUndefined();
    expect(packValue([1, { a: () => 0 }])).toBeUndefined();
  });
});
