import { StyleSheet, View } from 'react-native';

import { useMyPage } from '@/api/use-my-page';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { proRateRewardLine } from '@/data/my';
import { useMe } from '@/state/me';

/**
 * PRO'S NOTE 화면 맨 위: 이번 달 출석률 · 출석 수 + 출석률 스파크까지 남은 정도 (프로에게만 · 2026-11-28).
 * 마이 '출석률' 칸을 누르면 이 화면으로 와요. 값은 마이 BFF proStats 그대로.
 */
export function ProRateBox() {
  const isPro = useMe((m) => m.role === 'leader');
  const stats = useMyPage().data?.proStats;
  if (!isPro || !stats) return null;
  return (
    <View style={styles.box} accessible accessibilityLabel={`이번 달 출석률 ${stats.attendanceRate ?? '–'}% · 출석 ${stats.attendanceChecks}회 · ${proRateRewardLine(stats.sessionsThisMonth, stats.attendanceChecks)}`}>
      <PText style={styles.b}>{`출석률 ${stats.attendanceRate ?? '–'}% · 출석 ${stats.attendanceChecks}`}</PText>
      <PText style={styles.s}>{proRateRewardLine(stats.sessionsThisMonth, stats.attendanceChecks)}</PText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 4, padding: 14, borderWidth: 2, borderColor: Colors.ink, borderRadius: 14, backgroundColor: Colors.white },
  b: { fontFamily: Font.body900, fontSize: 17, lineHeight: 24 },
  s: { fontFamily: Font.body800, fontSize: 13, lineHeight: 19, color: Colors.purple },
});
