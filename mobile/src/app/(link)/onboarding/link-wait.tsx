import { router } from 'expo-router';
import { Stack } from 'expo-router/js-stack';
import { useCallback, useEffect, useState } from 'react';
import { BackHandler, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from '@/components/ui/safe-area';

import { apiErrorMessage } from '@/api/errors';
import { useCompleteOnboarding } from '@/api/session';
import { LinkTracker, type LinkStep } from '@/components/onboarding/link-tracker';
import { NextButton } from '@/components/onboarding/parts';
import { MyPalloro } from '@/components/onboarding/start-palloro';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { useOnboarding } from '@/state/onboarding';


/** 요청 보낸 시각 'HH:mm' (이 화면에 들어온 때) */
const nowHHMM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/**
 * 가입 · 지점 회원: 지점에서 확인 중 (프로토타입 onboarding-options.html #m-wait). 진행 바 없음.
 * 내 팔로로 · '○○점에 연동을 요청했어요!' · 한 줄 설명 · 세로 진행 표시 3칸 · 아래 노란 `시작하기` → 앱 홈 (useCompleteOnboarding).
 * 요청 취소 · 지점 전화 · '기다리는 동안…' 안내는 두지 않아요 (docs/pages/09-onboarding.md 상태 표).
 *
 * 뒤로: 요청은 이미 보냈으니 양식으로 돌아가지 않아요. 뒤로 버튼은 없고, 밀어서 뒤로 가기는 막고,
 * 안드로이드 뒤로 키는 `시작하기`와 같이 홈으로 가요.
 */
export default function LinkWaitScreen() {
  const branch = useOnboarding((s) => s.branch) || '지점';
  const [sentAt] = useState(nowHHMM);
  const { mutate: complete } = useCompleteOnboarding();
  // 가입을 끝냈다고 표시하고 홈으로. 이 화면은 (link) 묶음이라 가입이 끝나도 저절로 닫히지 않아서 직접 홈으로 가요
  const start = useCallback(
    () =>
      complete(undefined, {
        onSuccess: () => {
          if (router.canDismiss()) router.dismissAll();
          router.replace('/');
        },
        onError: (e) => showToast(apiErrorMessage(e)),
      }),
    [complete],
  );

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      start();
      return true;
    });
    return () => sub.remove();
  }, [start]);

  const steps: LinkStep[] = [
    { label: '요청 보냄', sub: `오늘 ${sentAt}`, state: 'done' },
    { label: '지점에서 확인 중', sub: branch, state: 'now' },
    { label: '연동 완료', sub: '회원 기능이 열려요', state: 'todo' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.hero} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {/* 캐릭터 고르기에서 고른 내 팔로로가 둥실 떠서 기다려요 */}
          <MyPalloro width={180} bob />
        </View>
        <PText style={styles.title} accessibilityRole="header">
          {`${branch}에 연동을\n요청했어요!`}
        </PText>
        <PText style={styles.desc}>끝나면 알림으로 알려 드려요.</PText>
        <LinkTracker steps={steps} />
      </ScrollView>
      <View style={styles.footer}>
        <NextButton label="시작하기" onPress={start} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  flex: { flex: 1 },
  // 뒤로 버튼 줄(56) 자리는 비워 두고 같은 높이에서 시작해요 (프로토타입 height:44px)
  body: { flexGrow: 1, paddingTop: 56, paddingHorizontal: 22, paddingBottom: 24 },
  hero: { width: 180, height: 132, alignSelf: 'center' },
  // 말풍선은 팔로로 오른쪽 위 (머리 옆)
  title: { marginTop: 10, textAlign: 'center', fontFamily: Font.body900, fontSize: 26, lineHeight: 34, letterSpacing: -0.8 },
  desc: { marginTop: 6, textAlign: 'center', fontFamily: Font.body600, fontSize: 14, lineHeight: 21, color: Colors.inkSub },
  footer: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 12 },
});
