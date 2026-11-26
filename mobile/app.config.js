const fs = require('fs');
const path = require('path');

/**
 * app.json 을 그대로 쓰고, 키 · 파일이 있을 때만 네이티브 설정 플러그인을 붙여요. 없으면 플러그인이 빌드를 멈추게 해서,
 * 키 없이도 웹 미리보기 · mock 개발은 그대로 되게 했어요. 바꾼 뒤엔 개발 빌드를 다시 만들어야 해요.
 *
 * - 카카오: .env.local 의 EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY 가 있을 때 @react-native-kakao/core
 *   (카카오톡 앱으로 갔다 돌아오는 URL scheme 등).
 * - Firebase(앱 푸시 · FCM): google-services.json(Android) · GoogleService-Info.plist(iOS) 가 있을 때
 *   @react-native-firebase/app. 파일은 Firebase 콘솔에서 com.academy.pallo 앱으로 받아 이 폴더에 두거나,
 *   EAS 빌드에선 파일 환경변수(GOOGLE_SERVICES_JSON · GOOGLE_SERVICE_INFO_PLIST)로 경로를 넘겨요. 저장소엔 올리지 않아요.
 */
const resolveFile = (envName, fallback) => {
  const p = process.env[envName] ?? path.resolve(process.cwd(), fallback);
  return fs.existsSync(p) ? p : null;
};

const withKakao = (config) => {
  const nativeAppKey = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY;
  if (!nativeAppKey) return config;
  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      ['@react-native-kakao/core', { nativeAppKey, android: { authCodeHandlerActivity: true }, ios: { handleKakaoOpenUrl: true } }],
    ],
  };
};

const withFirebase = (config) => {
  const androidFile = resolveFile('GOOGLE_SERVICES_JSON', 'google-services.json');
  const iosFile = resolveFile('GOOGLE_SERVICE_INFO_PLIST', 'GoogleService-Info.plist');
  if (!androidFile && !iosFile) return config;
  if (!androidFile || !iosFile) {
    // 한쪽만 있으면 다른 플랫폼 prebuild 가 깨져요 — 조용히 넘어가지 않고 알려요.
    console.warn('[firebase] google-services.json · GoogleService-Info.plist 중 하나만 있어요. 둘 다 둬야 푸시가 켜져요.');
    return config;
  }
  return {
    ...config,
    ios: {
      ...config.ios,
      googleServicesFile: iosFile,
      // SDK 51 부터 자동으로 안 붙어요 — 원격 알림 수신 권한 · 백그라운드 수신.
      entitlements: { ...config.ios?.entitlements, 'aps-environment': 'production' },
      infoPlist: {
        ...config.ios?.infoPlist,
        UIBackgroundModes: [...new Set([...(config.ios?.infoPlist?.UIBackgroundModes ?? []), 'remote-notification'])],
      },
    },
    android: { ...config.android, googleServicesFile: androidFile },
    // 앱 코드(src/lib/push.ts)가 이 값을 보고 Firebase 를 불러요 — 네이티브 모듈이 없는 빌드에서 부르면 앱이 죽어요.
    extra: { ...config.extra, push: { enabled: true } },
    plugins: [
      ...(config.plugins ?? []),
      '@react-native-firebase/app',
      '@react-native-firebase/messaging',
      // RN Firebase 는 iOS 에서 dynamic framework 만 지원해요(static 이면 pod install 이 깨짐).
      ['expo-build-properties', { ios: { useFrameworks: 'dynamic' } }],
    ],
  };
};

module.exports = ({ config }) => withFirebase(withKakao(config));
