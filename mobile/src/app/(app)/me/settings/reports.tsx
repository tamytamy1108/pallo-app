import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AccountPage, UnderTabs } from '@/components/account/parts';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { MY_REPORTS } from '@/data/account';

/** 설정 › 신고 내역 (프로토타입 reportsHTML): 내가 한 신고(대상 · 사유 · 날짜 · 접수 / 처리 완료 · 결과) · 받은 경고 */
export default function ReportsScreen() {
  const [tab, setTab] = useState<'mine' | 'warn'>('mine');
  return (
    <AccountPage title="신고 내역" plain>
      <UnderTabs
        tabs={[
          ['mine', `내가 한 신고 ${MY_REPORTS.length}`],
          ['warn', '받은 경고 0'],
        ]}
        value={tab}
        onChange={setTab}
      />
      <View style={styles.body}>
        {tab === 'mine' ? (
          <>
            {MY_REPORTS.map((r) => (
              <View key={r.who + r.d} style={styles.row}>
                <PText style={styles.tg}>{`${r.kind} · ${r.d}`}</PText>
                <PText style={styles.b}>{`${r.who} · ${r.why}`}</PText>
                <PText style={styles.s}>
                  <PText style={[styles.s, r.st === '접수' && styles.rf]}>{r.st}</PText>
                  {r.res ? ` · ${r.res}` : ' · 매니저가 24시간 안에 확인해요'}
                </PText>
              </View>
            ))}
            <PText style={styles.note}>신고한 사람은 상대에게 알려지지 않아요.</PText>
          </>
        ) : (
          <PText style={styles.empty}>{'받은 경고가 없어요.\n경고를 받으면 여기서 이유를 보고 이의를 신청할 수 있어요.'}</PText>
        )}
      </View>
    </AccountPage>
  );
}

const styles = StyleSheet.create({
  row: { gap: 3, paddingVertical: 16, borderBottomWidth: 1.5, borderColor: Colors.line },
  tg: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 18, color: Colors.purple },
  b: { fontFamily: Font.body900, fontSize: 15.5, lineHeight: 22 },
  s: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
  body: { paddingHorizontal: 16, paddingTop: 4 },
  rf: { color: Colors.rosePink },
  note: { marginTop: 14, fontFamily: Font.body700, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
  empty: { paddingVertical: 30, textAlign: 'center', fontFamily: Font.body700, fontSize: 14, lineHeight: 21, color: Colors.inkSub },
});
