import { StyleSheet, View } from 'react-native';

import { CopyBtn } from '@/components/meet/detail/detail-parts';
import { keepAll } from '@/components/common/sheet-parts';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

/** 입금 계좌 (프로토타입 lgAcct · .lg-acct): 은행 · 예금주 / 계좌번호 / 안내 + 복사 */
export function AccountCard({ acct, note = '한국어 이름으로 신청해주세요. 입금이 확인되면 확정됩니다.' }: { acct: [string, string, string]; note?: string }) {
  const [bank, no, holder] = acct;
  return (
    <View style={styles.acct}>
      <View style={styles.tx}>
        <PText style={styles.s}>
          {bank} · 예금주 {holder}
        </PText>
        <PText style={styles.b}>{no}</PText>
        <PText style={[styles.n, keepAll]}>{note}</PText>
      </View>
      <CopyBtn text={`${bank} ${no}`} msg="계좌번호를 복사했어요" label="복사" />
    </View>
  );
}

/** 번호 + 복사 (문자 문의 시트) — 같은 모양 */
export function NumberCard({ top, no, note }: { top: string; no: string; note: string }) {
  return (
    <View style={styles.acct}>
      <View style={styles.tx}>
        <PText style={styles.s}>{top}</PText>
        <PText style={styles.b}>{no}</PText>
        <PText style={[styles.n, keepAll]}>{note}</PText>
      </View>
      <CopyBtn text={no} msg="번호를 복사했어요" label="번호 복사" />
    </View>
  );
}

const styles = StyleSheet.create({
  acct: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 2, borderColor: Colors.ink, borderRadius: 16, backgroundColor: Colors.white, paddingVertical: 12, paddingHorizontal: 14 },
  tx: { flex: 1, minWidth: 0, gap: 2 },
  s: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  b: { fontFamily: Font.display, fontSize: 16, lineHeight: 20, letterSpacing: 0.2 },
  n: { fontFamily: Font.body700, fontSize: 11.5, lineHeight: 17.25, color: Colors.inkSub },
});
