/**
 * 로그인 토큰 보관. 폰에서는 expo-secure-store (iOS 키체인 · Android Keystore) 에 넣어요.
 * 웹 미리보기는 secure-store 가 없어서 다른 기록처럼 기기 저장(localStorage `pallo-tokens`)에 둬요 — 새로고침해도 로그인이 남아요.
 * 실제 웹 서비스를 연다면 httpOnly 쿠키로 바꿔요 (localStorage 는 페이지 스크립트가 읽을 수 있어요).
 * 토큰 유효 시간 · 갱신(refresh) 방법은 백엔드 첫 회의(B4)에서 정해요.
 */
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { flushWrites, readRaw, writeLater } from '@/lib/device-storage';

export type Tokens = { accessToken: string; refreshToken?: string };

const ACCESS_KEY = 'pallo.accessToken';
const REFRESH_KEY = 'pallo.refreshToken';
const native = Platform.OS === 'ios' || Platform.OS === 'android';

// 매 요청마다 키체인을 열지 않게 한 번 읽은 값을 기억해요 (undefined = 아직 안 읽음)
let cached: Tokens | null | undefined;

const WEB_KEY = 'tokens';

function readWeb(): Tokens | null {
  try {
    const t = JSON.parse(readRaw(WEB_KEY) ?? 'null') as Partial<Tokens> | null;
    return t && typeof t.accessToken === 'string' ? { accessToken: t.accessToken, refreshToken: typeof t.refreshToken === 'string' ? t.refreshToken : undefined } : null;
  } catch {
    return null;
  }
}

/** 웹: 바로 써요 (로그인 직후 새로고침해도 남게) */
function writeWeb(tokens: Tokens | null) {
  // 토큰 두 개만 (로그인 응답의 다른 값은 남기지 않아요 · 폰과 같게)
  writeLater(WEB_KEY, () => (tokens ? JSON.stringify({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }) : null));
  flushWrites();
}

async function read(key: string) {
  if (!native) return null;
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function getTokens(): Promise<Tokens | null> {
  if (cached !== undefined) return cached;
  if (!native) {
    cached = readWeb();
    return cached;
  }
  const accessToken = await read(ACCESS_KEY);
  const refreshToken = (await read(REFRESH_KEY)) ?? undefined;
  cached = accessToken ? { accessToken, refreshToken } : null;
  return cached;
}

export const getAccessToken = async () => (await getTokens())?.accessToken ?? null;

export async function saveTokens(tokens: Tokens) {
  cached = tokens;
  if (!native) {
    writeWeb(tokens);
    return;
  }
  await SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken);
  if (tokens.refreshToken) await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken);
  else await SecureStore.deleteItemAsync(REFRESH_KEY);
}

export async function clearTokens() {
  cached = null;
  if (!native) {
    writeWeb(null);
    return;
  }
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}
