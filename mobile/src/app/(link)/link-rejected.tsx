import { router } from 'expo-router';
import { Stack } from 'expo-router/js-stack';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from '@/components/ui/safe-area';

import { Appear } from '@/components/ui/appear';
import { Button } from '@/components/ui/button';
import { Pressable } from '@/components/ui/pressable';
import { Raised } from '@/components/ui/raised';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { TopBar } from '@/components/ui/top-bar';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { sfx } from '@/lib/feedback';
import { SCREEN } from '@/lib/transitions';
import { BRANCH_TEL_MOCK, restartLinkRequest, useLinkEvents } from '@/state/link-events';
import { useMe } from '@/state/me';
import { updateOnboarding, useOnboarding } from '@/state/onboarding';

/**
 * 지점 연동 안 됨 (09-onboarding '연동 안 됨 (rejected)' · 프로토타입 onboarding-options.html #m-fail).
 * 지점이 '못 찾음'으로 처리하면 푸시 · 알림 → 이 화면.
 * ? 상자 · '○○점에서 회원 정보를 찾지 못했어요' · 지점에서 남긴 말 · 보낸 정보
 * → [고쳐서 다시 요청하기] [○○점에 전화하기] · '지금은 둘러볼게요'(홈).
 */
export default function LinkRejectedScreen() {
  const me = useMe();
  const sent = useOnboarding();
  const note = useLinkEvents((s) => s.note);
  // 가입에서 고른 지점이 없으면(개발용 ?link= 로 들어온 경우) 내 지점
  const branch = sent.branch || me.branch;

  const retry = () => {
    // 연동 요청 화면(onboarding/link)은 보내면 기다리는 화면 → 시작하기(useCompleteOnboarding)로 이어져요.
    // 그 화면을 지금 다른 사람이 고치는 중이라, 여기서 미리 '확인 중'으로 되돌리고 지점 회원 길로 맞춰 둬요
    restartLinkRequest();
    updateOnboarding({ path: 'member', branch });
    router.push('/onboarding/link');
  };
  const call = () => {
    Linking.openURL(`tel:${BRANCH_TEL_MOCK.replace(/-/g, '')}`).catch(() => showToast(`${branch} ${BRANCH_TEL_MOCK}`));
  };
  const browse = () => {
    sfx('soft');
    if (router.canDismiss()) router.dismissAll();
    router.navigate('/');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Stack.Screen options={SCREEN.push} />
      <TopBar fallback="/" />
      <ScrollView contentContainerStyle={styles.body}>
        <Appear kind="rise" style={styles.iconRow}>
          <Raised radius={24}>
            <View style={styles.icon}>
              <PText style={styles.q}>?</PText>
            </View>
          </Raised>
        </Appear>
        <Appear kind="rise" delay={40}>
          <PText style={styles.title} accessibilityRole="header">
            {branch}에서 회원 정보를{'\n'}찾지 못했어요
          </PText>
        </Appear>
        <Appear kind="rise" delay={80} style={styles.note}>
          <PText style={styles.noteLabel} color={Colors.inkSub}>
            지점에서 남긴 말
          </PText>
          <PText style={styles.noteText}>{note}</PText>
        </Appear>
        <Appear kind="rise" delay={100}>
          <PText style={styles.sent} color={Colors.inkSub}>
            보낸 정보: {[branch, sent.realName, sent.phone].filter(Boolean).join(' · ')}
          </PText>
        </Appear>
      </ScrollView>

      <View style={styles.foot}>
        <Button label="고쳐서 다시 요청하기" wide onPress={retry} />
        <Button label={`${branch}에 전화하기`} variant="secondary" wide onPress={call} />
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
  iconRow: { alignItems: 'center', marginTop: 6 },
  icon: { width: 76, height: 76, borderRadius: 24, borderWidth: 2, borderColor: Colors.ink, backgroundColor: '#FCE3EA', alignItems: 'center', justifyContent: 'center' },
  q: { fontFamily: Font.display, fontSize: 30, lineHeight: 36 },
  title: { marginTop: 18, textAlign: 'center', fontFamily: Font.body900, fontSize: 22, lineHeight: 29, letterSpacing: -0.6 },
  note: { marginTop: 18, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  noteLabel: { fontFamily: Font.body900, fontSize: 11, lineHeight: 15 },
  noteText: { marginTop: 4, fontFamily: Font.body800, fontSize: 13.5, lineHeight: 20 },
  sent: { marginTop: 12, fontFamily: Font.body600, fontSize: 12.5, lineHeight: 19 },
  foot: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 12, gap: 12 },
  linkWrap: { alignSelf: 'center', minHeight: 40, justifyContent: 'center' },
  link: { fontFamily: Font.body800, fontSize: 13, lineHeight: 18, textDecorationLine: 'underline' },
  linkPressed: { opacity: 0.6 },
});
