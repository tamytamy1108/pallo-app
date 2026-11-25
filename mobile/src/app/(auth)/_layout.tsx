import { Stack } from 'expo-router/js-stack';

import { SCREEN, STACK_OPTIONS } from '@/lib/transitions';

/** 로그인 전에만 열리는 화면 (app/_layout.tsx 의 Stack.Protected). 들어오면 첫 화면(YOUR FIRST STAGE)부터 */
export const unstable_settings = { anchor: 'welcome' };

export default function AuthLayout() {
  return (
    <Stack screenOptions={STACK_OPTIONS}>
      <Stack.Screen name="welcome" options={SCREEN.fade} />
      <Stack.Screen name="login/index" options={SCREEN.fade} />
      <Stack.Screen name="signup" options={SCREEN.push} />
    </Stack>
  );
}
