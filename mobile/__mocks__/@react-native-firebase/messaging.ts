/**
 * jest 대역 — 진짜 @react-native-firebase/messaging 은 불러오는 순간 네이티브 모듈을 찾아서 jest 에서 죽어요.
 * node_modules 옆 __mocks__ 라 jest 가 저절로 이걸 써요. 테스트는 jest.mocked(getToken).mockResolvedValue(...) 처럼 값을 정해요.
 */
export const AuthorizationStatus = { NOT_DETERMINED: -1, DENIED: 0, AUTHORIZED: 1, PROVISIONAL: 2, EPHEMERAL: 3 } as const;

export const getMessaging = jest.fn(() => ({}));
export const getToken = jest.fn(async () => 'mock-fcm-token');
export const requestPermission = jest.fn(async () => AuthorizationStatus.AUTHORIZED);
export const onTokenRefresh = jest.fn(() => () => {});
export const onMessage = jest.fn(() => () => {});
export const setBackgroundMessageHandler = jest.fn();
