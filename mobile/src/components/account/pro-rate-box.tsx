import { StyleSheet, View } from 'react-native';

import { useMyPage } from '@/api/use-my-page';
import { Lift } from '@/components/account/parts';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { proRateReward, SPARK_PRO_RATE, SPARK_PRO_RATE_MIN_SESSIONS, type ProRateReward } from '@/data/my';
import { useMe } from '@/state/me';

const RADIUS = 22;
const LINE = 2.5;
/** 막대 위 눈금: 90% · 100% (보상이 바뀌는 자리) */
const MARKS = [...SPARK_PRO_RATE].map((r) => r.minRate).sort((a, b) => a - b);

/** 아래 한 줄: 다음 보상까지 · 언제 들어오는지 ('지금 받으면' 은 바로 받는 걸로 읽혀서 안 써요) */
function nextLine(r: ProRateReward) {
  if (r.kind === 'few') return `맡은 세션이 ${SPARK_PRO_RATE_MIN_SESSIONS}개 이상인 달만 출석률 스파크가 있어요`;
  if (!r.next) return '최고 보상 달성 · 다음 달 1일에 들어와요';
  return `${r.next.need}회 더 출석하면 +${r.next.amount} · 다음 달 1일에 들어와요`;
}

/**
 * PRO'S NOTE 화면 맨 위: 이번 달 출석률 카드 (프로에게만 · 2026-11-28).
 * 큰 숫자 · 출석 n / 맡은 n · 막대(90% · 100% 눈금) · 오른쪽 위 '+150 예정' 알약 · 아래 다음 보상까지.
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
  return (
    <Lift radius={RADIUS}>
      <View
        style={styles.card}
        accessible
        accessibilityLabel={`이번 달 출석률 ${rate}% · 출석 ${stats.attendanceChecks}회 / 맡은 세션 ${stats.sessionsThisMonth}개${earned ? ` · 스파크 +${earned} 예정` : ''} · ${line}`}>
        <View style={styles.top}>
          <PText style={styles.eyebrow}>이번 달 출석률</PText>
          {earned ? (
            <View style={styles.pill}>
              <PText style={styles.pillT}>{`+${earned} 예정`}</PText>
            </View>
          ) : null}
        </View>
        <View style={styles.numRow}>
          <PText style={styles.num}>
            {rate}
            <PText style={styles.pct}>%</PText>
          </PText>
          <PText style={styles.count}>{`출석 ${stats.attendanceChecks} / ${stats.sessionsThisMonth}`}</PText>
        </View>
        <View style={styles.barWrap}>
          <View style={styles.bar}>
            <View style={[styles.fill, { width: `${Math.min(100, rate)}%` }]} />
            {MARKS.filter((m) => m < 100).map((m) => (
              <View key={m} style={[styles.tick, { left: `${m}%` }]} />
            ))}
          </View>
          {/* 눈금 이름은 막대 끝(100%) 말고 중간 눈금만 — 둘이 가까워 겹쳐요. 글자 끝을 눈금에 맞춰요 */}
          <View style={styles.marks}>
            {MARKS.filter((m) => m < 100).map((m) => (
              <PText key={m} style={[styles.markT, { right: `${100 - m}%` }]}>{`${m}%`}</PText>
            ))}
          </View>
        </View>
        <View style={styles.foot}>
          <PText style={styles.footT}>{line}</PText>
        </View>
        {/* 테두리는 내용 위에 덮어 그려요 — 아래 보라 띠와 둥근 선 사이에 틈이 안 보이게 */}
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.frame]} />
      </View>
    </Lift>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS, backgroundColor: Colors.white, overflow: 'hidden' },
  frame: { borderWidth: LINE, borderColor: Colors.ink, borderRadius: RADIUS },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 16 },
  eyebrow: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow },
  pillT: { fontFamily: Font.body900, fontSize: 12, lineHeight: 16 },
  numRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, paddingHorizontal: 18, marginTop: 2 },
  num: { fontFamily: Font.display, fontSize: 40, lineHeight: 48, color: Colors.purple },
  pct: { fontFamily: Font.display, fontSize: 22, lineHeight: 48, color: Colors.purple },
  count: { fontFamily: Font.body800, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
  barWrap: { paddingHorizontal: 18, marginTop: 6 },
  bar: { height: 14, borderRadius: 7, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.cream, overflow: 'hidden' },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: Colors.purple },
  tick: { position: 'absolute', top: 0, bottom: 0, width: 2, marginLeft: -1, backgroundColor: Colors.ink },
  marks: { height: 16, marginTop: 3 },
  markT: { position: 'absolute', marginRight: 4, fontFamily: Font.body800, fontSize: 10.5, lineHeight: 15, color: Colors.inkSub },
  foot: { marginTop: 10, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 12, backgroundColor: Colors.lavender, borderTopWidth: LINE, borderColor: Colors.ink },
  footT: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 18, color: Colors.purple },
});
