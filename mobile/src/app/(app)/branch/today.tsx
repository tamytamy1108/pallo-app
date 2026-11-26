import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useBranchToday } from '@/api/use-branch-today';
import { AccountPage } from '@/components/account/parts';
import { fmtMin } from '@/components/home/attendance';
import { StatCells } from '@/components/home/branch-status-card';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-view';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { QR_BEFORE } from '@/data/home';
import type { SessionRow } from '@/lib/branch-today-view';

const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

/**
 * 오늘 지점 현황 · 모두 보기 (지점 관리자 · docs/pages/10-roles.md 4장). 보기만 해요 — 손 출석 · 지각은 출석 명단에서.
 * 지금 QR 이 열린 세션이 맨 위, 그다음 예정, 끝난 수업은 맨 아래 연하게 한 줄씩.
 * 카드마다 전산 팀 이름 그대로 + 프로(또는 프로 대신 스텝) n명 · 멤버 n명 — 아무도 안 찍었어도 0명으로 늘 보여요.
 */
export default function BranchTodayScreen() {
  const { view, isPending, isError, refetch } = useBranchToday();
  const title = view ? `${view.branchName} 현황` : '지점 현황';

  let body;
  if (isError) body = <ErrorState message="현황을 못 불러왔어요" onRetry={refetch} />;
  else if (isPending || !view) body = <LoadingState />;
  else if (view.sessions === 0) body = <EmptyState title={'오늘은 스터디가 없어요.'} />;
  else
    body = (
      <>
        <StatCells
          framed
          cells={[
            { label: '오늘 스터디', value: String(view.sessions) },
            { label: '프로 출석', value: String(view.proByPro), tone: 'pro' },
            { label: '스텝 출석', value: String(view.proByStaff), tone: 'staff' },
            { label: '멤버 출석', value: String(view.members), tone: 'member' },
          ]}
        />
        {view.open.length ? <Group title="출석 중" tone="open" rows={view.open} /> : null}
        {view.soon.length ? <Group title="예정" tone="soon" rows={view.soon} /> : null}
        {view.done.length ? <DoneGroup rows={view.done} /> : null}
      </>
    );

  return (
    <AccountPage title={title} onBack={back} bodyStyle={styles.body}>
      {body}
    </AccountPage>
  );
}

function Group({ title, tone, rows }: { title: string; tone: 'open' | 'soon'; rows: SessionRow[] }) {
  // 같은 시각끼리 묶어요
  const times = [...new Set(rows.map((r) => r.start))];
  return (
    <View style={styles.group}>
      {times.map((t) => (
        <View key={t} style={styles.slot}>
          <View style={styles.slotHead}>
            <PText style={styles.slotTime}>{fmtMin(t)}</PText>
            <View style={[styles.state, tone === 'open' ? styles.stateOpen : styles.stateSoon]}>
              <PText style={styles.stateT}>{title}</PText>
            </View>
          </View>
          {rows
            .filter((r) => r.start === t)
            .map((r) => (
              <SessionCard key={r.sessionId} row={r} />
            ))}
        </View>
      ))}
    </View>
  );
}

/** 프로 줄: 스텝이 '프로로 참여'로 대신했으면 스텝 이름, 아니면 맡은 프로 이름. 찍기 전엔 0명 */
function proRow(row: SessionRow) {
  if (row.proCheckedInBy === 'STAFF') return { label: `스텝 ${row.proCheckedInName ?? ''}`, sub: row.proName ? `${row.proName} 대신` : null, count: 1, staff: true };
  return { label: `프로 ${row.proName ?? '미정'}`, sub: null, count: row.proCheckedInBy ? 1 : 0, staff: false };
}

function CountRow({ dot, label, sub, count }: { dot: 'pro' | 'staff' | 'member'; label: string; sub?: string | null; count: number }) {
  return (
    <View style={styles.countRow}>
      <View style={[styles.dot, dot === 'pro' ? styles.dotPro : dot === 'staff' ? styles.dotStaff : styles.dotMember]} />
      <PText style={styles.countL} numberOfLines={1}>
        {label}
        {sub ? <PText style={styles.countSub}> ({sub})</PText> : null}
      </PText>
      <PText style={[styles.countV, count === 0 && styles.countZero]}>{count}명</PText>
    </View>
  );
}

function SessionCard({ row }: { row: SessionRow }) {
  const pro = proRow(row);
  return (
    <View style={styles.card} accessible accessibilityLabel={`${row.teamName}, ${pro.label} ${pro.count}명, 멤버 ${row.checkedIn}명`}>
      <View style={styles.titleRow}>
        <PText style={styles.team} numberOfLines={1}>
          {row.teamName}
        </PText>
        {row.phase === 'soon' ? <PText style={styles.soonT}>{fmtMin(row.start - QR_BEFORE)}부터 출석</PText> : null}
      </View>
      {/* 프로 · 멤버 줄은 늘 위에 (찍기 전엔 0명, 찍으면 바로 바뀌어요) */}
      <CountRow dot={pro.staff ? 'staff' : 'pro'} label={pro.label} sub={pro.sub} count={pro.count} />
      <CountRow dot="member" label="멤버" count={row.checkedIn} />
      {row.phase === 'open' ? (
        <View style={styles.tables}>
          {row.tables.map((t) => (
            <View key={t.tableId} style={[styles.tb, t.checkedIn === 0 && styles.tbZero]}>
              <PText style={[styles.tbNo, t.proCheckedIn && styles.tbNoPro]} numberOfLines={1}>
                {t.tableName ?? `${t.tableNo}번`}
                {t.proCheckedIn ? (row.proCheckedInBy === 'STAFF' ? ' · 스텝' : ' · 프로') : ''}
              </PText>
              <PText style={[styles.tbCount, t.checkedIn === 0 && styles.tbCountZero]}>{t.checkedIn}명</PText>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** 끝난 수업: 맨 아래 연하게 · 한 줄씩 (시각 · 팀 이름 · 프로 · 멤버) */
function DoneGroup({ rows }: { rows: SessionRow[] }) {
  return (
    <View style={[styles.group, styles.done]}>
      <PText style={styles.doneHead}>끝난 수업 {rows.length}</PText>
      {rows.map((r) => {
        const pro = proRow(r);
        return (
          <View key={r.sessionId} style={styles.doneRow} accessible accessibilityLabel={`${fmtMin(r.start)} ${r.teamName}, 끝난 수업, ${pro.label} ${pro.count}명, 멤버 ${r.checkedIn}명`}>
            <PText style={styles.doneTime}>{fmtMin(r.start)}</PText>
            <PText style={styles.doneTeam} numberOfLines={1}>
              {r.teamName}
            </PText>
            <PText style={styles.doneCount}>
              {pro.staff ? '스텝' : '프로'} {pro.count} · 멤버 {r.checkedIn}
            </PText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 40, gap: 14 },
  group: { gap: 14 },
  slot: { gap: 8 },
  slotHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  slotTime: { fontFamily: Font.display, fontSize: 15, lineHeight: 20 },
  state: { height: 20, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1.5, borderColor: Colors.ink, justifyContent: 'center' },
  stateOpen: { backgroundColor: Colors.rosePink },
  stateSoon: { backgroundColor: Colors.yellow },
  stateT: { fontFamily: Font.body900, fontSize: 11, lineHeight: 15 },
  card: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 16, backgroundColor: Colors.white, paddingHorizontal: 14, paddingVertical: 12, gap: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  team: { flex: 1, minWidth: 0, fontFamily: Font.body900, fontSize: 16, lineHeight: 22 },
  soonT: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  dotPro: { backgroundColor: Colors.purple },
  dotStaff: { backgroundColor: Colors.ink },
  dotMember: { backgroundColor: Colors.yellow, borderWidth: 1.5, borderColor: Colors.ink },
  countL: { flex: 1, minWidth: 0, fontFamily: Font.body700, fontSize: 14, lineHeight: 20 },
  countSub: { fontFamily: Font.body700, fontSize: 12, lineHeight: 20, color: Colors.inkSub },
  countV: { fontFamily: Font.display, fontSize: 16, lineHeight: 22 },
  countZero: { color: '#A39C8E' },
  // 테이블: 같은 크기 칸 · 번호 위 · 인원 아래 (칸 안에 알약을 겹치지 않아요)
  tables: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  tb: { width: 70, paddingVertical: 6, alignItems: 'center', borderRadius: 10, backgroundColor: Colors.cream, borderWidth: 1.5, borderColor: Colors.line },
  tbZero: { backgroundColor: Colors.white },
  tbNo: { fontFamily: Font.body700, fontSize: 11, lineHeight: 15, color: Colors.inkSub },
  tbNoPro: { color: Colors.purple, fontFamily: Font.body900 },
  tbCount: { fontFamily: Font.body900, fontSize: 15, lineHeight: 20 },
  tbCountZero: { color: '#A39C8E' },
  done: { opacity: 0.5, gap: 6 },
  doneHead: { fontFamily: Font.body900, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: '#C9C0AE', borderRadius: 12, backgroundColor: Colors.white, paddingHorizontal: 10, height: 40 },
  doneTime: { fontFamily: Font.display, fontSize: 12, lineHeight: 16, width: 40 },
  doneTeam: { flex: 1, minWidth: 0, fontFamily: Font.body800, fontSize: 12, lineHeight: 17 },
  doneCount: { fontFamily: Font.display, fontSize: 12, lineHeight: 16 },
});
