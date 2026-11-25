import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { LANG_COLOR, PRO_CLASSES, type ProClass } from '@/data/account';

import { Box } from './parts';

/**
 * 프로 마이의 '내 수업' 카드 (회원 '내 스터디' 자리 · 10-roles '마이'): 이번 주 맡은 세션 · [내 일정 전체 보기](이번 주 · 다음 주).
 * 이용권 · 남은 횟수 · 연기 · 팀 변경은 없어요 (프로는 쓰지 않아요). 맞는 API: 프로 일정 (제안)
 */
/** open · onOpen: 마이 숫자 칸(이번 달 세션 · 출석 체크)을 눌러도 전체 일정이 열려요 */
export function MyClassCard({ open: all, onOpen: setAll }: { open: boolean; onOpen: (v: boolean) => void }) {
  const week = PRO_CLASSES.filter((c) => c.week === 'this');
  return (
    <>
      <Box style={styles.card}>
        <PText style={styles.sum}>{`이번 주 맡은 세션 ${week.length}개`}</PText>
        <View>
          {week.map((c, i) => (
            <ClassRow key={c.id} c={c} first={i === 0} />
          ))}
        </View>
        <Button label="내 일정 전체 보기" variant="secondary" wide onPress={() => setAll(true)} />
      </Box>
      <Sheet open={all} onClose={() => setAll(false)} title="내 일정" label="내 일정 전체" tall>
        {(['this', 'next'] as const).map((w) => (
          <View key={w} style={styles.wk}>
            <PText style={styles.wkH}>{w === 'this' ? '이번 주' : '다음 주'}</PText>
            {PRO_CLASSES.filter((c) => c.week === w).map((c, i) => (
              <ClassRow key={c.id} c={c} first={i === 0} />
            ))}
          </View>
        ))}
        <PText style={styles.note}>일정 바꾸기 · 대강은 지점 관리자와 정해요.</PText>
      </Sheet>
    </>
  );
}

function ClassRow({ c, first }: { c: ProClass; first: boolean }) {
  return (
    <View style={[styles.row, !first && styles.line]} accessible accessibilityLabel={`${c.day} ${c.time} ${c.team} ${c.lang} ${c.room} 학생 ${c.students}명`}>
      <View style={[styles.dot, { backgroundColor: LANG_COLOR[c.lang] }]} />
      <View style={styles.tx}>
        <PText style={styles.h}>{`${c.day} ${c.time}`}</PText>
        <PText style={styles.s}>{`${c.team} · ${c.lang} · ${c.room}`}</PText>
      </View>
      <PText style={styles.n}>{`${c.students}명`}</PText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 10 },
  sum: { fontFamily: Font.body900, fontSize: 14, lineHeight: 20, color: Colors.inkSub },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  line: { borderTopWidth: 1.5, borderColor: Colors.line },
  dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: Colors.ink },
  tx: { flex: 1, minWidth: 0 },
  h: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  s: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
  n: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18, color: Colors.purple },
  wk: { gap: 2 },
  wkH: { marginTop: 4, fontFamily: Font.body900, fontSize: 13.5, lineHeight: 19, color: Colors.inkSub },
  note: { marginTop: 6, fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
});
