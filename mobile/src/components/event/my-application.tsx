import { StyleSheet, View } from 'react-native';

import { keepAll } from '@/components/common/sheet-parts';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import type { EventItem } from '@/data/events';
import { MONTHS, won } from '@/data/meet';

import { AccountCard } from './account-card';
import { accountOf } from './event-model';

/**
 * 신청 후 '내 신청' 카드 — 제목 바로 아래 (프로토타입 .lg-mine).
 * 무료: '내 신청 · 참여 확정' · 유료: '내 신청 · 입금 기다리는 중' + 24시간 안에 입금 · 계좌 복사. 내가 보낸 설문 답도 보여요.
 */
export function MyApplication({ e, answers }: { e: EventItem; answers: [string, string][] }) {
  const pay = !!e.fee;
  return (
    <View style={[styles.mine, pay && styles.pay]}>
      <PText style={styles.b}>{pay ? '내 신청 · 입금 기다리는 중' : '내 신청 · 참여 확정'}</PText>
      {pay ? (
        <PText style={[styles.s, keepAll]}>
          신청하고 24시간 안에 <PText style={styles.em}>{won(e.fee ?? 0)}</PText>을 보내 주세요. 입금이 확인되면 확정됩니다.
        </PText>
      ) : (
        <PText style={[styles.s, keepAll]}>
          {MONTHS.indexOf(e.mon) + 1}월 {Number(e.day)}일 {e.wd}에 만나요. 못 가게 되면 아래 ‘참여 완료’를 눌러 취소해 주세요.
        </PText>
      )}
      {pay ? <AccountCard acct={accountOf(e)} /> : null}
      {answers.length ? (
        <View style={styles.my}>
          {answers.map(([q, a]) => (
            <View key={q}>
              <PText style={styles.myS}>{q}</PText>
              <PText style={styles.myA}>{a}</PText>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  mine: { gap: 6, marginTop: 12, marginBottom: 2, padding: 14, borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, backgroundColor: '#F3EEFB' },
  pay: { backgroundColor: '#FFF6CC' },
  b: { fontFamily: Font.body900, fontSize: 14.5, lineHeight: 20, color: Colors.purple },
  s: { fontFamily: Font.body700, fontSize: 13, lineHeight: 20.15 },
  em: { fontFamily: Font.body900, fontSize: 13 },
  my: { marginTop: 4, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.65)', borderRadius: 12, gap: 6 },
  myS: { fontFamily: Font.body700, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub },
  myA: { fontFamily: Font.body800, fontSize: 13, lineHeight: 19 },
});
