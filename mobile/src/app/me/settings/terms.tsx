import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { AccountPage } from '@/components/account/parts';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { TERMS } from '@/data/account';
import { sfx } from '@/lib/feedback';

/** 설정 › 약관 · 정책 4종 (프로토타입 termsHTML): 이름 · 시행일 → 본문. 맞는 API: 95 `/terms` */
export default function TermsScreen() {
  return (
    <AccountPage title="약관 · 정책" bodyStyle={styles.body}>
      {TERMS.map(([t, d], i) => (
        <Pressable
          key={t}
          onPress={() => {
            sfx('tap');
            router.push({ pathname: '/me/settings/term', params: { i: String(i) } });
          }}
          accessibilityRole="button"
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <View>
            <PText style={styles.b}>{t}</PText>
            <PText style={styles.s}>{`시행일 ${d}`}</PText>
          </View>
        </Pressable>
      ))}
    </AccountPage>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: 4 },
  pressed: { opacity: 0.7 },
  row: { gap: 3, paddingVertical: 16, borderBottomWidth: 1.5, borderColor: Colors.line },
  b: { fontFamily: Font.body900, fontSize: 15.5, lineHeight: 22 },
  s: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
});
