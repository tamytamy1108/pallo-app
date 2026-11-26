import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useBranchToday } from '@/api/use-branch-today';
import { AccountPage } from '@/components/account/parts';
import { RoleTag } from '@/components/common/role-tag';
import { fmtMin } from '@/components/home/attendance';
import { Num } from '@/components/home/branch-status-card';
import { MemberTag } from '@/components/home/join-role-sheet';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-view';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { LANGS, QR_BEFORE } from '@/data/home';
import type { SessionRow } from '@/lib/branch-today-view';

const lang = (key: string) => LANGS.find((l) => l.key === key) ?? LANGS[0];
const clock = (iso: string) => {
  const d = new Date(iso);
  return fmtMin(d.getHours() * 60 + d.getMinutes());
};
const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

/**
 * 오늘 지점 현황 · 모두 보기 (지점 관리자 · docs/pages/10-roles.md 4장). 보기만 해요 — 손 출석 · 지각은 출석 명단에서.
 * 지금 QR 이 열린 세션이 맨 위, 그다음 예정, 끝난 수업은 맨 아래 연하게 한 줄씩.
 * 인원은 오늘 온 수만 (정원 없이). 멤버 = 노랑, 프로 = 보라, 스텝이 프로 대신 = STAFF.
 */
export default function BranchTodayScreen() {
  const { view, isPending, isError, refetch } = useBranchToday();
  const title = view ? `${view.branchName} 현황` : '지점 현황';

  let body;
  if (isError) body = <ErrorState message="현황을 못 불러왔어요" onRetry={refetch} />;
  else if (isPending || !view) body = <LoadingState />;
  else if (view.sessions === 0) body = <EmptyState title={'오늘은 세션이 없어요.'} />;
  else
    body = (
      <>
        <View style={styles.nums}>
          <Num value={String(view.sessions)} label="오늘 세션" />
          <Num value={String(view.proCount)} label="프로 출석" sub={view.proByStaff > 0 ? `프로 ${view.proByPro} · 스텝 ${view.proByStaff}` : undefined} tone="pro" />
          <Num value={String(view.members)} label="멤버 출석" tone="member" />
        </View>
        <View style={styles.legend}>
          <MemberTag />
          <PText style={styles.legendT}>멤버</PText>
          <RoleTag kind="pro" />
          <PText style={styles.legendT}>프로</PText>
          <RoleTag kind="staff" />
          <PText style={styles.legendT}>스텝이 프로 대신</PText>
        </View>
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

function LangChip({ code }: { code: string }) {
  const l = lang(code);
  // 언어 글자 수가 달라도(영어 · 일본어 · 스페인어) 칸 크기는 같아요
  return (
    <View style={[styles.lang, { backgroundColor: l.color }]}>
      <PText style={styles.langT} color={l.ink}>
        {l.ko}
      </PText>
    </View>
  );
}

function ProLine({ row }: { row: SessionRow }) {
  if (row.proCheckedInBy === 'STAFF')
    return (
      <View style={styles.who}>
        <RoleTag kind="staff" />
        <PText style={styles.whoT} numberOfLines={1}>
          {row.proCheckedInName}
          {row.proName ? ` · ${row.proName} 대신` : ''}
        </PText>
      </View>
    );
  return (
    <View style={styles.who}>
      <RoleTag kind="pro" />
      <PText style={styles.whoT} numberOfLines={1}>
        {row.proName ?? '프로 미정'}
      </PText>
    </View>
  );
}

function SessionCard({ row }: { row: SessionRow }) {
  const proState =
    row.phase === 'soon'
      ? { t: `${fmtMin(row.start - QR_BEFORE)}부터 출석`, c: Colors.inkSub }
      : row.proCheckedInAt
        ? { t: `프로 출석 ✓ ${clock(row.proCheckedInAt)}`, c: Colors.purple }
        : { t: '프로 아직', c: '#B23A5A' };
  return (
    <View style={styles.card} accessible accessibilityLabel={`${lang(row.lang).ko} ${row.teamName} ${row.level}, 멤버 ${row.checkedIn}명, ${proState.t}`}>
      <View style={styles.row1}>
        <LangChip code={row.lang} />
        <PText style={styles.team} numberOfLines={1}>
          {row.teamName} · {row.level}
        </PText>
        <PText style={styles.count}>{row.checkedIn}명</PText>
      </View>
      <View style={styles.row2}>
        <ProLine row={row} />
        <PText style={styles.proState} color={proState.c}>
          {proState.t}
        </PText>
      </View>
      {row.phase === 'open' ? (
        <View style={styles.tables}>
          {row.tables.map((t) => (
            <View key={t.tableId} style={[styles.tb, t.checkedIn === 0 && !t.proCheckedIn && styles.tbZero]}>
              <PText style={styles.tbNo}>{t.tableName ?? `${t.tableNo}번`}</PText>
              <View style={[styles.tbCount, t.checkedIn === 0 && styles.tbCountZero]}>
                <PText style={styles.tbCountT}>{t.checkedIn}명</PText>
              </View>
              {t.proCheckedIn ? <RoleTag kind={row.proCheckedInBy === 'STAFF' ? 'staff' : 'pro'} /> : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** 끝난 수업: 맨 아래 연하게 · 한 줄씩 (시각 · 언어 · 팀 · 멤버 수 · 프로 출석) */
function DoneGroup({ rows }: { rows: SessionRow[] }) {
  return (
    <View style={[styles.group, styles.done]}>
      <PText style={styles.doneHead}>끝난 수업 {rows.length}</PText>
      {rows.map((r) => (
        <View key={r.sessionId} style={styles.doneRow} accessible accessibilityLabel={`${fmtMin(r.start)} ${lang(r.lang).ko} ${r.teamName}, 끝난 수업, 멤버 ${r.checkedIn}명`}>
          <PText style={styles.doneTime}>{fmtMin(r.start)}</PText>
          <LangChip code={r.lang} />
          <PText style={styles.doneTeam} numberOfLines={1}>
            {r.teamName} · {r.level}
          </PText>
          <PText style={styles.doneCount}>{r.checkedIn}명</PText>
          {r.proCheckedInBy ? <RoleTag kind={r.proCheckedInBy === 'STAFF' ? 'staff' : 'pro'} /> : <PText style={styles.doneNoPro}>프로 없음</PText>}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 40, gap: 14 },
  nums: { flexDirection: 'row', gap: 8 },
  legend: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', rowGap: 4, marginTop: -4 },
  legendT: { fontFamily: Font.body700, fontSize: 11, lineHeight: 16, color: Colors.inkSub, marginLeft: 4, marginRight: 6 },
  group: { gap: 14 },
  slot: { gap: 8 },
  slotHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  slotTime: { fontFamily: Font.display, fontSize: 15, lineHeight: 20 },
  state: { height: 20, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1.5, borderColor: Colors.ink, justifyContent: 'center' },
  stateOpen: { backgroundColor: Colors.rosePink },
  stateSoon: { backgroundColor: Colors.yellow },
  stateT: { fontFamily: Font.body900, fontSize: 11, lineHeight: 15 },
  card: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 16, backgroundColor: Colors.white, paddingHorizontal: 12, paddingVertical: 10, gap: 6 },
  row1: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lang: { width: 54, height: 20, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  langT: { fontFamily: Font.body900, fontSize: 11, lineHeight: 15 },
  team: { flex: 1, minWidth: 0, fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  count: { fontFamily: Font.display, fontSize: 15, lineHeight: 20 },
  row2: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  who: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, marginLeft: -5 },
  whoT: { flexShrink: 1, fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub, marginLeft: 5 },
  proState: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17 },
  tables: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  tb: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 26, paddingLeft: 8, paddingRight: 6, borderWidth: 1.5, borderColor: Colors.ink, borderRadius: 8, backgroundColor: Colors.cream },
  tbZero: { borderColor: '#C9C0AE', backgroundColor: Colors.white },
  tbNo: { fontFamily: Font.body800, fontSize: 12, lineHeight: 16 },
  tbCount: { paddingHorizontal: 5, borderRadius: 4, backgroundColor: Colors.yellow },
  tbCountZero: { backgroundColor: 'transparent' },
  tbCountT: { fontFamily: Font.body900, fontSize: 12, lineHeight: 16 },
  done: { opacity: 0.5, gap: 6 },
  doneHead: { fontFamily: Font.body900, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: '#C9C0AE', borderRadius: 12, backgroundColor: Colors.white, paddingHorizontal: 10, height: 40 },
  doneTime: { fontFamily: Font.display, fontSize: 12, lineHeight: 16, width: 40 },
  doneTeam: { flex: 1, minWidth: 0, fontFamily: Font.body800, fontSize: 12, lineHeight: 17 },
  doneCount: { fontFamily: Font.display, fontSize: 12, lineHeight: 16 },
  doneNoPro: { fontFamily: Font.body700, fontSize: 11, lineHeight: 15, color: Colors.inkSub },
});
