import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { AccountPage, Box } from '@/components/account/parts';
import { Button } from '@/components/ui/button';
import { runAfterSheetClose, Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { PAYMENTS } from '@/data/account';
import { sfx } from '@/lib/feedback';

type Pay = (typeof PAYMENTS)[number];

/**
 * 결제 내역 (프로토타입 payHTML): 날짜 · 상품 · 상태(환불은 분홍) · 수단 · 금액(이용권은 금액 숨김) → 영수증 시트
 * → [이메일로 받기] · [환불 문의](1:1 문의 '결제 · 환불'로). 맞는 API: 43 `/me/payments` · `/me/payments/:id/receipt`
 */
export default function PaymentsScreen() {
  const [open, setOpen] = useState<Pay | null>(null);
  return (
    <AccountPage title="결제 내역" bodyStyle={styles.body}>
      {PAYMENTS.map((p) => (
        <Pressable
          key={p.d + p.item}
          onPress={() => {
            sfx('tap');
            setOpen(p);
          }}
          accessibilityRole="button"
          accessibilityLabel={`${p.d} ${p.item} 영수증`}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <View style={styles.flex}>
            <PText style={styles.tg}>{p.d}</PText>
            <PText style={styles.b}>{p.item}</PText>
            <PText style={styles.s}>
              <PText style={[styles.s, p.st === '환불 완료' && styles.rf]}>{p.st}</PText>
              {` · ${p.how}`}
            </PText>
          </View>
          {p.mem ? null : <PText style={styles.amt}>{`${p.amt.toLocaleString()}원`}</PText>}
        </Pressable>
      ))}
      <Sheet
        open={!!open}
        onClose={() => setOpen(null)}
        title="영수증"
        footer={[
          <View key="m" style={styles.flex}>
            <Button
              label="이메일로 받기"
              variant="secondary"
              wide
              onPress={() => {
                setOpen(null);
                showToast('영수증을 이메일로 보내려면 설정 > 로그인 계정에서 이메일을 등록해요');
              }}
            />
          </View>,
          <View key="r" style={styles.flex}>
            <Button
              label="환불 문의"
              wide
              onPress={() => {
                setOpen(null);
                runAfterSheetClose(() => router.push({ pathname: '/me/support', params: { view: 'ask', type: '결제 · 환불' } }));
              }}
            />
          </View>,
        ]}>
        {open ? (
          <Box style={styles.sum}>
            {(
              [
                ['상품', open.item],
                ['결제일', open.d],
                ['결제 수단', open.how],
                ...(open.mem ? [] : [['금액', `${open.amt.toLocaleString()}원`]]),
                ['상태', open.st],
              ] as [string, string][]
            ).map(([k, v]) => (
              <View key={k} style={styles.sumRow}>
                <PText style={styles.sumK}>{k}</PText>
                <PText style={styles.sumV}>{v}</PText>
              </View>
            ))}
          </Box>
        ) : null}
      </Sheet>
    </AccountPage>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.7 },
  body: { paddingTop: 4 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 16, borderBottomWidth: 1.5, borderColor: Colors.line },
  tg: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 18, color: Colors.purple },
  b: { marginTop: 3, fontFamily: Font.body900, fontSize: 15.5, lineHeight: 22 },
  s: { marginTop: 3, fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
  rf: { color: Colors.rosePink },
  amt: { marginTop: 18, fontFamily: Font.display, fontSize: 14, lineHeight: 20 },
  sum: { paddingVertical: 12, paddingHorizontal: 16, gap: 10 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  sumK: { fontFamily: Font.body800, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
  sumV: { flexShrink: 1, textAlign: 'right', fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
});
