import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useBranchToday } from '@/api/use-branch-today';
import { Pressable } from '@/components/ui/pressable';
import { Raised } from '@/components/ui/raised';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { sfx } from '@/lib/feedback';
import type { BranchTodayView } from '@/lib/branch-today-view';

import { fmtMin } from './attendance';

const BRANCH_TODAY = '/branch/today' as Href;
const RADIUS = 18;
const LINE = 2.5;

/** 아래 한 줄: '출석 중 19:30 · 영어 3팀 · 일본어 2팀' */
function nextLine(v: BranchTodayView) {
  if (!v.next) return v.sessions ? '오늘 스터디가 모두 끝났어요' : null;
  const teams = v.next.rows.map((r) => r.teamName).join(' · ');
  return `${v.next.phase === 'open' ? '출석 중' : '다음 스터디'} ${fmtMin(v.next.start)} · ${teams}`;
}

/** 위 출석 카드(클래퍼보드)와 같은 줄무늬 — 얇게 (session-card ClapperArm 과 같은 방식: 기울인 막대) */
const STRIPE_H = 16;
const STRIPE = 12;
const BAR_W = STRIPE / Math.sin((55 * Math.PI) / 180);
function Stripes() {
  const [w, setW] = useState(0);
  const n = w ? Math.ceil((w + STRIPE_H) / (BAR_W * 2)) + 2 : 0;
  return (
    <View style={styles.stripes} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {Array.from({ length: n }, (_, i) => (
        <View key={i} style={[styles.bar, { left: (i - 1) * BAR_W * 2 }]} />
      ))}
    </View>
  );
}

type Cell = { label: string; value: string; tone?: 'pro' | 'staff' | 'member' };

/**
 * 지점 관리자 홈: 출석 카드 아래 '하남점 현황' (docs/pages/10-roles.md 4장 · 카드 시안 A 슬레이트).
 * 칸 넷 — 오늘 스터디 · 프로 출석 · 스텝 출석(스텝이 프로 대신) · 멤버 출석. 모두 몇 명인지만. 자세한 건 모두 보기(/branch/today).
 */
export function BranchStatusCard() {
  const { view, isError, refetch } = useBranchToday();
  const name = view?.branchName ?? '지점';
  const empty = view && view.sessions === 0;
  const open = () => {
    if (isError) return refetch();
    if (empty) return;
    sfx('tap');
    router.push(BRANCH_TODAY);
  };
  const v = (n: number | undefined) => (n === undefined ? '–' : String(n));
  const cells: Cell[] = [
    { label: '오늘 스터디', value: v(view?.sessions) },
    { label: '프로 출석', value: v(view?.proByPro), tone: 'pro' },
    { label: '스텝 출석', value: v(view?.proByStaff), tone: 'staff' },
    { label: '멤버 출석', value: v(view?.members), tone: 'member' },
  ];
  const line = isError ? '현황을 못 불러왔어요 · 누르면 다시 받아요' : empty ? `오늘은 ${name} 스터디가 없어요` : view ? nextLine(view) : '현황을 받는 중이에요';
  return (
    <Pressable
      onPress={open}
      accessibilityRole="button"
      accessibilityLabel={`${name} 현황${view ? ` · 프로 출석 ${view.proByPro}명 · 스텝 출석 ${view.proByStaff}명 · 멤버 출석 ${view.members}명` : ''}`}>
      {({ pressed }) => (
        <Raised radius={RADIUS} pressed={pressed}>
          <View style={styles.card}>
            <Stripes />
            <View style={styles.head}>
              <PText style={styles.title}>{name} 현황</PText>
              {!empty && !isError ? <PText style={styles.more}>모두 보기 ›</PText> : null}
            </View>
            {!empty && !isError ? <StatCells cells={cells} /> : null}
            {line ? (
              <View style={styles.foot}>
                {view?.next?.phase === 'open' ? <View style={styles.live} /> : null}
                <PText style={styles.footT} numberOfLines={1}>
                  {line}
                </PText>
              </View>
            ) : null}
          </View>
        </Raised>
      )}
    </Pressable>
  );
}

/** 칸 나눔 숫자 줄 (출석 카드 위 칸과 같은 잉크 선). 프로 = 보라, 스텝 = 잉크 바탕 노랑(앱 STAFF), 멤버 = 노랑 칸 */
export function StatCells({ cells, framed = false }: { cells: Cell[]; framed?: boolean }) {
  return (
    <View style={[styles.cells, framed && styles.cellsFramed]}>
      {cells.map((c, i) => (
        <View key={c.label} style={[styles.cell, i > 0 && styles.cellLine, c.tone === 'member' && styles.cellMember, c.tone === 'staff' && styles.cellStaff]}>
          <PText style={styles.cellL} color={c.tone === 'pro' ? Colors.purple : c.tone === 'staff' ? Colors.yellow : Colors.inkSub} numberOfLines={1}>
            {c.label}
          </PText>
          <PText style={styles.cellV} color={c.tone === 'pro' ? Colors.purple : c.tone === 'staff' ? Colors.yellow : Colors.ink}>
            {c.value}
          </PText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: LINE, borderColor: Colors.ink, borderRadius: RADIUS, backgroundColor: Colors.cream, overflow: 'hidden' },
  stripes: { height: STRIPE_H, overflow: 'hidden', borderBottomWidth: LINE, borderColor: Colors.ink, backgroundColor: Colors.cream },
  bar: { position: 'absolute', top: -4, height: STRIPE_H + 8, width: BAR_W, backgroundColor: Colors.ink, transform: [{ skewX: '-35deg' }] },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.white, borderBottomWidth: LINE, borderColor: Colors.ink },
  title: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  more: { fontFamily: Font.body900, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
  cells: { flexDirection: 'row', borderBottomWidth: LINE, borderColor: Colors.ink },
  cellsFramed: { borderWidth: LINE, borderRadius: 14, overflow: 'hidden', backgroundColor: Colors.cream },
  cell: { flex: 1, minWidth: 0, paddingHorizontal: 9, paddingTop: 7, paddingBottom: 8 },
  cellLine: { borderLeftWidth: LINE, borderColor: Colors.ink },
  cellMember: { backgroundColor: Colors.yellow },
  cellStaff: { backgroundColor: Colors.ink },
  cellL: { fontFamily: Font.body800, fontSize: 11, lineHeight: 16 },
  cellV: { fontFamily: Font.display, fontSize: 22, lineHeight: 28 },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: Colors.lavender },
  live: { width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.rosePink, borderWidth: 1.5, borderColor: Colors.ink },
  footT: { flex: 1, minWidth: 0, fontFamily: Font.body800, fontSize: 12, lineHeight: 17 },
});
