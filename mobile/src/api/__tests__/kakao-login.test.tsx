/**
 * 카카오 로그인 — 폰(카카오 SDK → POST /auth/login/kakao-token) · 웹 인가 주소 · 지점 QR state. 웹 콜백 화면 훅은 kakao-callback.test.tsx.
 * 카카오 SDK(네이티브 모듈)와 서버(fetch)만 대역이고, 우리 코드(auth · client · token)는 진짜로 돌아요.
 * 클라이언트 · SDK 초기화 상태가 모듈에 있어서 테스트마다 모듈을 새로 불러요 (client.test.ts 와 같은 방식).
 */
import type * as AuthModule from '../auth';
import type * as KakaoLogin from '../kakao-login';
import type * as Token from '../token';

jest.mock('../config', () => ({ apiConfig: mockApiConfig }));
const KEYS = { nativeAppKey: 'native-key', restApiKey: 'rest-key', redirectUri: 'http://localhost:8081/auth/kakao/callback' };
const mockKakaoKeys = { ...KEYS };
const mockApiConfig = { env: 'dev', baseUrl: 'https://api.test', useMock: false, mockDelayMs: 0, timeoutMs: 1000 };
jest.mock('../kakao-config', () => ({
  kakaoConfig: mockKakaoKeys,
  kakaoAuthorizeUrl: jest.requireActual('../kakao-config').kakaoAuthorizeUrl,
}));
const mockSdk = { initializeKakaoSDK: jest.fn(), login: jest.fn() };
jest.mock('@react-native-kakao/core', () => ({ initializeKakaoSDK: (...a: unknown[]) => mockSdk.initializeKakaoSDK(...a) }));
jest.mock('@react-native-kakao/user', () => ({ login: (...a: unknown[]) => mockSdk.login(...a) }));

const realFetch = globalThis.fetch;
const fetchMock = jest.fn();
const reply = (status: number, body: unknown) =>
  ({ ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(body) }) as unknown as Response;
const TOKENS = { accessToken: 'our-access', refreshToken: 'our-refresh' };

let auth: typeof AuthModule;
let kakao: typeof KakaoLogin;
let tokenStorage: typeof Token.tokenStorage;

const sent = (i = 0) => ({ url: fetchMock.mock.calls[i][0] as string, body: JSON.parse(fetchMock.mock.calls[i][1].body as string) });

beforeEach(() => {
  jest.resetModules();
  fetchMock.mockReset();
  mockSdk.initializeKakaoSDK.mockReset().mockResolvedValue(undefined);
  mockSdk.login.mockReset();
  Object.assign(mockKakaoKeys, KEYS);
  mockApiConfig.useMock = false;
  auth = jest.requireActual<typeof AuthModule>('../auth');
  kakao = jest.requireActual<typeof KakaoLogin>('../kakao-login');
  ({ tokenStorage } = jest.requireActual<typeof Token>('../token'));
  tokenStorage.clear();
  // 모듈을 불러오면 Expo 가 전역 fetch 를 다시 깔아요 → 불러온 뒤에 바꿔 끼워요
  globalThis.fetch = fetchMock;
});
afterAll(() => {
  globalThis.fetch = realFetch;
});

describe('지점 QR state → 유입 값 (referralFromState)', () => {
  it.each([
    ['HANAM,12', { branchCode: 'HANAM', adId: 12 }],
    [' HANAM , 12 ', { branchCode: 'HANAM', adId: 12 }],
    ['HANAM', { branchCode: 'HANAM' }],
    ['HANAM,', { branchCode: 'HANAM' }],
    ['HANAM,0', { branchCode: 'HANAM' }],
    ['HANAM,abc', { branchCode: 'HANAM' }],
    ['HANAM,-3', { branchCode: 'HANAM' }],
    ['HANAM,01', { branchCode: 'HANAM' }],
    ['HANAM,1.5', { branchCode: 'HANAM' }],
    // 쉼표 뒤 셋째 값부터는 버려요
    ['HANAM,1,2', { branchCode: 'HANAM', adId: 1 }],
    // JS 숫자로 정확한 끝(2^53 - 1)까지만 — 넘으면 다른 id 로 바뀌어서 버려요
    ['HANAM,9007199254740991', { branchCode: 'HANAM', adId: 9007199254740991 }],
    ['HANAM,9007199254740992', { branchCode: 'HANAM' }],
    ['HANAM,9999999999999999', { branchCode: 'HANAM' }],
    ['state=HANAM', {}],
    [',12', {}],
    [',', {}],
    [' ', {}],
    ['', {}],
    [null, {}],
    [undefined, {}],
  ])('%p → %p', (state, expected) => {
    expect(auth.referralFromState(state)).toEqual(expected);
  });
});

describe('폰: 카카오 SDK 로그인 (startKakaoLogin)', () => {
  it('SDK 가 준 카카오 토큰을 v2 kakao-token 으로 보내고 우리 토큰을 저장해요 · SDK 초기화는 한 번', async () => {
    mockSdk.login.mockResolvedValue({ accessToken: 'kakao-at' });
    fetchMock.mockResolvedValue(reply(200, TOKENS));

    await expect(kakao.startKakaoLogin()).resolves.toBe('done');
    await expect(kakao.startKakaoLogin({ branchCode: 'HANAM', adId: 3 })).resolves.toBe('done');

    expect(sent(0)).toEqual({ url: 'https://api.test/app/api/v2/auth/login/kakao-token', body: { accessToken: 'kakao-at' } });
    expect(sent(1).body).toEqual({ accessToken: 'kakao-at', branchCode: 'HANAM', adId: 3 });
    expect(tokenStorage.get()).toEqual(TOKENS);
    expect(mockSdk.initializeKakaoSDK).toHaveBeenCalledTimes(1);
    expect(mockSdk.initializeKakaoSDK).toHaveBeenCalledWith('native-key');
  });

  it.each([
    ['Android Cancelled (code)', Object.assign(new Error('user cancelled'), { code: 'Cancelled' })],
    ['code 만 있음', Object.assign(new Error('login failed'), { code: 'Cancelled' })],
    ['iOS AccessDenied', Object.assign(new Error('AuthFailed'), { code: 'AccessDenied' })],
    ['iOS access_denied 문구', new Error('access_denied: User denied access')],
    ['대소문자 섞임', new Error('User CANCELED the login')],
    ['문자열로 던짐', 'Cancelled'],
  ])('사용자가 카카오 로그인을 닫으면(%s) cancelled · 서버에 보내지 않아요', async (_label, error) => {
    mockSdk.login.mockRejectedValue(error);
    await expect(kakao.startKakaoLogin()).resolves.toBe('cancelled');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(tokenStorage.get()).toBeNull();
  });

  it.each([
    ['일반 오류', new Error('KakaoTalk not connected')],
    ['code 가 다른 오류', Object.assign(new Error('network'), { code: 'NetworkError' })],
    ['문자열로 던짐', 'misconfigured'],
  ])('SDK 의 다른 오류(%s)는 그대로 던져요 (화면이 토스트)', async (_label, error) => {
    mockSdk.login.mockRejectedValue(error);
    await expect(kakao.startKakaoLogin()).rejects.toBe(error);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('동시에 두 번 눌러도 SDK 초기화는 한 번', async () => {
    mockSdk.login.mockResolvedValue({ accessToken: 'kakao-at' });
    fetchMock.mockImplementation(async () => reply(200, TOKENS));
    await Promise.all([kakao.startKakaoLogin(), kakao.startKakaoLogin()]);
    expect(mockSdk.initializeKakaoSDK).toHaveBeenCalledTimes(1);
  });

  it('서버 응답에 다른 값이 더 와도 토큰 두 개만 저장해요', async () => {
    mockSdk.login.mockResolvedValue({ accessToken: 'kakao-at' });
    fetchMock.mockResolvedValue(reply(200, { ...TOKENS, inquiryBranchCode: 'HANAM', inquiryCandidateId: 9 }));
    await kakao.startKakaoLogin();
    expect(tokenStorage.get()).toEqual(TOKENS);
  });

  it('서버가 거절하면(다른 앱 토큰 등 401) 토큰을 저장하지 않고 서버 문구로 실패해요', async () => {
    mockSdk.login.mockResolvedValue({ accessToken: 'kakao-at' });
    fetchMock.mockResolvedValue(reply(401, { error: 'invalid_token', message: '인증이 만료되었습니다' }));
    await expect(kakao.startKakaoLogin()).rejects.toMatchObject({ status: 401, code: 'invalid_token' });
    expect(tokenStorage.get()).toBeNull();
  });

  it('네이티브 앱 키가 없으면 SDK 를 부르지 않고 설정 안내 오류', async () => {
    mockKakaoKeys.nativeAppKey = '';
    await expect(kakao.startKakaoLogin()).rejects.toThrow('EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY');
    expect(mockSdk.initializeKakaoSDK).not.toHaveBeenCalled();
    expect(mockSdk.login).not.toHaveBeenCalled();
  });

  it('SDK 초기화가 실패하면 다음 시도에서 다시 초기화해요', async () => {
    mockSdk.initializeKakaoSDK.mockRejectedValueOnce(new Error('init failed'));
    mockSdk.login.mockResolvedValue({ accessToken: 'kakao-at' });
    fetchMock.mockResolvedValue(reply(200, TOKENS));
    await expect(kakao.startKakaoLogin()).rejects.toThrow('init failed');
    await expect(kakao.startKakaoLogin()).resolves.toBe('done');
    expect(mockSdk.initializeKakaoSDK).toHaveBeenCalledTimes(2);
  });
});

describe('웹: 카카오 웹 로그인 (kakao-login.web.ts)', () => {
  const AUTHORIZE =
    'https://kauth.kakao.com/oauth/authorize?client_id=rest-key&redirect_uri=http%3A%2F%2Flocalhost%3A8081%2Fauth%2Fkakao%2Fcallback&response_type=code';
  // 테스트는 폰(ios) 환경이라 웹 파일을 직접 불러요. 브라우저 주소 이동만 대역
  const assign = jest.fn();
  let web: typeof KakaoLogin;
  const g = globalThis as { window?: unknown };
  const realWindow = g.window;
  beforeEach(() => {
    assign.mockReset();
    g.window = { location: { assign } };
    web = jest.requireActual<typeof KakaoLogin>('../kakao-login.web');
  });
  afterEach(() => {
    g.window = realWindow;
  });

  it('인가 주소 = REST API 키 + 콜백 주소(인코딩)', () => {
    const { kakaoAuthorizeUrl } = jest.requireActual<typeof import('../kakao-config')>('../kakao-config');
    expect(kakaoAuthorizeUrl('rest-key', 'http://localhost:8081/auth/kakao/callback')).toBe(AUTHORIZE);
  });

  it('카카오 인가 페이지로 넘어가고 redirected · 서버 · SDK 는 부르지 않아요', async () => {
    await expect(web.startKakaoLogin()).resolves.toBe('redirected');
    expect(assign).toHaveBeenCalledWith(AUTHORIZE);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mockSdk.login).not.toHaveBeenCalled();
  });

  it.each([['restApiKey'], ['redirectUri']] as const)('%s 가 비면 이동하지 않고 설정 안내 오류', async (key) => {
    mockKakaoKeys[key] = '';
    await expect(web.startKakaoLogin()).rejects.toThrow('카카오 웹 로그인 설정이 없어요');
    expect(assign).not.toHaveBeenCalled();
  });

  it('mock 모드면 이동 없이 가짜 로그인 (서버 · 카카오 안 부름)', async () => {
    mockApiConfig.useMock = true;
    mockKakaoKeys.restApiKey = '';
    await expect(web.startKakaoLogin()).resolves.toBe('done');
    expect(assign).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(tokenStorage.get()).toEqual({ accessToken: 'mock-kakao', refreshToken: 'mock-refresh' });
  });
});

describe('mock 모드 (폰)', () => {
  it('키가 없어도 SDK · 서버 없이 가짜 로그인', async () => {
    mockApiConfig.useMock = true;
    mockKakaoKeys.nativeAppKey = '';
    await expect(kakao.startKakaoLogin()).resolves.toBe('done');
    expect(mockSdk.initializeKakaoSDK).not.toHaveBeenCalled();
    expect(mockSdk.login).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(tokenStorage.get()).toEqual({ accessToken: 'mock-kakao', refreshToken: 'mock-refresh' });
  });
});
