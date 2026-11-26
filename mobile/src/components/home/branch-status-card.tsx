import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useBranchToday } from '@/api/use-branch-today';
import { Pressable } from '@/components/ui/pressable';
import { Raised } from '@/components/ui/raised';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors, Radius } from '@/constants/theme';
import { LANGS } from '@/data/home';
import { sfx } from '@/lib/feedback';
import type { BranchTodayView } from '@/lib/branch-today-view';

import { fmtMin } from './attendance';

const BRANCH_TODAY = '/branch/today' as Href;

const langKo = (key: string) => LANGS.find((l) => l.key === key)?.ko ?? key;

/** 다음 세션 한 줄: '지금 출석 중 19:30 · 영어 3팀 · 일본어 2팀' */
function nextLine(v: BranchTodayView) {
  if (!v.next) return v.sessions ? '오늘 세션이 모두 끝났어요' : null;
  const teams = v.next.rows.map((r) => `${langKo(r.lang)} ${r.teamName}`).join(' · ');
  return `${v.next.phase === 'open' ? '지금 출석 중' : '다음 세션'} ${fmtMin(v.next.start)} · ${teams}`;
}

/**
 * 지점 관리자 홈: 출석 카드 아래 '하남점 현황' 요약 (docs/pages/10-roles.md 4장 · 시안 B).
 * 숫자 세 칸만 — 오늘 세션 · 프로 출석(몇 명) · 멤버 출석(몇 명). 자세한 건 모두 보기(/branch/today).
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
  const line = view ? nextLine(view) : null;
  return (
    <Pressable onPress={open} accessibilityRole="button" accessibilityLabel={`${name} 현황${view ? ` · 프로 출석 ${view.proCount}명 · 멤버 출석 ${view.members}명` : ''}`}>
      {({ pressed }) => (
        <Raised radius={Radius.cardSm} pressed={pressed}>
          <View style={styles.card}>
            <View style={styles.head}>
              <PText style={styles.title}>{name} 현황</PText>
              {!empty && !isError ? <PText style={styles.more}>모두 보기 ›</PText> : null}
            </View>
            {isError ? (
              <PText style={styles.line}>현황을 못 불러왔어요 · 누르면 다시 받아요</PText>
            ) : empty ? (
              <PText style={styles.line}>오늘은 {name} 세션이 없어요</PText>
            ) : (
              <>
                <View style={styles.nums}>
                  <Num value={view ? String(view.sessions) : '–'} label="오늘 세션" />
                  <Num
                    value={view ? String(view.proCount) : '–'}
                    label="프로 출석"
                    sub={view && view.proByStaff > 0 ? `프로 ${view.proByPro} · 스텝 ${view.proByStaff}` : undefined}
                    tone="pro"
                  />
                  <Num value={view ? String(view.members) : '–'} label="멤버 출석" tone="member" />
                </View>
                {line ? (
                  <PText style={styles.line} numberOfLines={1}>
                    {line}
                  </PText>
                ) : null}
              </>
            )}
          </View>
        </Raised>
      )}
    </Pressable>
  );
}

/** 숫자 칸 (마이 숫자 칸 MyStats 와 같은 모양 · 크림 바탕). 프로 = 보라 숫자, 멤버 = 노랑 밑줄 */
export function Num({ value, label, sub, tone }: { value: string; label: string; sub?: string; tone?: 'pro' | 'member' }) {
  return (
    <View style={styles.num}>
      <PText style={[styles.numV, tone === 'pro' && styles.numPro]}>{value}</PText>
      <View style={styles.numLRow}>
        {tone ? <View style={[styles.dot, tone === 'pro' ? styles.dotPro : styles.dotMember]} /> : null}
        <PText style={styles.numL} numberOfLines={1}>
          {label}
        </PText>
      </View>
      {sub ? (
        <PText style={styles.numSub} numberOfLines={1}>
          {sub}
        </PText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 2, borderColor: Colors.ink, borderRadius: Radius.cardSm, backgroundColor: Colors.white, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  more: { fontFamily: Font.body900, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
  nums: { flexDirection: 'row', gap: 8 },
  num: { flex: 1, minWidth: 0, alignItems: 'center', gap: 1, paddingVertical: 8, paddingHorizontal: 2, borderWidth: 2, borderColor: Colors.ink, borderRadius: 14, backgroundColor: Colors.cream },
  numV: { fontFamily: Font.display, fontSize: 18, lineHeight: 24 },
  numPro: { color: Colors.purple },
  numLRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  dotPro: { backgroundColor: Colors.purple },
  dotMember: { backgroundColor: Colors.yellow, borderWidth: 1.5, borderColor: Colors.ink },
  numL: { fontFamily: Font.body800, fontSize: 11, lineHeight: 16, color: Colors.inkSub },
  numSub: { fontFamily: Font.body700, fontSize: 10, lineHeight: 14, color: Colors.purple },
  line: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
});
