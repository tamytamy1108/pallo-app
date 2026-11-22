import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { STAGES } from '@/data/mock';

import { HomeSheet, SheetClose } from './home-sheet';
import { SkipIcon } from './icons';
import { SumRow, WideButton } from './parts';

/**
 * 구간 건너뛰기 시트 (프로토타입 openSheet('skip') · renderSkipSheet · finishAct).
 * [테스트 보고 건너뛰기] → '테스트 채점 중…' → 통과하면 처음부터 그 구역까지 남은 단계가 모두 완료돼요.
 * 테스트 문항 · 통과 기준은 아직 정해지지 않아서 프로토타입처럼 1.2초 뒤 통과로 흉내 내요 (맞는 API: 22 `/me/progress/skip-test`).
 */
export function SkipSheet({ stage, left, onClose, onPass }: { stage: number | null; left: number; onClose: () => void; onPass: (stage: number) => void }) {
  const [grading, setGrading] = useState(false);
  const [shown, setShown] = useState(stage ?? 0);

  // 새로 열리면 처음 상태로 (렌더 중에 이전 값과 비교해 맞춰요)
  const [seen, setSeen] = useState<number | null>(null);
  if (stage !== seen) {
    setSeen(stage);
    if (stage !== null) {
      setShown(stage);
      setGrading(false);
    }
  }

  useEffect(() => {
    if (!grading) return;
    const t = setTimeout(() => onPass(shown), 1200);
    return () => clearTimeout(t);
  }, [grading, shown, onPass]);

  const s = STAGES[shown];
  return (
    <HomeSheet open={stage !== null} onClose={onClose} label={`${s.label}까지 건너뛰기`}>
      <View style={styles.head}>
        <View style={styles.pill}>
          <PText style={styles.pillText} color={Colors.white}>
            {s.label} · 건너뛰기
          </PText>
        </View>
        <SheetClose onPress={onClose} />
      </View>
      <View style={styles.row}>
        <View style={StyleSheet.flatten([styles.ico, { backgroundColor: s.color }])}>
          <SkipIcon size={34} />
        </View>
        <View style={styles.text}>
          <PText variant="title">{s.label}까지 건너뛰기</PText>
          <PText style={styles.desc} color={Colors.inkSub}>
            이미 아는 내용이면 짧은 테스트로 넘어가요. 통과하면 남은 퀘스트 {left}개가 완료돼요.
          </PText>
        </View>
      </View>
      <SumRow label="보상" value={`${s.label}까지 바로 이동`} />
      <WideButton label={grading ? '테스트 채점 중…' : '테스트 보고 건너뛰기'} disabled={grading} onPress={() => setGrading(true)} style={styles.go} />
    </HomeSheet>
  );
}

const styles = StyleSheet.create({
  head: { marginTop: 18, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  pill: { height: 26, paddingHorizontal: 11, borderRadius: 13, backgroundColor: Colors.ink, justifyContent: 'center' },
  pillText: { fontFamily: Font.body800, fontSize: 12, lineHeight: 16 },
  row: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 14 },
  ico: { width: 64, height: 64, borderRadius: 22, borderWidth: 2, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, minWidth: 0 },
  desc: { marginTop: 4, fontFamily: Font.body500, fontSize: 14, lineHeight: 20 },
  go: { marginTop: 12, marginRight: 4 },
});
