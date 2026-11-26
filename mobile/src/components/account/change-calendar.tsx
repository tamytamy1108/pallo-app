import { StyleSheet, View } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { isSameDay, todayMark } from '@/components/ui/today-mark';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { DOW } from '@/data/account';
import { sfx } from '@/lib/feedback';

import { Box } from './parts';

type Props = {
  /** 2026년 기준 달 번호 (12 = 2027년 1월 · data/account monIdx) */
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
  /** 몇 달을 위아래로 이어 보여 줄지 (기본 1) — 끝나는 날이 다음 달이면 2로, 넘겨 보지 않아도 끝이 보여요 */
  months?: number;
};

/** 새 일정 날짜 고르기 달력 (프로토타입 cgCalHTML · .cg-cal): min ~ max 만 고를 수 있어요 (그 밖 · 지난 날은 흐리게) */
export function ChangeCalendar({ mon, minMon, maxMon, min, max, start, end, onMonth, onPick, months = 1 }: Props) {
  const st = start ? new Date(start) : null;
  const now = new Date();
  const shown = Array.from({ length: Math.max(1, months) }, (_, i) => mon + i);
  const last = shown[shown.length - 1];

  return (
    <Box style={styles.cal}>
      {shown.map((mi, k) => {
        const first = new Date(2026, mi, 1);
        const y = first.getFullYear();
        const m = first.getMonth();
        const days = new Date(y, m + 1, 0).getDate();
        const cells: (Date | null)[] = [...Array.from({ length: first.getDay() }, () => null), ...Array.from({ length: days }, (_, i) => new Date(y, m, i + 1))];
        return (
          <View key={mi} style={k > 0 ? styles.next : undefined}>
            {/* 이어 보이는 달은 위 달 머리줄의 ‹ › 로 같이 넘어가요 (앞은 첫 달에 · 뒤는 마지막 달에) */}
            <View style={styles.mh}>
              {k === 0 ? <MonBtn label="‹" a11y="이전 달" disabled={mon <= minMon} onPress={() => onMonth(-1)} /> : <View style={styles.mbGap} />}
              <PText style={styles.mt} accessibilityRole="header">{`${y}년 ${m + 1}월`}</PText>
              {mi === last ? <MonBtn label="›" a11y="다음 달" disabled={last >= maxMon} onPress={() => onMonth(1)} /> : <View style={styles.mbGap} />}
            </View>
            <View style={styles.gd}>
              {k === 0
                ? DOW.map((w) => (
                    <View key={w} style={styles.cell}>
                      <PText style={styles.w}>{w}</PText>
                    </View>
                  ))
                : null}
              {cells.map((d, i) => {
                if (!d) return <View key={`e${i}`} style={styles.cell} />;
                const off = d < min || d > max;
                const on = !!st && d.getTime() === st.getTime();
                const isEnd = !!end && d.getTime() === end.getTime();
                const inR = !!end && !!st && d > st && d <= end;
                const today = isSameDay(d, now);
                return (
                  <View key={d.getTime()} style={styles.cell}>
                    <Pressable
                      disabled={off}
                      onPress={() => {
                        sfx('tap');
                        onPick(d.getTime());
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`${m + 1}월 ${d.getDate()}일${today ? ' · 오늘' : ''}${on ? ' · 시작' : isEnd ? ' · 끝' : ''}`}
                      accessibilityState={{ disabled: off, selected: on || isEnd }}
                      style={[styles.dd, today && todayMark.cell, inR && styles.in, (on || isEnd) && styles.on]}>
                      <PText style={[styles.ddText, today && todayMark.text]} color={on || isEnd ? Colors.white : today ? Colors.purple : off ? '#C9C2B4' : Colors.ink}>
                        {d.getDate()}
                      </PText>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
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
  mbGap: { width: 36, height: 36 },
  next: { marginTop: 10, paddingTop: 10, borderTopWidth: 1.5, borderColor: Colors.line },
  mbText: { fontFamily: Font.body900, fontSize: 18, lineHeight: 22 },
  gd: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -2 },
  cell: { width: `${100 / 7}%`, padding: 2, alignItems: 'stretch' },
  w: { textAlign: 'center', fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub, paddingBottom: 2 },
  dd: { aspectRatio: 1, maxHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  in: { backgroundColor: '#E7E0F6', borderRadius: 0 },
  on: { backgroundColor: Colors.purple, borderRadius: 12 },
  ddText: { fontFamily: Font.body800, fontSize: 14, lineHeight: 20 },
});
