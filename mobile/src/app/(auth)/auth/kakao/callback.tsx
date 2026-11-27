import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useKakaoCallback } from '@/api/use-kakao-login';
import { EmptyState, LoadingState } from '@/components/ui/state-view';
import { Colors } from '@/constants/theme';

/**
 * 카카오 웹 로그인 콜백 (웹 미리보기 테스트용 · 지점 QR 카카오싱크 퍼머링크). 카카오가 `?code=&state=` 를 붙여 보내면
 * 인가 코드로 로그인해요. 성공하면 로그인 상태가 바뀌어 이 화면은 저절로 닫히고 가입 과정 · 홈으로 가요.
 * 주소는 백엔드 `kakao.redirect-uri` · `EXPO_PUBLIC_KAKAO_REDIRECT_URI` 와 같아야 해요 (`/auth/kakao/callback`).
 */
export default function KakaoCallbackScreen() {
  const { error } = useKakaoCallback();
  return (
    <SafeAreaView style={styles.safe}>
      {error ? (
        <EmptyState title={error} link={{ label: '처음으로', onPress: () => router.replace('/') }} />
      ) : (
        <LoadingState />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, justifyContent: 'center', backgroundColor: Colors.cream },
});
