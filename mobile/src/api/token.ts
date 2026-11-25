/**
 * 로그인 토큰 보관 — 공용 `@academy/api-client` 의 `tokenStorage` 에 이 앱의 저장소를 꽂아요 (`setTokenStore`).
 * 공용 클라이언트는 토큰을 동기로 읽어서(`tokenStorage.get()`), 실제 값은 메모리에 두고 기기 저장은 뒤에서 따라 써요.
 * - 폰: expo-secure-store (iOS 키체인 · Android Keystore)
 * - 웹 미리보기: secure-store 가 없어서 기기 저장(localStorage `pallo-tokens`) — 새로고침해도 로그인이 남아요.
 *   실제 웹 서비스를 연다면 httpOnly 쿠키로 바꿔요 (localStorage 는 페이지 스크립트가 읽을 수 있어요).
 * 앱 시작 때 `hydrateTokens()` 로 기기 저장 → 메모리를 한 번 채워요. 그 전에 나간 요청은 토큰 없이 나가요.
 * 토큰 규칙(우리 백엔드 jwt.mobile): access 15분 · refresh 30일, `POST /auth/refresh` 가 둘 다 새로 줘요.
 */
import { setTokenStore, tokenStorage, type AuthTokens, type TokenStore } from '@academy/api-client';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { devProfile } from '@/lib/dev-profile';
import { flushWrites, readRaw, writeLater } from '@/lib/device-storage';

import { apiConfig } from './config';

export type Tokens = AuthTokens;
export { tokenStorage };

const ACCESS_KEY = 'pallo.accessToken';
const REFRESH_KEY = 'pallo.refreshToken';
const WEB_KEY = 'tokens';
const native = Platform.OS === 'ios' || Platform.OS === 'android';

let memory: Tokens | null = null;
/** 메모리 값이 이미 정해졌는지 (복원 전에 로그인 · 로그아웃이 먼저 일어나면 복원 값으로 덮지 않아요) */
let decided = false;

/** 기기 저장은 순서대로 (저장 → 바로 지우기가 뒤집히지 않게) */
let writes: Promise<void> = Promise.resolve();

function persist(tokens: Tokens | null) {
  if (!native) {
    // 토큰 두 개만 (로그인 응답의 다른 값은 남기지 않아요 · 폰과 같게)
    writeLater(WEB_KEY, () => (tokens ? JSON.stringify({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }) : null));
    flushWrites();
    return;
  }
  writes = writes
    .then(async () => {
      if (!tokens) {
        await SecureStore.deleteItemAsync(ACCESS_KEY);
        await SecureStore.deleteItemAsync(REFRESH_KEY);
        return;
      }
      await SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken);
      if (tokens.refreshToken) await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken);
      else await SecureStore.deleteItemAsync(REFRESH_KEY);
    })
    .catch((e: unknown) => console.warn('[token] 기기 저장 실패', e));
}

/* 토큰이 바뀌면 알려 줘요 — 로그인 상태(api/session.tsx)가 useSyncExternalStore 로 구독해요 */
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** 토큰이 생기거나 바뀌거나 사라지면 listener 를 불러요. 돌려준 함수로 그만 들어요 */
export function subscribeTokens(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const store: TokenStore = {
  get: () => memory,
  set(tokens) {
    decided = true;
    memory = { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
    persist(memory);
    emit();
  },
  clear() {
    const had = memory !== null;
    decided = true;
    memory = null;
    persist(null);
    if (had) emit();
  },
};
setTokenStore(store);

function readWeb(): Tokens | null {
  try {
    const t = JSON.parse(readRaw(WEB_KEY) ?? 'null') as Partial<Tokens> | null;
    return t && typeof t.accessToken === 'string' ? { accessToken: t.accessToken, refreshToken: typeof t.refreshToken === 'string' ? t.refreshToken : undefined } : null;
  } catch {
    return null;
  }
}

async function readNative(): Promise<Tokens | null> {
  try {
    const accessToken = await SecureStore.getItemAsync(ACCESS_KEY);
    const refreshToken = (await SecureStore.getItemAsync(REFRESH_KEY)) ?? undefined;
    return accessToken ? { accessToken, refreshToken } : null;
  } catch (e) {
    console.warn('[token] 기기 저장 읽기 실패', e);
    return null;
  }
}

let hydrating: Promise<void> | null = null;
let hydrated = false;

/** 기기 저장 → 메모리 (한 번만). 로그인 상태(api/session.tsx)가 앱 시작 때 불러요 */
export function hydrateTokens(): Promise<void> {
  hydrating ??= (async () => {
    const saved = native ? await readNative() : readWeb();
    if (!decided) {
      // 개발용 사람(lib/dev-profile) + 가짜 서버: 로그인한 채로 시작해요 (첫 화면 · 가입을 건너뛰고 홈부터)
      memory = saved ?? (devProfile && apiConfig.useMock ? { accessToken: `mock-${devProfile}`, refreshToken: 'mock-refresh' } : null);
      decided = true;
    }
    hydrated = true;
    emit();
  })();
  return hydrating;
}

/** 기기 저장에서 토큰을 다 읽어 왔는지 */
export const isTokensHydrated = () => hydrated;
