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
        <StatCells
          framed
          cells={[
            { label: '오늘 세션', value: String(view.sessions) },
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

/** 누가 프로로 출석했는지 · 언제: 글자만 (프로 = 보라, 아직 = 빨강) */
function proLine(row: SessionRow) {
  const who = row.proCheckedInBy === 'STAFF' ? `스텝 ${row.proCheckedInName ?? ''}${row.proName ? ` (${row.proName} 대신)` : ''}` : `프로 ${row.proName ?? '미정'}`;
  if (row.phase === 'soon') return { who, state: `${fmtMin(row.start - QR_BEFORE)}부터 출석`, color: Colors.inkSub };
  if (row.proCheckedInAt) return { who, state: `출석 ✓ ${clock(row.proCheckedInAt)}`, color: Colors.purple };
  return { who, state: '아직 안 왔어요', color: '#B23A5A' };
}

function SessionCard({ row }: { row: SessionRow }) {
  const pro = proLine(row);
  return (
    <View style={styles.card} accessible accessibilityLabel={`${lang(row.lang).ko} ${row.teamName} ${row.level}, 멤버 ${row.checkedIn}명, ${pro.who} ${pro.state}`}>
      <View style={styles.row1}>
        <LangChip code={row.lang} />
        <PText style={styles.team} numberOfLines={1}>
          {row.teamName} · {row.level}
        </PText>
        <PText style={styles.count}>{row.checkedIn}명</PText>
      </View>
      <View style={styles.row2}>
        <PText style={styles.who} numberOfLines={1}>
          {pro.who}
        </PText>
        <PText style={styles.proState} color={pro.color}>
          {pro.state}
        </PText>
      </View>
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
          <PText style={styles.doneNoPro}>{r.proCheckedInBy === 'STAFF' ? '스텝 ✓' : r.proCheckedInBy ? '프로 ✓' : '프로 없음'}</PText>
        </View>
      ))}
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
  card: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 16, backgroundColor: Colors.white, paddingHorizontal: 12, paddingVertical: 10, gap: 6 },
  row1: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lang: { width: 54, height: 20, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  langT: { fontFamily: Font.body900, fontSize: 11, lineHeight: 15 },
  team: { flex: 1, minWidth: 0, fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  count: { fontFamily: Font.display, fontSize: 15, lineHeight: 20 },
  row2: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  who: { flex: 1, minWidth: 0, fontFamily: Font.body700, fontSize: 13, lineHeight: 18, color: Colors.inkSub },
  proState: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18 },
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
  doneNoPro: { fontFamily: Font.body700, fontSize: 11, lineHeight: 15, color: Colors.inkSub },
});
