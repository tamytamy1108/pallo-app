import { Stack } from 'expo-router/js-stack';

import { STACK_OPTIONS } from '@/lib/transitions';

/**
 * 지점 연동 요청 · 기다림 · 거절 — 로그인만 했으면 열려요 (app/_layout.tsx 의 Stack.Protected).
 * 가입 중(회원 길)에도, 가입을 마친 뒤 홈 · 마이에서도 열어요.
 */
export default function LinkLayout() {
  return <Stack screenOptions={STACK_OPTIONS} />;
}
