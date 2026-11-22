import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AccountPage, Box, Head, TextLink } from '@/components/account/parts';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { APP_VERSION, OSS_LICENSES } from '@/data/account';
import { sfx } from '@/lib/feedback';

/** 설정 › 앱 버전 (프로토타입 verHTML): 지금 버전 · 최신 여부(다시 확인) · 업데이트 · 새 기능 · 오픈소스 라이선스 */
export default function VersionScreen() {
  const [oss, setOss] = useState(false);
  const up = APP_VERSION.now !== APP_VERSION.latest;
  return (
    <AccountPage title="앱 버전" bodyStyle={styles.body}>
      <View style={styles.hero}>
        <Image source={require('@/assets/characters/c-upright-yellow.png')} style={styles.img} contentFit="contain" accessibilityIgnoresInvertColors />
        <PText style={styles.brand}>PALLO</PText>
        <PText style={styles.now}>{`지금 버전 ${APP_VERSION.now}`}</PText>
        <PText style={styles.state}>{up ? `새 버전 ${APP_VERSION.latest}이 있어요` : '최신 버전이에요'}</PText>
        {up ? (
          <View style={styles.upBtn}>
            <Button label="업데이트" onPress={() => showToast('앱스토어로 이동해요')} />
          </View>
        ) : (
          <TextLink label="다시 확인" onPress={() => showToast(`최신 버전이에요 · ${APP_VERSION.now}`)} style={styles.check} />
        )}
      </View>
      <Head>새 기능</Head>
      <Box style={styles.log}>
        {APP_VERSION.notes.map(([v, t]) => (
          <View key={v} style={styles.logRow}>
            <PText style={styles.d}>{v}</PText>
            <PText style={styles.t}>{t}</PText>
          </View>
        ))}
      </Box>
      <View style={styles.gap} />
      <Box style={styles.go}>
        <Pressable
          onPress={() => {
            sfx('tap');
            setOss(true);
          }}
          accessibilityRole="button"
          style={styles.goRow}>
          <PText style={styles.goB}>오픈소스 라이선스</PText>
          <PText style={styles.chev}>›</PText>
        </Pressable>
      </Box>
      <Sheet open={oss} onClose={() => setOss(false)} title="오픈소스 라이선스">
        {OSS_LICENSES.map(([n, l]) => (
          <View key={n} style={styles.oss}>
            <PText style={styles.goB}>{n}</PText>
            <PText style={styles.ossS}>{l}</PText>
          </View>
        ))}
      </Sheet>
    </AccountPage>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: 0, paddingBottom: 40 },
  hero: { alignItems: 'center', paddingTop: 24, paddingBottom: 4 },
  img: { width: 96, height: 62 },
  brand: { marginTop: 10, fontFamily: Font.display, fontSize: 22, lineHeight: 26 },
  now: { marginTop: 2, fontFamily: Font.body700, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
  state: { marginTop: 8, fontFamily: Font.body900, fontSize: 14, lineHeight: 20, color: Colors.purple },
  upBtn: { marginTop: 10 },
  check: { alignSelf: 'center', marginTop: 8 },
  log: { paddingVertical: 2, paddingHorizontal: 14 },
  logRow: { flexDirection: 'row', gap: 12, paddingVertical: 14, alignItems: 'center' },
  d: { width: 64, fontFamily: Font.body700, fontSize: 13.5, lineHeight: 20, color: Colors.inkSub },
  t: { flex: 1, fontFamily: Font.body800, fontSize: 13.5, lineHeight: 20 },
  gap: { height: 12 },
  go: { paddingVertical: 2, paddingHorizontal: 14 },
  goRow: { flexDirection: 'row', alignItems: 'center', minHeight: 48 },
  goB: { flex: 1, fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  chev: { fontFamily: Font.body900, fontSize: 15, color: Colors.inkSub },
  oss: { paddingVertical: 10, borderBottomWidth: 1.5, borderColor: Colors.line },
  ossS: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
});
