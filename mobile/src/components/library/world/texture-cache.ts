/**
 * 3D 지도 텍스처 그림 기억칸 — soft-canvas 가 픽셀로 칠한 결과를 '그리기 명령 서명'으로 기억해요.
 * 같은 명령이 다시 오면(지도를 다시 열거나 · 앱을 다시 켜서 같은 지도) 칠하지 않고 기억한 픽셀을 써요.
 * 명령이 하나라도 다르면 서명이 달라서 틀린 그림을 쓸 일이 없어요 (밤 · 시계처럼 바뀌는 그림도 그대로).
 *
 * - 메모리: 배열을 복사하지 않고 같이 써요 (다시 칠할 때만 soft-canvas 가 복사). 최근 것부터 MEM_BUDGET 까지.
 * - 기기(폰만): 칠하는 데 오래 걸린 그림만 앱 캐시 폴더에 (DISK_BUDGET 까지 · 오래된 것부터 지움). 운영체제가 비울 수도 있어요.
 * - ⚠ soft-canvas 의 칠하는 결과가 바뀌면 VER 를 올려요 (예전 기억은 버려요).
 */
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import { liteWorld } from './world-support';

/** 칠하기 결과 판 — soft-canvas 를 바꿔 그림이 달라지면 올려요 */
export const VER = 2;

const MB = 1024 * 1024;
const lite = () => {
  try {
    return liteWorld();
  } catch {
    return false;
  }
};
const MEM_BUDGET = () => (lite() ? 24 : 72) * MB;
const DISK_BUDGET = () => (lite() ? 32 : 96) * MB;
/** 이만큼(ms) 넘게 칠한 그림만 기기에 남겨요 (금방 칠하는 작은 그림 · 매분 바뀌는 시계는 빼요) */
const DISK_MIN_MS = 8;

const diskOff = Platform.OS === 'web' || process.env.NODE_ENV === 'test';

/* ───────── 메모리 ───────── */

const mem = new Map<string, Uint8ClampedArray>();
let memBytes = 0;

function memGet(key: string) {
  const hit = mem.get(key);
  if (!hit) return null;
  // 최근에 쓴 것으로 (Map 은 넣은 순서를 기억해요)
  mem.delete(key);
  mem.set(key, hit);
  return hit;
}

function memPut(key: string, buf: Uint8ClampedArray) {
  const budget = MEM_BUDGET();
  if (buf.length > budget / 4) return false;
  const old = mem.get(key);
  if (old) {
    memBytes -= old.length;
    mem.delete(key);
  }
  mem.set(key, buf);
  memBytes += buf.length;
  for (const [k, v] of mem) {
    if (memBytes <= budget) break;
    mem.delete(k);
    memBytes -= v.length;
  }
  return mem.has(key);
}

/* ───────── 기기 (앱 캐시 폴더) ───────── */

type DiskIndex = { files: Map<string, { bytes: number; time: number }>; total: number };
let dir: Directory | null | undefined;
let index: DiskIndex | null = null;

function folder() {
  if (dir !== undefined) return dir;
  try {
    const d = new Directory(Paths.cache, `pallo-tex-v${VER}`);
    if (!d.exists) d.create({ intermediates: true, idempotent: true });
    // 예전 판 폴더는 지워요
    for (const e of new Directory(Paths.cache).list()) {
      if (e instanceof Directory && e.name.startsWith('pallo-tex-v') && e.name !== `pallo-tex-v${VER}`) e.delete();
    }
    dir = d;
  } catch {
    dir = null;
  }
  return dir;
}

function diskIndex(): DiskIndex | null {
  if (index) return index;
  const d = folder();
  if (!d) return null;
  const files = new Map<string, { bytes: number; time: number }>();
  let total = 0;
  try {
    for (const e of d.list()) {
      if (!(e instanceof File) || !e.name.endsWith('.bin')) continue;
      const bytes = e.size ?? 0;
      files.set(e.name.slice(0, -4), { bytes, time: e.modificationTime ?? 0 });
      total += bytes;
    }
  } catch {
    // 못 읽으면 빈 것으로
  }
  index = { files, total };
  return index;
}

function diskGet(key: string, bytes: number): Uint8ClampedArray | null {
  if (diskOff) return null;
  const ix = diskIndex();
  const d = folder();
  if (!ix || !d || !ix.files.has(key)) return null;
  try {
    const f = new File(d, `${key}.bin`);
    const b = f.bytesSync();
    if (b.length !== bytes) {
      // 크기가 다르면 깨진 파일 — 지워요
      f.delete();
      ix.total -= ix.files.get(key)?.bytes ?? 0;
      ix.files.delete(key);
      return null;
    }
    return new Uint8ClampedArray(b.buffer, b.byteOffset, b.length);
  } catch {
    return null;
  }
}

// 기기에 쓰기는 하나씩 · 지도 그리기를 막지 않게 뒤에서
const writeQueue: [string, Uint8ClampedArray][] = [];
let writing = false;

function diskPut(key: string, buf: Uint8ClampedArray) {
  if (diskOff) return;
  const ix = diskIndex();
  if (!ix || ix.files.has(key) || buf.length > DISK_BUDGET() / 4) return;
  if (writeQueue.some(([k]) => k === key)) return;
  writeQueue.push([key, buf]);
  if (!writing) setTimeout(drain, 0);
}

async function drain() {
  const d = folder();
  const ix = diskIndex();
  if (!d || !ix) return;
  writing = true;
  while (writeQueue.length) {
    const [key, buf] = writeQueue.shift()!;
    try {
      const f = new File(d, `${key}.bin`);
      if (!f.exists) f.create({ overwrite: true });
      await f.write(new Uint8Array(buf.buffer, buf.byteOffset, buf.length));
      ix.files.set(key, { bytes: buf.length, time: Date.now() });
      ix.total += buf.length;
      evict(d, ix);
    } catch {
      // 못 쓰면 다음에 다시 칠하면 돼요
    }
  }
  writing = false;
}

function evict(d: Directory, ix: DiskIndex) {
  const budget = DISK_BUDGET();
  if (ix.total <= budget) return;
  const old = [...ix.files.entries()].sort((a, b) => a[1].time - b[1].time);
  for (const [k, v] of old) {
    if (ix.total <= budget) break;
    try {
      const f = new File(d, `${k}.bin`);
      if (f.exists) f.delete();
    } catch {
      // 다음에 다시
    }
    ix.files.delete(k);
    ix.total -= v.bytes;
  }
}

/* ───────── soft-canvas 가 불러요 ───────── */

/** 기억한 픽셀 (메모리 → 기기 순). 돌려준 배열은 같이 써요 — 칠하기 전에 복사해요 */
export function cachedPixels(key: string, bytes: number): Uint8ClampedArray | null {
  const m = memGet(key);
  if (m && m.length === bytes) return m;
  const d = diskGet(key, bytes);
  if (d) memPut(key, d);
  return d;
}

/** 칠한 픽셀 기억 (같이 쓰면 true — 그 뒤엔 칠하기 전에 복사해야 해요). ms: 칠하는 데 걸린 시간 */
export function rememberPixels(key: string, buf: Uint8ClampedArray, ms: number): boolean {
  const kept = memPut(key, buf);
  if (ms >= DISK_MIN_MS) diskPut(key, buf);
  return kept || ms >= DISK_MIN_MS;
}

/** 개발 · 테스트용: 메모리 기억 비우기 */
export function clearTextureMemory() {
  mem.clear();
  memBytes = 0;
}
