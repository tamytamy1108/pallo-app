import { StyleSheet, View } from 'react-native';

import { langColor } from '@/api/my-page';
import type { ProSessionLog } from '@/api/pro-sessions';
import { useProSessions } from '@/api/use-pro-sessions';
import { Sheet } from '@/components/ui/sheet';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-view';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { SPARK_ATTEND } from '@/data/my';

import { dayLabel } from './my-class-card';

/**
 * 스텝 마이 숫자 칸 '참여한 세션' 을 누르면: 내가 '프로로 참여'로 출석한 세션 기록 (최근 순 · 달마다 묶음).
 * 담당팀(이번 주 맡은 세션)은 스텝에게 없어서, 이 칸은 지금까지 참여한 세션을 보여 줘요 (2026-11-27 요청).
 */
export function ProSessionsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const q = useProSessions(open);
  const d = q.data;
  let body;
  if (q.isError) body = <ErrorState message="기록을 못 불러왔어요" onRetry={() => void q.refetch()} />;
  else if (!d) body = <LoadingState />;
  else if (!d.items.length) body = <EmptyState compact title={'아직 참여한 세션이 없어요.\n테이블 QR 에서 프로로 참여하면 여기에 쌓여요.'} />;
  else
    body = (
      <>
        <View style={styles.sum}>
          <View style={styles.sumC}>
            <PText style={styles.sumL}>전체</PText>
            <PText style={styles.sumV}>{`${d.total}회`}</PText>
          </View>
          <View style={[styles.sumC, styles.sumLine]}>
            <PText style={styles.sumL}>이번 달</PText>
            <PText style={styles.sumV}>{`${d.thisMonth}회`}</PText>
          </View>
        </View>
        <PText style={styles.ds}>{`프로로 참여할 때마다 스파크 +${SPARK_ATTEND}`}</PText>
        {byMonth(d.items).map(([month, rows]) => (
          <View key={month}>
            <PText style={styles.mon}>{month}</PText>
            {rows.map((r, i) => (
              <Row key={r.sessionId} r={r} first={i === 0} />
            ))}
          </View>
        ))}
      </>
    );
  return (
    <Sheet open={open} onClose={onClose} title="참여한 세션" label="참여한 세션" tall>
      {body}
    </Sheet>
  );
}

/** 'YYYY-MM' 이 같은 줄끼리 — 행은 이미 최근 순 */
function byMonth(items: ProSessionLog[]) {
  const groups = new Map<string, ProSessionLog[]>();
  for (const it of items) {
    const [y, m] = it.date.split('-').map(Number);
    const key = `${y}년 ${m}월`;
    groups.set(key, [...(groups.get(key) ?? []), it]);
  }
  return [...groups];
}

function Row({ r, first }: { r: ProSessionLog; first: boolean }) {
  const kind = r.kind === 'COVER' ? '대타' : '참여';
  return (
    <View style={[styles.row, !first && styles.line]} accessible accessibilityLabel={`${dayLabel(r.date)} ${r.time} ${r.teamName} ${r.branchName} ${kind} 스파크 ${r.sparks}`}>
      <View style={[styles.dot, { backgroundColor: langColor(r.languageLabel) }]} />
      <View style={styles.tx}>
        <PText style={styles.h}>{`${dayLabel(r.date)} ${r.time}`}</PText>
        <PText style={styles.s} numberOfLines={1}>{`${r.teamName} · ${r.branchName}`}</PText>
      </View>
      <View style={[styles.kind, r.kind === 'COVER' && styles.kindCover]}>
        <PText style={styles.kindT}>{kind}</PText>
      </View>
      <PText style={styles.sp}>{`+${r.sparks}`}</PText>
    </View>
  );
}

const styles = StyleSheet.create({
  sum: { flexDirection: 'row', borderWidth: 2, borderColor: Colors.ink, borderRadius: 14, overflow: 'hidden', backgroundColor: Colors.white },
  sumC: { flex: 1, paddingHorizontal: 12, paddingVertical: 10 },
  sumLine: { borderLeftWidth: 2, borderColor: Colors.ink },
  sumL: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  sumV: { fontFamily: Font.display, fontSize: 22, lineHeight: 28 },
  ds: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
  mon: { marginTop: 4, fontFamily: Font.body900, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  line: { borderTopWidth: 1.5, borderColor: Colors.line },
  dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: Colors.ink },
  tx: { flex: 1, minWidth: 0 },
  h: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  s: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
  kind: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1.5, borderColor: Colors.ink, backgroundColor: Colors.lavender },
  kindCover: { backgroundColor: Colors.yellow },
  kindT: { fontFamily: Font.body800, fontSize: 11, lineHeight: 15 },
  sp: { minWidth: 34, textAlign: 'right', fontFamily: Font.body900, fontSize: 13, lineHeight: 18, color: Colors.purple },
});
