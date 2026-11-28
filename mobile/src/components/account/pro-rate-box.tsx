import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useMyPage } from '@/api/use-my-page';
import { nowDate } from '@/components/home/attendance';
import { FrameLine, StatCells, Stripes, type Cell } from '@/components/home/branch-status-card';
import { Icon as MeetIcon } from '@/components/meet/icons';
import { Raised } from '@/components/ui/raised';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { proRateLevel, proRateReward, SPARK_PRO_RATE_MIN_SESSIONS, type ProRateLevel, type ProRateReward } from '@/data/my';
import { useMe } from '@/state/me';

/** 홈 '하남점 현황' 카드와 같은 슬레이트 (둥글기 · 선 · 안쪽 1px 겹침) */
const RADIUS = 18;
const LINE = 2.5;
const INSET = LINE - 1;

/** 출석률 칸 색: 높음 초록 · 중간 주황 · 낮음 빨강 */
const RATE_COLOR: Record<ProRateLevel, string> = { high: Colors.rateHigh, mid: Colors.rateMid, low: Colors.rateLow };

/** 반짝이 (네 갈래 별) — 100% 달성 카드 장식 */
function Sparkle({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path d="M12 1.5c.7 5.6 4.9 9.8 10.5 10.5-5.6.7-9.8 4.9-10.5 10.5C11.3 16.9 7.1 12.7 1.5 12 7.1 11.3 11.3 7.1 12 1.5Z" fill={color} stroke={Colors.ink} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  );
}

/** 아래 한 줄: 다음 보상까지 · 언제 들어오는지 ('지금 받으면' 은 바로 받는 걸로 읽혀서 안 써요) */
function nextLine(r: ProRateReward) {
  if (r.kind === 'few') return `맡은 세션이 ${SPARK_PRO_RATE_MIN_SESSIONS}개 이상인 달만 출석률 스파크가 있어요`;
  if (!r.next) return '최고 보상 달성 · 다음 달 1일에 들어와요';
  return `${r.next.need}회 더 출석하면 +${r.next.amount} · 다음 달 1일에 들어와요`;
}

/**
 * PRO'S NOTE 화면 맨 위: 이번 달 출석률 슬레이트 (프로에게만 · 2026-11-28 시안 D).
 * 줄무늬 · 'n월 출석률' 줄 · 칸 셋(출석률 · 출석 n / 맡은 n · 스파크 예정) · 아래 다음 보상까지.
 * 마이 '출석률' 칸을 누르면 이 화면으로 와요. 값은 마이 BFF proStats 그대로.
 */
export function ProRateBox() {
  const isPro = useMe((m) => m.role === 'leader');
  const stats = useMyPage().data?.proStats;
  if (!isPro || !stats) return null;
  const r = proRateReward(stats.sessionsThisMonth, stats.attendanceChecks);
  const rate = stats.attendanceRate ?? r.rate;
  const earned = r.kind === 'on' ? r.earned : 0;
  const line = nextLine(r);
  const month = nowDate().getMonth() + 1;
  // 100% 달성 달은 더 화려하게: 노란 머리줄 · 반짝이 · 초록 출석률 칸 · 잉크 바닥줄 (2026-11-28)
  const perfect = r.kind === 'on' && !r.next;
  const cells: Cell[] = [
    perfect
      ? { label: '출석률', value: `${rate}%`, tone: 'pro', color: Colors.white, bg: Colors.rateHigh }
      : { label: '출석률', value: `${rate}%`, tone: 'pro', color: RATE_COLOR[proRateLevel(rate)] },
    // 검정 칸 위 회색 작은 글씨는 안 읽혀서 맡은 수까지 한 숫자로
    { label: '출석', value: `${stats.attendanceChecks}/${stats.sessionsThisMonth}`, tone: 'staff' },
    // 아직 90% 아래거나 맡은 세션이 적은 달은 '–'
    { label: '스파크 예정', value: earned ? `+${earned}` : '–', tone: 'member' },
  ];
  return (
    <Raised radius={RADIUS}>
      <View
        style={styles.card}
        accessible
        accessibilityLabel={`${month}월 출석률 ${rate}% · 출석 ${stats.attendanceChecks}회 / 맡은 세션 ${stats.sessionsThisMonth}개${earned ? ` · 스파크 +${earned} 예정` : ''} · ${line}`}>
        <Stripes />
        {perfect ? (
          // 머리줄은 평소처럼 흰 바탕 + 오른쪽에 초록 '왕관 100% 달성' 배지 (2026-11-28 노란 줄 · 반짝이 줄은 별로라 바꿈)
          <View style={[styles.head, styles.headPerfect]}>
            <PText style={styles.title}>{`${month}월 출석률`}</PText>
            <View style={styles.badge}>
              <MeetIcon name="crown" size={14} color={Colors.ink} fill={Colors.yellow} strokeWidth={2} />
              <PText style={styles.badgeT}>100% 달성</PText>
            </View>
          </View>
        ) : (
          <View style={styles.head}>
            <PText style={styles.title}>{`${month}월 출석률`}</PText>
            <PText style={styles.only} numberOfLines={1}>
              프로에게만 보여요
            </PText>
          </View>
        )}
        <StatCells cells={cells} />
        {perfect ? (
          <View style={[styles.foot, styles.footPerfect]}>
            <Sparkle size={14} color={Colors.yellow} />
            <PText style={[styles.footT, styles.footTPerfect]}>{`한 번도 안 빠진 최고의 프로! · 다음 달 1일에 +${earned}`}</PText>
            <Sparkle size={14} color={Colors.yellow} />
          </View>
        ) : (
          <View style={styles.foot}>
            {r.kind === 'on' && r.next ? <View style={styles.dot} /> : null}
            <PText style={styles.footT}>{line}</PText>
          </View>
        )}
        <FrameLine radius={RADIUS} />
      </View>
    </Raised>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS, backgroundColor: Colors.cream, overflow: 'hidden', paddingHorizontal: INSET, paddingBottom: INSET },
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.white, borderBottomWidth: LINE, borderColor: Colors.ink },
  title: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  headPerfect: { alignItems: 'center', paddingVertical: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.rateHigh },
  badgeT: { fontFamily: Font.body900, fontSize: 12, lineHeight: 16, color: Colors.white },
  only: { flexShrink: 1, fontFamily: Font.body700, fontSize: 11, lineHeight: 16, color: Colors.inkSub },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: Colors.lavender },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.rosePink, borderWidth: 1.5, borderColor: Colors.ink },
  footT: { flex: 1, minWidth: 0, fontFamily: Font.body800, fontSize: 12, lineHeight: 17 },
  footPerfect: { backgroundColor: Colors.ink },
  footTPerfect: { color: Colors.yellow, textAlign: 'center' },
});
