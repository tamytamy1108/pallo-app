/**
 * 앱 푸시 (Firebase Cloud Messaging) — 폰 (iOS · Android). 웹 미리보기는 push.web.ts (푸시 없음).
 *
 * 권한 요청 · FCM 토큰 받기 · 토큰 갱신 · 앱이 켜져 있을 때 / 꺼져 있을 때 받기. 서버 등록은 api/push-registration.ts 가 해요.
 *
 * 네이티브 모듈이라 Expo Go 에선 안 돼요 — 개발 빌드가 필요해요(이 앱은 카카오 등으로 이미 개발 빌드만 써요).
 * app.config.js 가 Firebase 설정 파일(google-services.json · GoogleService-Info.plist)이 있을 때만 플러그인을 붙이고
 * extra.push.enabled 를 켜요. 꺼져 있으면 아래 함수는 모두 아무것도 안 해요 (mock 개발 · 파일 없는 빌드).
 * 자동 테스트(jest)는 네이티브 모듈이 없어 __mocks__/@react-native-firebase/messaging.ts 대역을 써요.
 * iOS 는 실기기에서만 푸시를 받아요 (시뮬레이터 X). Firebase 콘솔에 APNs 키(.p8)를 올려야 해요.
 */
import Constants from 'expo-constants';
import { PermissionsAndroid, Platform } from 'react-native';
import {
  AuthorizationStatus,
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  requestPermission,
  setBackgroundMessageHandler,
  type RemoteMessage,
} from '@react-native-firebase/messaging';

export type PushMessage = RemoteMessage;

/** Firebase 가 붙은 빌드인지 (app.config.js 가 설정 파일이 있을 때 켜요) */
export const pushEnabled = (Constants.expoConfig?.extra as { push?: { enabled?: boolean } } | undefined)?.push?.enabled === true;

/**
 * 알림 권한을 물어봐요. 허용(iOS 임시 허용 포함)이면 true.
 * Android 13+ 는 POST_NOTIFICATIONS 를 따로 물어봐야 해요 (12 이하는 설치 때 자동 허용).
 */
export async function requestPushPermission(): Promise<boolean> {
  if (!pushEnabled) return false;
  if (Platform.OS === 'android') {
    if (Platform.Version < 33) return true;
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }
  const status = await requestPermission(getMessaging());
  return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;
}

/** 이 기기의 FCM 토큰 — 서버가 이 기기로 푸시를 보낼 때 쓰는 주소예요. 꺼져 있으면 null. */
export async function getPushToken(): Promise<string | null> {
  if (!pushEnabled) return null;
  return getToken(getMessaging());
}

/** 토큰이 바뀌면 알려줘요 (앱 재설치 · 데이터 삭제 등). 돌려준 함수로 그만 들어요. */
export function onPushTokenRefresh(listener: (token: string) => void): () => void {
  if (!pushEnabled) return () => {};
  return onTokenRefresh(getMessaging(), listener);
}

/**
 * 앱이 켜져 있을 때 온 푸시 — 이때는 OS 가 알림을 띄우지 않아요. 화면에서 직접 보여줄지 정해요.
 * 돌려준 함수로 그만 들어요.
 */
export function onForegroundPush(listener: (message: PushMessage) => void): () => void {
  if (!pushEnabled) return () => {};
  return onMessage(getMessaging(), listener);
}

/**
 * 앱이 뒤에 있거나 꺼져 있을 때 온 푸시 — 알림(notification) 푸시는 OS 가 띄우고, 여기선 data 만 처리해요.
 * 화면이 뜨기 전에 등록돼야 해서 앱 시작 파일(index.js → lib/push-background.ts)에서 불러요.
 */
export function registerBackgroundPushHandler() {
  if (!pushEnabled) return;
  setBackgroundMessageHandler(getMessaging(), async () => {
    // 아직 할 일 없음 — 배지 숫자 · 데이터 동기화가 생기면 여기서.
  });
}
