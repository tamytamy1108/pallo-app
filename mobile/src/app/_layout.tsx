import { useFonts } from 'expo-font';
import { Stack } from 'expo-router/js-stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { TrialGuideHost } from '@/components/common/trial-guide';
import { ToastHost } from '@/components/ui/toast';
import { FontAssets } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { CARD, SCREEN } from '@/lib/transitions';

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
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="dark" />
      {/* 화면 넘김은 프로토타입처럼 (src/lib/transitions.ts): 기본은 오른쪽에서 밀려 들어오기 */}
      <Stack screenOptions={{ headerShown: false, cardStyle: { ...CARD, backgroundColor: Colors.cream }, ...SCREEN.push }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="design" />
        <Stack.Screen name="notice/[id]" />
        {/* 레슨 · 듣기는 아래에서 올라와요 (탭 바 없이) */}
        <Stack.Screen name="lesson/[step]" options={SCREEN.rise} />
        <Stack.Screen name="lesson34/[step]" options={SCREEN.rise} />
        <Stack.Screen name="listening" options={SCREEN.rise} />
        <Stack.Screen name="login/index" options={SCREEN.fade} />
        <Stack.Screen name="story/[id]" options={SCREEN.fade} />
        {/* 뒤 화면 위에 시트 · 창만 겹쳐요 */}
        <Stack.Screen name="trial/index" options={SCREEN.overlay} />
        <Stack.Screen name="me/profile/[id]" options={SCREEN.overlay} />
        <Stack.Screen name="challenge/new" options={SCREEN.overlay} />
        <Stack.Screen name="compose" options={SCREEN.overlay} />
        <Stack.Screen name="club/new" options={SCREEN.overlayFade} />
        <Stack.Screen name="meet/new" options={SCREEN.overlayFade} />
        <Stack.Screen name="trip/[id]" options={SCREEN.overlay} />
        <Stack.Screen name="story/new" options={SCREEN.overlay} />
        <Stack.Screen name="events/propose" options={SCREEN.overlayFade} />
      </Stack>
      {/* 어디서든 부르는 공통 창: 토스트 · 비회원 체험 안내 */}
      <TrialGuideHost />
      <ToastHost />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: Colors.cream } });
