import { router } from 'expo-router';
import type { ReactNode } from 'react';
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
import { groupByStudy, type SessionRow } from '@/lib/branch-today-view';

const back = () => (router.canGoBack() ? router.back() : router.replace('/home'));

/**
 * 오늘 지점 현황 · 모두 보기 (지점 관리자 · docs/pages/10-roles.md 4장). 보기만 해요 — 손 출석 · 지각은 출석 명단에서.
 * 지금 QR 이 열린 세션이 맨 위, 그다음 예정, 끝난 수업은 맨 아래 연하게 한 줄씩.
 * 카드마다 전산 팀 이름 그대로 + 프로(스텝 대타 · 스텝 참석 포함) n명 · 멤버 n명 — 아무도 안 찍었어도 0명으로 늘 보여요.
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
            { label: '오늘 스터디', value: String(view.studies), sub: `팀 ${view.sessions}` },
            { label: '프로 출석', value: String(view.proByPro), tone: 'pro', sub: `예정 ${view.proPlanned}`, warn: view.proAbsent > 0 ? `불참 ${view.proAbsent}` : undefined },
            { label: '스텝 출석', value: String(view.staffCount), tone: 'staff' },
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
    // 예정은 시각 · 카드 모두 흐리게 (아직 출석이 열리지 않았어요)
    <View style={[styles.group, tone === 'soon' && styles.groupSoon]}>
      {times.map((t) => (
        <View key={t} style={styles.slot}>
          <View style={styles.slotHead}>
            <PText style={styles.slotTime}>{fmtMin(t)}</PText>
            <View style={[styles.state, tone === 'open' ? styles.stateOpen : styles.stateSoon]}>
              <PText style={styles.stateT}>{title}</PText>
            </View>
          </View>
          {/* 시각 안에 스터디(영어 화목 7시 30분 …), 스터디 안에 팀(2-1 영어 · 2-2 영어 …) */}
          {groupByStudy(rows.filter((r) => r.start === t)).map((g) => (
            <View key={g.studyName} style={styles.study}>
              <View style={styles.studyHead}>
                <PText style={styles.studyName} numberOfLines={1}>
                  {g.studyName}
                </PText>
                <PText style={styles.studyMeta}>{tone === 'soon' ? `팀 ${g.rows.length} · ${fmtMin(t - QR_BEFORE)}부터 출석` : `팀 ${g.rows.length}`}</PText>
              </View>
              {g.rows.map((r) => (
                <SessionCard key={r.sessionId} row={r} />
              ))}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

/** 프로 쪽 인원: 프로(또는 대타 스텝) + 그냥 참석한 스텝. 찍기 전엔 0명 */
function proRow(row: SessionRow) {
  const cover = row.proCheckedInBy === 'STAFF';
  const count = (row.proCheckedInBy ? 1 : 0) + (row.staffJoinedName ? 1 : 0);
  const label = cover
    ? `스텝 ${row.proCheckedInName ?? ''}${row.proName ? ` ${row.proName} 대타` : ''}`
    : `프로 ${row.proName ?? '미정'}${row.staffJoinedName ? ` · 스텝 ${row.staffJoinedName} 참석` : ''}`;
  return { cover, count, label };
}

/** 스텝 이름: 노랑 바탕 (앱 노랑) */
function StaffName({ name }: { name: string }) {
  return (
    <View style={styles.staffTag}>
      <PText style={styles.staffTagT} numberOfLines={1}>
        스텝 {name}
      </PText>
    </View>
  );
}

/** 인원 칸 (크림 바탕 · 연한 선 · 이름 위 · 인원 아래). 0명이면 흰 바탕 · 흐린 숫자 */
function CountBox({ children, count }: { children: ReactNode; count: number }) {
  return (
    <View style={[styles.box, count === 0 && styles.boxZero]}>
      {children}
      <PText style={[styles.boxV, count === 0 && styles.boxVZero]}>{count}명</PText>
    </View>
  );
}

/** 프로 칸: 대타면 [스텝 민지] Mateo 대타 · 프로가 있고 스텝도 왔으면 아래 줄 [스텝 수빈] 참석 */
function ProBox({ row }: { row: SessionRow }) {
  const pro = proRow(row);
  return (
    <CountBox count={pro.count}>
      {pro.cover ? (
        <View style={styles.nameRow}>
          <StaffName name={row.proCheckedInName ?? ''} />
          {row.proName ? <PText style={styles.nameNote}>{row.proName} 대타</PText> : null}
        </View>
      ) : (
        <PText style={[styles.boxL, styles.boxLPro]} numberOfLines={1}>
          프로 {row.proName ?? '미정'}
        </PText>
      )}
      {row.staffJoinedName ? (
        <View style={styles.nameRow}>
          <StaffName name={row.staffJoinedName} />
          <PText style={styles.nameNote}>참석</PText>
        </View>
      ) : null}
    </CountBox>
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
      </View>
      {/* 프로 · 멤버 칸은 늘 위에 (찍기 전엔 0명, 찍으면 바로 바뀌어요) */}
      <View style={styles.boxes}>
        <ProBox row={row} />
        <CountBox count={row.checkedIn}>
          <PText style={styles.boxL}>멤버</PText>
        </CountBox>
      </View>
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
              {pro.cover ? '스텝 대타' : '프로'} {pro.count} · 멤버 {r.checkedIn}
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
  groupSoon: { opacity: 0.45 },
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
  study: { gap: 6 },
  studyHead: { flexDirection: 'row', alignItems: 'baseline', gap: 8, paddingHorizontal: 2, marginTop: 2 },
  studyName: { flex: 1, minWidth: 0, fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  studyMeta: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  // 프로 · 멤버 칸: 같은 크기 두 칸
  boxes: { flexDirection: 'row', gap: 8, marginTop: 2 },
  box: { flex: 1, minWidth: 0, paddingVertical: 8, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: Colors.cream, borderWidth: 1.5, borderColor: Colors.line },
  boxZero: { backgroundColor: Colors.white },
  boxL: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  boxLPro: { fontFamily: Font.body900, color: Colors.purple },
  nameRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 4 },
  nameNote: { fontFamily: Font.body800, fontSize: 11, lineHeight: 16, color: Colors.inkSub },
  staffTag: { paddingHorizontal: 6, borderRadius: 5, backgroundColor: Colors.yellow },
  staffTagT: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17, color: Colors.ink },
  boxV: { fontFamily: Font.body900, fontSize: 17, lineHeight: 23, textAlign: 'center' },
  boxVZero: { color: '#A39C8E' },
  done: { opacity: 0.5, gap: 6 },
  doneHead: { fontFamily: Font.body900, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: '#C9C0AE', borderRadius: 12, backgroundColor: Colors.white, paddingHorizontal: 10, height: 40 },
  doneTime: { fontFamily: Font.display, fontSize: 12, lineHeight: 16, width: 40 },
  doneTeam: { flex: 1, minWidth: 0, fontFamily: Font.body800, fontSize: 12, lineHeight: 17 },
  doneCount: { fontFamily: Font.display, fontSize: 12, lineHeight: 16 },
});
