import { Stack } from 'expo-router/js-stack';

import { SCREEN, STACK_OPTIONS } from '@/lib/transitions';

/**
 * 로그인 · 가입까지 마친 사람의 화면 전부 (app/_layout.tsx 의 Stack.Protected). 탭 화면 위로 다른 화면이 쌓여요.
 * 새 화면은 이 폴더에 파일만 만들면 저절로 등록돼요. 화면별 옵션(아래에서 올라오기 등)은 여기나 그 화면 파일 안의 <Stack.Screen options /> 로 정해요.
 */
export const unstable_settings = { anchor: '(tabs)' };

export default function AppLayout() {
  return (
    <Stack screenOptions={STACK_OPTIONS}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="design" />
      <Stack.Screen name="notice/[id]" />
      {/* 레슨 · 듣기는 아래에서 올라와요 (탭 바 없이) */}
      <Stack.Screen name="lesson/[step]" options={SCREEN.rise} />
      <Stack.Screen name="lesson0/[step]" options={SCREEN.rise} />
      <Stack.Screen name="lesson34/[step]" options={SCREEN.rise} />
      <Stack.Screen name="listening" options={SCREEN.rise} />
      <Stack.Screen name="story/[id]" options={SCREEN.fade} />
      {/* 뒤 화면 위에 시트 · 창만 겹쳐요 */}
      <Stack.Screen name="me/profile/[id]" options={SCREEN.overlay} />
      <Stack.Screen name="challenge/new" options={SCREEN.overlay} />
      <Stack.Screen name="compose" options={SCREEN.overlay} />
      <Stack.Screen name="club/new" options={SCREEN.overlayFade} />
      <Stack.Screen name="meet/new" options={SCREEN.overlayFade} />
      <Stack.Screen name="trip/[id]" options={SCREEN.overlay} />
      {/* 스토리 올리기는 카메라부터 — 전체 화면 */}
      <Stack.Screen name="story/new" options={SCREEN.fade} />
      <Stack.Screen name="events/propose" options={SCREEN.overlayFade} />
    </Stack>
  );
}
