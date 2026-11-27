import { StyleSheet, View } from 'react-native';

import { langColor, type MyPageProClass } from '@/api/my-page';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

import { Box } from './parts';

const WD = '일월화수목금토';
/** 'YYYY-MM-DD' → '11.26 (수)' */
export function dayLabel(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${m}.${d} (${WD[new Date(y, m - 1, d).getDay()]})`;
}

/**
 * 프로 · 지점 관리자 마이의 '내 수업' 카드 (회원 '내 스터디' 자리 · 10-roles '마이'): 이번 주 맡은 세션 (버튼 없이).
 * 값은 마이 BFF(GET /me/mypage myClasses.thisWeek) 그대로 — 서버가 리더 배정 요일 + 실제 리딩 회차로 만들어요.
 * 테이블을 아직 모르는 회차(안 열림)는 지점 이름을 보여 줘요.
 */
/** open · onOpen: 마이 숫자 칸(이번 달 세션 · 출석 체크)을 누르면 '담당팀' 시트 (이번 주) */
export function MyClassCard({ classes, open: all, onOpen: setAll }: { classes: MyPageProClass[]; open: boolean; onOpen: (v: boolean) => void }) {
  return (
    <>
      <Box style={styles.card}>
        <PText style={styles.sum}>{`이번 주 맡은 세션 ${classes.length}개`}</PText>
        {classes.length ? (
          <View>
            {classes.map((c, i) => (
              <ClassRow key={c.courseId + c.date} c={c} first={i === 0} />
            ))}
          </View>
        ) : (
          <PText style={styles.s}>이번 주에 맡은 세션이 없어요</PText>
        )}
      </Box>
      {/* 숫자 칸(이번 달 세션 · 출석 체크)을 누르면: 담당팀 — 이번 주 맡은 세션 */}
      <Sheet open={all} onClose={() => setAll(false)} title="담당팀" label="담당팀">
        <View style={styles.wk}>
          {classes.map((c, i) => (
            <ClassRow key={c.courseId + c.date} c={c} first={i === 0} />
          ))}
        </View>
      </Sheet>
    </>
  );
}

function ClassRow({ c, first }: { c: MyPageProClass; first: boolean }) {
  const place = c.tableName ?? c.branchName;
  return (
    <View
      style={[styles.row, !first && styles.line]}
      accessible
      accessibilityLabel={`${dayLabel(c.date)} ${c.time} ${c.courseTitle} ${c.languageLabel} ${place} 학생 ${c.studentCount}명`}>
      <View style={[styles.dot, { backgroundColor: langColor(c.languageLabel) }]} />
      <View style={styles.tx}>
        <PText style={styles.h}>{`${dayLabel(c.date)} ${c.time}`}</PText>
        <PText style={styles.s}>{`${c.courseTitle} · ${c.languageLabel} · ${place}`}</PText>
      </View>
      <PText style={styles.n}>{`${c.studentCount}명`}</PText>
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
});
