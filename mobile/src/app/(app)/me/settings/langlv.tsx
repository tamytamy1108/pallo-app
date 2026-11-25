import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { AccountPage, Box, ChoiceChip, Head, Icon } from '@/components/account/parts';
import { requestLevelChange, useLevelRequest, useSettings } from '@/components/account/store';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { LEVEL_TEST, MY_LEVEL, OTHER_LANGS } from '@/data/account';
import { sfx } from '@/lib/feedback';

const DIRS = ['한 단계 위로', '한 단계 아래로'];
const WHYS = ['수업이 쉬워요', '수업이 어려워요', '목표가 바뀌었어요'];

/**
 * 설정 › 학습 언어 · 레벨 (프로토타입 langlvHTML): 지금 언어 · 레벨 · 시작일 · 주차, 다른 언어 → 체험 신청,
 * 아래 [레벨 테스트 결과] · [레벨 변경 요청](방향 · 이유 → '요청됨'). 맞는 API: 46 `/me/level-change-requests`
 */
export default function LangLevelScreen() {
  const set = useSettings();
  const req = useLevelRequest();
  const [sheet, setSheet] = useState<null | 'test' | 'req'>(null);
  const [dir, setDir] = useState(DIRS[0]);
  const [why, setWhy] = useState(WHYS[0]);

  return (
    <AccountPage
      title="학습 언어 · 레벨"
      bodyStyle={styles.body}
      footer={[
        <Button key="t" label="레벨 테스트 결과" variant="secondary" wide onPress={() => setSheet('test')} />,
        <Button key="r" label="레벨 변경 요청" wide onPress={() => setSheet('req')} />,
      ]}>
      <Box style={styles.card}>
        <PText style={styles.small}>지금 배우는 중</PText>
        <View style={styles.big}>
          <PText style={styles.bigB}>{set.lang}</PText>
          <PText style={styles.bigS}>{MY_LEVEL.book}</PText>
        </View>
        <View style={styles.rowTop}>
          <PText style={styles.rowS}>{MY_LEVEL.since}</PText>
          <PText style={styles.rowB}>{MY_LEVEL.weeks}</PText>
        </View>
        {req ? (
          <View style={styles.hold}>
            <Icon name="clock" size={14} color={Colors.purple} />
            <PText style={styles.holdText}>{`레벨 변경 요청됨 · ${req} · 프로님 확인 중`}</PText>
          </View>
        ) : null}
      </Box>
      <Head>다른 언어도 배우기</Head>
      <Box style={styles.go}>
        {OTHER_LANGS.map(([l, d, code], i) => (
          <Pressable
            key={l}
            onPress={() => {
              sfx('tap');
              router.push(`/trial?lang=${code}` as Href);
            }}
            accessibilityRole="button"
            accessibilityLabel={`${l} 체험 신청`}
            style={({ pressed }) => [styles.goRow, i > 0 && styles.line, pressed && styles.pressed]}>
            <View style={styles.flex}>
              <PText style={styles.goB}>{l}</PText>
              <PText style={styles.goS}>{d}</PText>
            </View>
            <PText style={styles.goR}>체험 신청 ›</PText>
          </Pressable>
        ))}
      </Box>

      <Sheet open={sheet === 'test'} onClose={() => setSheet(null)} title="레벨 테스트 결과">
        <PText style={styles.ds}>{LEVEL_TEST.meta}</PText>
        <Box style={styles.sum}>
          {LEVEL_TEST.rows.map(([k, v]) => (
            <View key={k} style={styles.sumRow}>
              <PText style={styles.sumK}>{k}</PText>
              <PText style={styles.sumV}>{v}</PText>
            </View>
          ))}
        </Box>
      </Sheet>
      <Sheet
        open={sheet === 'req'}
        onClose={() => setSheet(null)}
        title="레벨 변경 요청"
        footer={
          <View>
            <Button
              label="요청하기"
              wide
              onPress={() => {
                requestLevelChange(`${dir} · ${why}`);
                setSheet(null);
                showToast('레벨 변경을 요청했어요 · 프로님이 확인하면 알려 드려요');
              }}
            />
          </View>
        }>
        <PText style={styles.lb}>어느 쪽으로</PText>
        <View style={styles.pills}>
          {DIRS.map((d) => (
            <ChoiceChip key={d} label={d} on={dir === d} onPress={() => setDir(d)} />
          ))}
        </View>
        <PText style={styles.lb}>이유</PText>
        <View style={styles.pills}>
          {WHYS.map((w) => (
            <ChoiceChip key={w} label={w} on={why === w} onPress={() => setWhy(w)} />
          ))}
        </View>
      </Sheet>
    </AccountPage>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.7 },
  body: { paddingTop: 4, paddingBottom: 40 },
  card: { padding: 16 },
  small: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
  big: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  bigB: { fontFamily: Font.display, fontSize: 40, lineHeight: 46 },
  bigS: { fontFamily: Font.body800, fontSize: 14, lineHeight: 20, color: Colors.inkSub },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  rowS: { fontFamily: Font.body800, fontSize: 13, lineHeight: 19 },
  rowB: { fontFamily: Font.display, fontSize: 13, lineHeight: 19, color: Colors.purple },
  hold: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
  holdText: { flexShrink: 1, fontFamily: Font.body900, fontSize: 12.5, lineHeight: 18, color: Colors.purple },
  go: { paddingVertical: 2, paddingHorizontal: 14 },
  goRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingVertical: 10 },
  line: { borderTopWidth: 1.5, borderColor: Colors.line },
  goB: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  goS: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
  goR: { fontFamily: Font.body900, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
  ds: { marginBottom: 12, fontFamily: Font.body700, fontSize: 15, lineHeight: 23, color: Colors.inkSub },
  sum: { paddingVertical: 12, paddingHorizontal: 16, gap: 10 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  sumK: { fontFamily: Font.body800, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
  sumV: { flexShrink: 1, textAlign: 'right', fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  lb: { marginTop: 4, marginBottom: 8, fontFamily: Font.body900, fontSize: 13, lineHeight: 19 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 12 },
});
