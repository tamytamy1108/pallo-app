import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Pressable } from '@/components/ui/pressable';
import { Raised } from '@/components/ui/raised';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import type { LoginProvider } from '@/data/auth';
import { sfx } from '@/lib/feedback';

/*
 * 소셜 로그인 버튼 — PALLO 버튼 모양(잉크 2px · 알약 · 4px 그림자)에 각 회사 색 · 로고.
 * 카카오 #FEE500 · 검은 말풍선 / Apple 검정 · 흰 사과 (iOS 는 다른 소셜 로그인이 있으면 Apple 이 꼭 있어야 해요) / Google 흰색 · 4색 G.
 * 프로토타입에 없는 화면이라 모양은 프로토타입에서 확정해야 해요.
 */

const LOOK: Record<LoginProvider, { label: string; bg: string; ink: string }> = {
  kakao: { label: '카카오로 시작하기', bg: '#FEE500', ink: 'rgba(0,0,0,0.85)' },
  apple: { label: 'Apple로 계속하기', bg: '#000000', ink: Colors.white },
  google: { label: 'Google로 계속하기', bg: Colors.white, ink: Colors.ink },
};

export function SocialButton({ provider, onPress, disabled = false }: { provider: LoginProvider; onPress: () => void; disabled?: boolean }) {
  const look = LOOK[provider];
  return (
    <Pressable
      onPress={() => {
        sfx('big');
        onPress();
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={look.label}
      accessibilityState={{ disabled }}
      style={styles.wrap}>
      {({ pressed }) => (
        <Raised radius={27} pressed={pressed} style={styles.wrap}>
          <View style={[styles.btn, { backgroundColor: look.bg }, disabled && styles.dim]}>
            <View style={styles.logo}>
              <Logo provider={provider} />
            </View>
            <PText color={look.ink} style={styles.label}>
              {look.label}
            </PText>
            <View style={styles.logo} />
          </View>
        </Raised>
      )}
    </Pressable>
  );
}

function Logo({ provider }: { provider: LoginProvider }) {
  if (provider === 'kakao')
    return (
      <Svg width={20} height={20} viewBox="0 0 24 24">
        <Path fill="#000000" d="M12 3C6.48 3 2 6.48 2 10.8c0 2.8 1.88 5.25 4.7 6.64-.2.74-.74 2.68-.85 3.09-.13.51.19.5.4.37.16-.11 2.6-1.77 3.65-2.49.68.1 1.38.15 2.1.15 5.52 0 10-3.48 10-7.76C22 6.48 17.52 3 12 3z" />
      </Svg>
    );
  if (provider === 'apple')
    return (
      <Svg width={19} height={19} viewBox="0 0 24 24">
        <Path
          fill="#FFFFFF"
          d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
        />
      </Svg>
    );
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      <Path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
      <Path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <Path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
      <Path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch' },
  btn: { height: 54, borderRadius: 27, borderWidth: 2, borderColor: Colors.ink, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  dim: { opacity: 0.5 },
  logo: { width: 24, alignItems: 'center' },
  label: { flex: 1, textAlign: 'center', fontFamily: Font.body900, fontSize: 16, lineHeight: 22 },
});
