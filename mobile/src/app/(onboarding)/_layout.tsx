import { Stack } from 'expo-router/js-stack';

import { STACK_OPTIONS } from '@/lib/transitions';

/** 로그인했지만 가입 과정을 안 끝낸 사람만 (app/_layout.tsx 의 Stack.Protected). 들어오면 약관부터 */
export const unstable_settings = { initialRouteName: 'onboarding/terms' };

export default function OnboardingLayout() {
  return <Stack screenOptions={STACK_OPTIONS} />;
}
