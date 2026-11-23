/**
 * API 설정: 어느 서버(개발 · 테스트 · 실제)에 붙을지, 아직 가짜 데이터(mock)를 쓸지.
 *
 * 정하는 곳 (위가 이겨요)
 * 1. `.env` 파일의 `EXPO_PUBLIC_API_ENV=dev|staging|prod` · `EXPO_PUBLIC_API_MOCK=0|1`
 *    (Expo SDK 58 은 `.env` · `.env.local` · `.env.development` · `.env.production` 만 읽어요. `.env.staging` 은 안 읽어요)
 * 2. `app.json` › `expo.extra.api` — `env` · `baseUrls` · `mock` · `mockDelayMs`
 *
 * 서버 주소는 백엔드 첫 회의(B3)에서 정해요. 주소가 비어 있으면 mock 을 꺼도 요청하지 않고 오류를 내요.
 */
import Constants from 'expo-constants';

export type ApiEnv = 'dev' | 'staging' | 'prod';

const ENVS: readonly ApiEnv[] = ['dev', 'staging', 'prod'];

const isApiEnv = (v: unknown): v is ApiEnv => typeof v === 'string' && (ENVS as readonly string[]).includes(v);
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** app.json › extra.api 를 안전하게 읽어요 (잘못 적힌 값은 무시) */
type ApiExtra = { env?: ApiEnv; baseUrls: Partial<Record<ApiEnv, string>>; mock?: boolean; mockDelayMs?: number };

function readExtra(): ApiExtra {
  const api: unknown = Constants.expoConfig?.extra?.api;
  if (!isRecord(api)) return { baseUrls: {} };
  const urls = isRecord(api.baseUrls) ? api.baseUrls : {};
  const baseUrls: Partial<Record<ApiEnv, string>> = {};
  for (const e of ENVS) {
    const u = urls[e];
    if (typeof u === 'string') baseUrls[e] = u;
  }
  return {
    env: isApiEnv(api.env) ? api.env : undefined,
    baseUrls,
    mock: typeof api.mock === 'boolean' ? api.mock : undefined,
    mockDelayMs: typeof api.mockDelayMs === 'number' ? api.mockDelayMs : undefined,
  };
}

function resolve() {
  const extra = readExtra();
  // EXPO_PUBLIC_ 값은 빌드할 때 글자 그대로 바뀌어 들어가요 — 꼭 process.env.EXPO_PUBLIC_X 모양으로 써요
  const envFromFile = process.env.EXPO_PUBLIC_API_ENV;
  const mockFromFile = process.env.EXPO_PUBLIC_API_MOCK;
  const env: ApiEnv = isApiEnv(envFromFile) ? envFromFile : (extra.env ?? (__DEV__ ? 'dev' : 'prod'));
  const useMock = mockFromFile === '0' ? false : mockFromFile === '1' ? true : (extra.mock ?? true);
  return {
    env,
    baseUrl: (extra.baseUrls[env] ?? '').replace(/\/+$/, ''),
    useMock,
    /** 가짜 응답을 몇 ms 늦출지 (불러오는 중 화면 확인용) */
    mockDelayMs: extra.mockDelayMs ?? 0,
    /** 요청 하나가 이보다 오래 걸리면 끊어요 */
    timeoutMs: 15_000,
  } as const;
}

export const apiConfig = resolve();
