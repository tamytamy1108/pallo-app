import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SocialButton } from '@/components/auth/social-buttons';
import { Logo } from '@/components/logo';
import { Appear } from '@/components/ui/appear';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { browseAsGuest, loginWith, type LoginProvider } from '@/data/auth';
import { sfx } from '@/lib/feedback';

/**
 * 로그인 (카카오 · Apple · Google · 휴대폰 번호 · 둘러보기).
 * 프로토타입에 로그인 화면이 없어서 DESIGN.md 토큰으로 만든 최소 화면이에요 — 프로토타입에서 먼저 확정해야 해요.
 * 지금은 가짜로 바로 성공해요 (data/auth.ts). 앱 첫 화면으로는 아직 안 붙였어요.
 */
export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState<LoginProvider | null>(null);

  const login = async (p: LoginProvider) => {
    if (busy) return;
    setBusy(p);
    await loginWith(p);
    setBusy(null);
    router.replace('/');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
      <Stack.Screen options={{ animation: 'fade', gestureEnabled: false }} />
      <View style={styles.hero}>
        <Appear kind="reactHop">
          <Image source={require('@/assets/characters/c-upright-yellow.png')} style={styles.char} contentFit="contain" accessible={false} />
        </Appear>
        <Logo width={200} />
      </View>
      <View style={styles.actions}>
        <SocialButton provider="kakao" disabled={!!busy} onPress={() => login('kakao')} />
        <SocialButton provider="apple" disabled={!!busy} onPress={() => login('apple')} />
        <SocialButton provider="google" disabled={!!busy} onPress={() => login('google')} />
        <View style={styles.links}>
          <TextLink label="휴대폰 번호로 시작하기" color={Colors.ink} onPress={() => router.push('/login/phone')} />
          <View style={styles.dot} />
          <TextLink
            label="먼저 둘러볼게요"
            color={Colors.inkSub}
            onPress={() => {
              browseAsGuest();
              router.replace('/');
            }}
          />
        </View>
      </View>
    </View>
  );
}

function TextLink({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        sfx('soft');
        onPress();
      }}
      accessibilityRole="button"
      hitSlop={10}
      style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
      <PText color={color} style={styles.linkText}>
        {label}
      </PText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20, backgroundColor: Colors.cream },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 },
  char: { width: 220, height: 220 * (306 / 480) },
  actions: { gap: 12 },
  links: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 6 },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: Colors.line },
  link: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  linkText: { fontFamily: Font.body800, fontSize: 14, lineHeight: 20 },
  pressed: { opacity: 0.6 },
});
