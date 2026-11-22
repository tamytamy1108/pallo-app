import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { TrialGuideHost } from '@/components/common/trial-guide';
import { ToastHost } from '@/components/ui/toast';
import { FontAssets } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

/**
 * 가장 바깥 틀: 글꼴을 다 불러온 뒤 화면을 보여 줘요. 탭 화면 위로 다른 화면이 쌓여요(Stack).
 * 새 화면은 src/app 에 파일만 만들면 저절로 등록돼요. 화면별 옵션(아래에서 올라오기 등)은 그 화면 파일 안에서 <Stack.Screen options /> 로 정해요.
 */
export default function RootLayout() {
  const [loaded, error] = useFonts(FontAssets);

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.cream } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="design" />
        <Stack.Screen name="notice/[id]" />
        {/* 레슨은 아래에서 올라오는 전체 화면 (탭 바 없이) */}
        <Stack.Screen name="lesson/[step]" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
      </Stack>
      {/* 어디서든 부르는 공통 창: 토스트 · 비회원 체험 안내 */}
      <TrialGuideHost />
      <ToastHost />
    </>
  );
}
