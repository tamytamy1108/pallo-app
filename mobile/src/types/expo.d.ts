/**
 * Expo 타입 불러오기 — `expo start` 가 만드는 expo-env.d.ts(깃에 안 올라감)와 같은 내용.
 * 이게 없으면 새로 받은 저장소(백엔드 개발자 · CI)에서 dev 서버를 켜기 전엔 tsc 가
 * Reanimated CSS 애니메이션 스타일(animationName …)을 몰라 오류를 내요.
 */
/// <reference types="expo/types" />
