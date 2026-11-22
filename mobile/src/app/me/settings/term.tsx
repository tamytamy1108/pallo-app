import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AccountPage, TextLink } from '@/components/account/parts';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { TERMS } from '@/data/account';

/** 약관 본문 (프로토타입 termDHTML): 시행일 · 이전 버전 · 본문. 맞는 API: 95 `/terms/:id/versions` */
export default function TermScreen() {
  const { i } = useLocalSearchParams<{ i?: string }>();
  const [title, date, body] = TERMS[Number(i) || 0] ?? TERMS[0];
  return (
    <AccountPage title={title} bodyStyle={styles.body}>
      <View style={styles.meta}>
        <PText style={styles.s}>{`시행일 ${date} · `}</PText>
        <TextLink label="이전 버전" onPress={() => showToast('이전 버전 · 2025.03.01 시행본을 열어요')} style={styles.old} />
      </View>
      {body.map((p) => (
        <PText key={p} style={styles.p}>
          {p}
        </PText>
      ))}
    </AccountPage>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: 14, paddingHorizontal: 18 },
  meta: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  s: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
  old: { paddingVertical: 0 },
  p: { marginTop: 10, fontFamily: Font.body700, fontSize: 15, lineHeight: 25 },
});
