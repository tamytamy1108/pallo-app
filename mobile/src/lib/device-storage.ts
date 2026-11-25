/**
 * 기기 저장소 — 앱을 껐다 켜도 남는 값 (키 하나 = JSON 한 덩어리).
 * - 폰: expo-file-system 의 문서 폴더 `pallo/<키>.json` (앱을 지우기 전까지 남아요)
 * - 웹 미리보기: localStorage `pallo-<키>` (프로토타입과 같은 이름 규칙)
 * 읽기는 바로(동기) — 앱이 뜨자마자 첫 화면에 저장된 값이 들어 있게.
 * 쓰기는 모아서 0.3초 뒤 한 번에 — 누를 때마다 파일을 쓰지 않게. 앱이 뒤로 가면 기다리지 않고 바로 써요.
 * 서버가 생기면 서버에 저장하는 값은 여기서 빼고, 기기 설정(효과음 · 리스닝 설정 등)만 남겨요.
 * 담당: 공통. 보통은 직접 부르지 않고 createStore(초기값, { persist }) 로 써요 (lib/store.ts).
 */
import { Directory, File, Paths } from 'expo-file-system';
import { AppState, Platform } from 'react-native';

import { devProfile } from './dev-profile';

// 개발용 사람(lib/dev-profile)마다 따로 저장해요 (pallo@pro/ · pallo@pro-<키>)
const PREFIX = devProfile ? `pallo@${devProfile}-` : 'pallo-';
const FOLDER = devProfile ? `pallo@${devProfile}` : 'pallo';
const WRITE_DELAY_MS = 300;
const web = Platform.OS === 'web';
// 자동 테스트는 매번 처음 상태에서 시작해요 (파일을 읽지도 쓰지도 않아요)
const disabled = process.env.NODE_ENV === 'test';

/* ───────── 폰: 문서 폴더 ───────── */

let dir: Directory | null | undefined;
function folder() {
  if (dir !== undefined) return dir;
  try {
    const d = new Directory(Paths.document, FOLDER);
    if (!d.exists) d.create({ intermediates: true, idempotent: true });
    dir = d;
  } catch {
    dir = null; // 폴더를 못 만들면 이번 실행은 저장 없이 (화면은 그대로 동작)
  }
  return dir;
}
const fileOf = (key: string) => {
  const d = folder();
  return d ? new File(d, `${key}.json`) : null;
};

/** 저장된 글자 그대로 (없거나 못 읽으면 null) */
export function readRaw(key: string): string | null {
  if (disabled) return null;
  try {
    if (web) return globalThis.localStorage?.getItem(PREFIX + key) ?? null;
    const f = fileOf(key);
    return f?.exists ? f.textSync() : null;
  } catch {
    return null;
  }
}

/** null 이면 지워요 */
function writeNow(key: string, text: string | null) {
  if (disabled) return;
  try {
    if (web) {
      if (text == null) globalThis.localStorage?.removeItem(PREFIX + key);
      else globalThis.localStorage?.setItem(PREFIX + key, text);
      return;
    }
    const f = fileOf(key);
    if (!f) return;
    if (text == null) {
      if (f.exists) f.delete();
      return;
    }
    if (!f.exists) f.create({ intermediates: true, overwrite: true });
    f.writeSync(text);
  } catch {
    // 저장을 못 해도 지금 화면은 그대로예요 (다음에 바뀔 때 다시 써요)
  }
}

/* ───────── 모아서 쓰기 ───────── */

// 키 → 쓸 때 글자를 만드는 함수 (쓰는 순간의 최신 값으로 만들어요)
const pending = new Map<string, () => string | null>();
let timer: ReturnType<typeof setTimeout> | undefined;

/** 곧 저장해요. 같은 키를 여러 번 불러도 마지막 값만 한 번 써요 */
export function writeLater(key: string, make: () => string | null) {
  if (disabled) return;
  pending.set(key, make);
  if (timer === undefined) timer = setTimeout(flushWrites, WRITE_DELAY_MS);
}

/** 기다리는 저장을 지금 다 써요 */
export function flushWrites() {
  clearTimeout(timer);
  timer = undefined;
  const jobs = [...pending.entries()];
  pending.clear();
  jobs.forEach(([key, make]) => {
    let text: string | null;
    try {
      text = make();
    } catch {
      return;
    }
    writeNow(key, text);
  });
}

if (!disabled) {
  // 앱이 뒤로 가거나 꺼지기 전에 바로 써요
  AppState.addEventListener('change', (s) => {
    if (s !== 'active') flushWrites();
  });
  if (web) globalThis.addEventListener?.('pagehide', flushWrites);
}

/** 이 앱이 기기에 저장한 것을 모두 지워요 (회원 탈퇴 · 개발용 초기화) */
export function removeAllSaved() {
  pending.clear();
  clearTimeout(timer);
  timer = undefined;
  if (disabled) return;
  try {
    if (web) {
      const ls = globalThis.localStorage;
      if (!ls) return;
      const keys: string[] = [];
      for (let i = 0; i < ls.length; i += 1) {
        const k = ls.key(i);
        if (k?.startsWith(PREFIX)) keys.push(k);
      }
      keys.forEach((k) => ls.removeItem(k));
      return;
    }
    const d = folder();
    if (d?.exists) d.delete();
    dir = undefined;
  } catch {
    // 못 지운 파일은 다음 저장 때 덮어써요
  }
}

/* ───────── JSON 으로 못 바꾸는 값 ───────── */

/**
 * 정규식(RegExp)도 남길 수 있게 바꿔요. 함수 · 클래스 객체처럼 못 남기는 값이 있으면 undefined (그 덩어리는 저장하지 않아요).
 * 레슨 '이어서 하기' 화면 상태처럼 모양이 정해지지 않은 값을 저장할 때 써요.
 */
export function packValue(v: unknown): unknown {
  if (v === null || typeof v === 'string' || typeof v === 'boolean') return v;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (v === undefined) return undefined;
  if (v instanceof RegExp) return { __re: v.source, f: v.flags };
  if (Array.isArray(v)) {
    const out: unknown[] = [];
    for (const x of v) {
      const p = x === undefined ? null : packValue(x);
      if (p === undefined) return undefined;
      out.push(p);
    }
    return out;
  }
  if (typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype) {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) {
      if (x === undefined) continue;
      const p = packValue(x);
      if (p === undefined) return undefined;
      out[k] = p;
    }
    return out;
  }
  return undefined; // 함수 · Map · Date 등
}

/** packValue 로 바꾼 값을 되돌려요 */
export function unpackValue(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(unpackValue);
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (typeof o.__re === 'string' && typeof o.f === 'string' && Object.keys(o).length === 2) {
      try {
        return new RegExp(o.__re, o.f);
      } catch {
        return null;
      }
    }
    return Object.fromEntries(Object.entries(o).map(([k, x]) => [k, unpackValue(x)]));
  }
  return v;
}
