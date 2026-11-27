import { setAudioModeAsync } from 'expo-audio';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router/js-stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { apiErrorMessage } from '@/api/errors';
import { ApiProvider } from '@/api/provider';
import { ForegroundPushBanner } from '@/api/use-foreground-push';
import { useSession } from '@/api/session';
import { preloadAllAvatarArt, preloadMyAvatar } from '@/components/character/preload-art';
import { FLAT_MAPS } from '@/components/library/world/flat-maps';
import { TrialGuideHost } from '@/components/common/trial-guide';
import { SeeSheetHost } from '@/components/common/see-sheets';
import { DevNotch } from '@/components/dev-notch';
import { ErrorState } from '@/components/ui/state-view';
import { TightTopInsets } from '@/components/ui/safe-area';
import { PushBannerHost } from '@/components/ui/push-banner';
import { ToastHost } from '@/components/ui/toast';
import { RewardHost } from '@/components/my/reward-sheet';
import { FontAssets } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { SCREEN, STACK_OPTIONS } from '@/lib/transitions';
import { preloadSfx } from '@/lib/feedback';
import { blockWebImageDrag } from '@/lib/web-no-image-drag';
import { getMyAvatar } from '@/state/avatar';

SplashScreen.preventAutoHideAsync();
// 아이폰 무음 모드(옆 스위치)에서도 표현 듣기 · 효과음이 나와요 (게임 · 학습 앱처럼). 다른 앱 음악은 끊지 않아요
setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(() => {});
// 효과음 플레이어를 미리 만들어 둬요 — 버튼을 처음 누를 때도 소리가 바로 나게
preloadSfx();
// 웹: 사진을 마우스로 끌 때 브라우저 '사진 끌어다 놓기'가 사진 순서 바꾸기 · 위치 맞추기를 끊지 않게
blockWebImageDrag();


/**
 * 가장 바깥 틀: 글꼴과 로그인 상태가 정해진 뒤 화면을 보여 줘요.
 * 서버 데이터(TanStack Query) · 로그인 상태는 ApiProvider 가 감싸요 (src/api).
 */
export default function RootLayout() {
  return (
    <ApiProvider>
      <RootNavigator />
    </ApiProvider>
  );
}

/**
 * 로그인 상태(api/session.tsx)에 따라 열리는 화면 묶음 (그룹 폴더 — 주소에는 안 나와요).
 * - (auth)       로그인 전: 첫 화면 · 휴대폰 로그인. 로그인 없이 둘러보기는 없어요
 * - (onboarding) 로그인했지만 가입 과정을 안 끝냄
 * - (link)       로그인만 했으면: 지점 연동 요청 · 기다림 · 거절 (가입 중에도, 가입 뒤 홈에서도 열어요)
 * - (app)        가입까지 끝냄: 탭 · 나머지 화면 전부
 * 상태가 바뀌면(로그인 · 가입 끝 · 로그아웃 · 토큰 갱신 실패) 더는 열 수 없는 화면은 닫히고 열 수 있는 묶음으로 가요.
 * 새 화면은 알맞은 그룹 폴더에 파일만 만들면 그 그룹의 보호를 같이 받아요.
 */
function RootNavigator() {
  const session = useSession();
  const [loaded, fontError] = useFonts(FontAssets);
  // 내 캐릭터(프사) 그림을 스플래시 동안 읽어 둬요 — 첫 화면부터 조각조각 뜨지 않게 (최대 1.5초 · components/character/preload-art)
  const [artReady, setArtReady] = useState(false);
  useEffect(() => {
    let alive = true;
    // 라이브러리 지도 사진판도 같이 — 3D 가 그려지기 전에 같은 구도의 사진이 바로 보여야 해요 (빈 하늘색 칸이 안 보이게)
    void preloadMyAvatar(getMyAvatar(), 1500, Object.values(FLAT_MAPS).map((m) => m.img)).then(() => {
      if (alive) setArtReady(true);
      preloadAllAvatarArt();
    });
    return () => {
      alive = false;
    };
  }, []);
  const ready = (loaded || !!fontError) && artReady && session.status !== 'restoring';

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  const signedIn = session.status === 'signedIn';
  const onboarding = signedIn && session.needsOnboarding;
  // 지금 상태의 들어가는 화면. 막힌 화면을 열려고 하거나 상태가 바뀌어 지금 화면이 막히면 여기로 가요
  // (그룹 이름(/(auth) 등)으로 보내면 그룹에 index 화면이 없어 '없는 화면'이 떠서, 화면 주소를 직접 줘요)
  const entry = session.status === 'signedOut' ? '/' : onboarding ? '/onboarding/terms' : '/home';

  return (
    <GestureHandlerRootView style={styles.root}>
      <DevNotch>
        <TightTopInsets>
        <StatusBar style="dark" />
        {session.status === 'error' ? (
          // 토큰은 있는데 /me 를 못 받음 (인터넷 · 서버). 로그아웃시키지 않고 다시 시도하게 해요
          <View style={styles.root}>
            <ErrorState message={apiErrorMessage(session.error)} onRetry={session.retry} />
          </View>
        ) : (
          <Stack screenOptions={STACK_OPTIONS}>
            <Stack.Protected guard={session.status === 'signedOut'} redirectTo={entry}>
              <Stack.Screen name="(auth)" options={SCREEN.fade} />
            </Stack.Protected>
            <Stack.Protected guard={onboarding} redirectTo={entry}>
              <Stack.Screen name="(onboarding)" options={SCREEN.fade} />
            </Stack.Protected>
            <Stack.Protected guard={signedIn && !onboarding} redirectTo={entry}>
              <Stack.Screen name="(app)" options={SCREEN.fade} />
            </Stack.Protected>
            <Stack.Protected guard={signedIn} redirectTo={entry}>
              <Stack.Screen name="(link)" />
            </Stack.Protected>
          </Stack>
        )}
        {/* 어디서든 부르는 공통 창: 토스트 · 비회원 체험 안내 */}
        <TrialGuideHost />
        <ToastHost />
        {/* 푸시 배너 (지점 연동 결과 · 앱이 켜져 있을 때 온 푸시): 어느 화면에 있어도 위에서 내려와요 */}
        <PushBannerHost />
        <ForegroundPushBanner />
        {/* 시즌 보상을 자동으로 받았으면 한 번 뜨는 창 (로그인 · 온보딩 뒤에만) */}
        {signedIn && !onboarding ? <RewardHost /> : null}
        {/* 토스트 [보러가기] 목록 시트 (찜한 모임 · 찜한 챌린지 · 라운지 저장함 등): 보던 화면 위에 바로 떠요 (lib/see) */}
        {signedIn && !onboarding ? <SeeSheetHost /> : null}
        </TightTopInsets>
      </DevNotch>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: Colors.cream } });
