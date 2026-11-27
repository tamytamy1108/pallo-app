import { router } from 'expo-router';
import { Stack } from 'expo-router/js-stack';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from '@/components/ui/safe-area';

import { Appear } from '@/components/ui/appear';
import { Button } from '@/components/ui/button';
import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { TopBar } from '@/components/ui/top-bar';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { sfx } from '@/lib/feedback';
import { SCREEN } from '@/lib/transitions';
import { useLinkEvents } from '@/state/link-events';
import { useMe } from '@/state/me';
import { updateOnboarding, useOnboarding } from '@/state/onboarding';

/**
 * 지점 연동 안 됨 (09-onboarding '연동 안 됨 (rejected)' · 프로토타입 onboarding-options.html #m-fail).
 * 지점이 '못 찾음'으로 처리하면 푸시 · 알림 → 이 화면.
 * '○○점에서 연동 승인이 반려되었습니다.' · 지점에서 남긴 말
 * → [다시 요청하기] · '지금은 둘러볼게요'(홈).
 */
export default function LinkRejectedScreen() {
  const me = useMe();
  const sent = useOnboarding();
  const note = useLinkEvents((s) => s.note);
  // 가입에서 고른 지점이 없으면(개발용 ?link= 로 들어온 경우) 내 지점
  const branch = sent.branch || me.branch;

  const retry = () => {
    // 연동 요청 화면(onboarding/link)이 보내면 서버 요약에 대기 한 건 → 홈 · 마이가 '확인 중'으로 바뀌어요 (useCreateLinkRequest). 여기선 지점 회원 길로 맞춰 둬요
    // 지점 code 는 가입에서 고른 값 — 없으면(개발용 ?link=) 이름으로 (가짜 서버는 code = 이름)
    updateOnboarding({ path: 'member', branch, branchCode: sent.branchCode || branch });
    router.push('/onboarding/link');
  };
  const browse = () => {
    sfx('soft');
    if (router.canDismiss()) router.dismissAll();
    router.navigate('/home');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Stack.Screen options={SCREEN.push} />
      <TopBar fallback="/home" />
      <ScrollView contentContainerStyle={styles.body}>
        <Appear kind="rise" delay={40}>
          <PText style={styles.title} accessibilityRole="header">
            {branch}에서{'\n'}연동 승인이 반려되었습니다.
          </PText>
        </Appear>
        <Appear kind="rise" delay={80} style={styles.note}>
          <PText style={styles.noteLabel} color={Colors.inkSub}>
            지점에서 남긴 말
          </PText>
          <PText style={styles.noteText}>{note}</PText>
        </Appear>
      </ScrollView>

      <View style={styles.foot}>
        <Button label="다시 요청하기" wide onPress={retry} />
        <Pressable onPress={browse} sound={false} accessibilityRole="link" accessibilityLabel="지금은 둘러볼게요" hitSlop={8} style={styles.linkWrap}>
          {({ pressed }) => (
            <PText style={[styles.link, pressed && styles.linkPressed]} color={Colors.inkSub}>
              지금은 둘러볼게요
            </PText>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  body: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 24 },
  title: { marginTop: 24, textAlign: 'center', fontFamily: Font.body900, fontSize: 22, lineHeight: 29, letterSpacing: -0.6 },
  note: { marginTop: 18, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  noteLabel: { fontFamily: Font.body900, fontSize: 11, lineHeight: 15 },
  noteText: { marginTop: 4, fontFamily: Font.body800, fontSize: 13.5, lineHeight: 20 },
  foot: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 12, gap: 12 },
  linkWrap: { alignSelf: 'center', minHeight: 40, justifyContent: 'center' },
  link: { fontFamily: Font.body800, fontSize: 13, lineHeight: 18, textDecorationLine: 'underline' },
  linkPressed: { opacity: 0.6 },
});
