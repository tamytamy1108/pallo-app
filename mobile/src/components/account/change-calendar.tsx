import { Pressable, StyleSheet, View } from 'react-native';

import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { DOW } from '@/data/account';
import { sfx } from '@/lib/feedback';

import { Box } from './parts';

type Props = {
  /** 2026년 기준 달 번호 (12 = 2027년 1월) */
  mon: number;
  minMon: number;
  maxMon: number;
  min: Date;
  max: Date;
  start: number | null;
  /** 쉬어가기면 끝나는 날까지 칠해요 */
  end: Date | null;
  onMonth: (delta: number) => void;
  onPick: (t: number) => void;
};

/** 새 일정 날짜 고르기 달력 (프로토타입 cgCalHTML · .cg-cal): 오늘 + 2주 ~ 이용권 끝나는 날만 고를 수 있어요 */
export function ChangeCalendar({ mon, minMon, maxMon, min, max, start, end, onMonth, onPick }: Props) {
  const first = new Date(2026, mon, 1);
  const y = first.getFullYear();
  const m = first.getMonth();
  const days = new Date(y, m + 1, 0).getDate();
  const st = start ? new Date(start) : null;
  const cells: (Date | null)[] = [...Array.from({ length: first.getDay() }, () => null), ...Array.from({ length: days }, (_, i) => new Date(y, m, i + 1))];

  return (
    <Box style={styles.cal}>
      <View style={styles.mh}>
        <MonBtn label="‹" a11y="이전 달" disabled={mon <= minMon} onPress={() => onMonth(-1)} />
        <PText style={styles.mt}>{`${y}년 ${m + 1}월`}</PText>
        <MonBtn label="›" a11y="다음 달" disabled={mon >= maxMon} onPress={() => onMonth(1)} />
      </View>
      <View style={styles.gd}>
        {DOW.map((w) => (
          <View key={w} style={styles.cell}>
            <PText style={styles.w}>{w}</PText>
          </View>
        ))}
        {cells.map((d, i) => {
          if (!d) return <View key={`e${i}`} style={styles.cell} />;
          const off = d < min || d > max;
          const on = !!st && d.getTime() === st.getTime();
          const isEnd = !!end && d.getTime() === end.getTime();
          const inR = !!end && !!st && d > st && d <= end;
          return (
            <View key={d.getTime()} style={styles.cell}>
              <Pressable
                disabled={off}
                onPress={() => {
                  sfx('tap');
                  onPick(d.getTime());
                }}
                accessibilityRole="button"
                accessibilityLabel={`${m + 1}월 ${d.getDate()}일`}
                accessibilityState={{ disabled: off, selected: on }}
                style={[styles.dd, inR && styles.in, (on || isEnd) && styles.on]}>
                <PText style={styles.ddText} color={on || isEnd ? Colors.white : off ? '#C9C2B4' : Colors.ink}>
                  {d.getDate()}
                </PText>
              </Pressable>
            </View>
          );
        })}
      </View>
    </Box>
  );
}

function MonBtn({ label, a11y, disabled, onPress }: { label: string; a11y: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        sfx('tap');
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ disabled }}
      hitSlop={4}
      style={[styles.mb, disabled && styles.mbOff]}>
      <PText style={styles.mbText}>{label}</PText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cal: { padding: 12 },
  mh: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, paddingBottom: 8 },
  mt: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  mb: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: Colors.line, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  mbOff: { opacity: 0.3 },
  mbText: { fontFamily: Font.body900, fontSize: 18, lineHeight: 22 },
  gd: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -2 },
  cell: { width: `${100 / 7}%`, padding: 2, alignItems: 'stretch' },
  w: { textAlign: 'center', fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub, paddingBottom: 2 },
  dd: { aspectRatio: 1, maxHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  in: { backgroundColor: '#E7E0F6', borderRadius: 0 },
  on: { backgroundColor: Colors.purple, borderRadius: 12 },
  ddText: { fontFamily: Font.body800, fontSize: 14, lineHeight: 20 },
});
