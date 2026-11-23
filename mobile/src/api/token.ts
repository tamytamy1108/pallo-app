/**
 * 로그인 토큰 보관. 폰에서는 expo-secure-store (iOS 키체인 · Android Keystore) 에 넣어요.
 * 웹 미리보기는 secure-store 를 지원하지 않아서 메모리에만 둬요 (새로고침하면 사라져요).
 * 토큰 유효 시간 · 갱신(refresh) 방법은 백엔드 첫 회의(B4)에서 정해요.
 */
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type Tokens = { accessToken: string; refreshToken?: string };

const ACCESS_KEY = 'pallo.accessToken';
const REFRESH_KEY = 'pallo.refreshToken';
const native = Platform.OS === 'ios' || Platform.OS === 'android';

// 매 요청마다 키체인을 열지 않게 한 번 읽은 값을 기억해요 (undefined = 아직 안 읽음)
let cached: Tokens | null | undefined;

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
  const accessToken = await read(ACCESS_KEY);
  const refreshToken = (await read(REFRESH_KEY)) ?? undefined;
  cached = accessToken ? { accessToken, refreshToken } : null;
  return cached;
}

export const getAccessToken = async () => (await getTokens())?.accessToken ?? null;

export async function saveTokens(tokens: Tokens) {
  cached = tokens;
  if (!native) return;
  await SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken);
  if (tokens.refreshToken) await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken);
  else await SecureStore.deleteItemAsync(REFRESH_KEY);
}

export async function clearTokens() {
  cached = null;
  if (!native) return;
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}
