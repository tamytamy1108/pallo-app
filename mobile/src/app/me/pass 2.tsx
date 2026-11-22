import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AccountPage, Box, Head, TextLink } from '@/components/account/parts';
import { Button } from '@/components/ui/button';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { changesLeftText, getMembership, PASS_LOG, ymd } from '@/data/account';
import { sfx } from '@/lib/feedback';

const DAY = 864e5;
/** 오늘 0시 기준 남은 날 (D-day 는 기기 날짜로 세요) */
function daysUntil(d: Date) {
  const t = new Date();
  return Math.max(0, Math.ceil((d.getTime() - new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime()) / DAY));
}

/**
 * 이용권 · 남은 세션 (프로토타입 passHTML): 남은 회차 · 유료/무료 · 기간 · D-day · 내 이용권 표 · 사용 내역(더 보기) · 결제 내역 ›
 * 아래 고정 [연기 · 변경 신청]. 금액은 보여 주지 않아요. 맞는 API: 37 `/me/membership` · 42 `/me/pass-usage`
 */
export default function PassScreen() {
  const ms = getMembership();
  const [more, setMore] = useState(false);
  const P = ms.plan;
  const info: [string, string, string?][] = [
    ['총 기간', `${P.months}개월`, `유료 ${P.paidMonths}개월 + 무료 ${P.freeMonths}개월`],
    ['총 횟수', `${ms.total}회`, `유료 ${ms.paidN}회 + 무료 ${ms.freeN}회`],
    ['남은 횟수', `${ms.left}회`, `유료 ${ms.paidL}회 · 무료 ${ms.freeL}회`],
    ['주 참여', P.perWeekText ?? `주 ${ms.wk}회`],
    ['연기 · 변경', ms.pp === Infinity ? '무제한' : `${changesLeftText(ms.pp)} 남음`, ms.pp === Infinity ? undefined : `${P.changes}번 중`],
    ['만료일', ymd(ms.exp), `남은 ${ms.left}회를 주 ${ms.wk}회로 들으면 · 연기하면 밀려요`],
  ];

  return (
    <AccountPage
      title="이용권 · 남은 세션"
      bodyStyle={styles.body}
      footer={
        <Button
          label="연기 · 변경 신청"
          wide
          onPress={() => {
            sfx('tap');
            router.push('/me/change');
          }}
        />
      }>
      <Box style={styles.card}>
        <PText style={styles.small}>{ms.name}</PText>
        <View style={styles.big}>
          <PText style={styles.bigB}>{ms.left}</PText>
          <PText style={styles.bigS}>{`/ ${ms.total}회 남았어요`}</PText>
        </View>
        <PText style={styles.pf}>
          {'유료 '}
          <PText style={styles.pfB}>{ms.paidL}</PText>
          {' · 무료 '}
          <PText style={styles.pfB}>{ms.freeL}</PText>
          {' 남음 · 유료분부터 써요'}
        </PText>
        <View style={styles.bar} accessibilityLabel={`${ms.total}회 중 ${ms.used}회 사용`}>
          <View style={[styles.barIn, { width: `${Math.round((ms.used / ms.total) * 100)}%` }]} />
        </View>
        <View style={styles.row}>
          <PText style={styles.rowS}>{ms.period}</PText>
          <PText style={styles.rowB}>{`D-${daysUntil(ms.exp)}`}</PText>
        </View>
      </Box>
      <Head>내 이용권</Head>
      <Box style={styles.info}>
        {info.map(([k, v, s], i) => (
          <View key={k} style={[styles.ir, i > 0 && styles.line]}>
            <PText style={styles.irK}>{k}</PText>
            <View style={styles.irV}>
              <PText style={styles.irB}>{v}</PText>
              {s ? <PText style={styles.irS}>{s}</PText> : null}
            </View>
          </View>
        ))}
      </Box>
      <Head>사용 내역</Head>
      <Box style={styles.log}>
        {PASS_LOG.slice(0, more ? 12 : 6).map((x, i) => (
          <View key={x.d} style={[styles.lr, i > 0 && styles.line]}>
            <PText style={styles.ld}>{x.d}</PText>
            <View style={styles.lt}>
              <PText style={styles.ltB}>{x.ls}</PText>
              <PText style={styles.ltS}>{x.br}</PText>
            </View>
            <PText style={[styles.lb, !x.ok && styles.no]}>{x.ok ? '출석' : '결석'}</PText>
          </View>
        ))}
      </Box>
      {more ? null : <TextLink label="사용 내역 더 보기 ›" onPress={() => setMore(true)} style={styles.more} />}
      <TextLink
        label="결제 내역 ›"
        onPress={() => {
          sfx('tap');
          router.push('/me/payments');
        }}
        style={styles.more}
      />
    </AccountPage>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: 4, paddingBottom: 40 },
  card: { padding: 16 },
  small: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
  big: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  bigB: { fontFamily: Font.display, fontSize: 40, lineHeight: 46 },
  bigS: { fontFamily: Font.body800, fontSize: 14, lineHeight: 20, color: Colors.inkSub },
  pf: { marginTop: 2, marginBottom: 8, fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
  pfB: { fontFamily: Font.body900, color: Colors.ink },
  bar: { height: 10, borderRadius: 5, backgroundColor: '#EEE8DA', overflow: 'hidden' },
  barIn: { height: 10, borderRadius: 5, backgroundColor: Colors.purple },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  rowS: { fontFamily: Font.body800, fontSize: 13, lineHeight: 19 },
  rowB: { fontFamily: Font.display, fontSize: 13, lineHeight: 19, color: Colors.purple },
  info: { paddingVertical: 4, paddingHorizontal: 16 },
  ir: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 11 },
  line: { borderTopWidth: 1.5, borderColor: Colors.line },
  irK: { fontFamily: Font.body700, fontSize: 13.5, lineHeight: 20, color: Colors.inkSub },
  irV: { flexShrink: 1, alignItems: 'flex-end' },
  irB: { textAlign: 'right', fontFamily: Font.body900, fontSize: 13.5, lineHeight: 20 },
  irS: { textAlign: 'right', fontFamily: Font.body700, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub },
  log: { paddingVertical: 2, paddingHorizontal: 14 },
  lr: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  ld: { width: 64, fontFamily: Font.body700, fontSize: 13.5, lineHeight: 20, color: Colors.inkSub },
  lt: { flex: 1 },
  ltB: { fontFamily: Font.body800, fontSize: 13.5, lineHeight: 20 },
  ltS: { fontFamily: Font.body700, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub },
  lb: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 18, color: Colors.purple },
  no: { color: Colors.rosePink },
  more: { alignSelf: 'center', marginTop: 12 },
});
