import { ScrollView, StyleSheet, View } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

import { ERROR_RED, useFieldInvalid } from './parts';

/**
 * 체험 상담 날짜 · 시간 고르기 (프로토타입 onboarding-options.html #t-pick 의 .t1-wait · .dys/.dy · .sls/.sl · .t1-note).
 * 시간표는 서버 `GET /trial-slots?branchCode=` — 지점 상담 가능시간에서 오늘부터 5일 (오늘은 지난 시각을 빼요).
 * 예약이 아니라 희망 시간이라 마감 칸은 없어요 (full 은 늘 false — 칸 모양만 남겨 둬요).
 */

export type TrialDayTile = {
  /** 저장하는 값 'YYYY-MM-DD' (온보딩 trialDay) */
  key: string;
  month: number;
  date: number;
  /** 요일 한 글자 (월 · 화 …) */
  week: string;
};

export type TrialSlot = { time: string; full: boolean };

const WEEK = '일월화수목금토';
const pad = (n: number) => String(n).padStart(2, '0');

/** 'YYYY-MM-DD' → 날짜 칸 (기기 달력 기준 요일) */
export function dayTile(key: string): TrialDayTile {
  const [y, m, d] = key.split('-').map(Number);
  const at = new Date(y, m - 1, d);
  return { key, month: at.getMonth() + 1, date: at.getDate(), week: WEEK[at.getDay()] };
}

/** 오늘부터 5일 (스토리 · 서버 응답 전 모양 맞추기용) */
export function trialDayTiles(now = new Date()): TrialDayTile[] {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    return dayTile(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  });
}

/** 서버 시간표(날짜마다 시각) → 날짜 칸 · 고른 날의 시간 칸 */
export function slotDays(days: { date: string; times: string[] }[]): TrialDayTile[] {
  return days.map((d) => dayTile(d.date));
}
export function slotsOn(days: { date: string; times: string[] }[], day: string): TrialSlot[] {
  return (days.find((d) => d.date === day)?.times ?? []).map((time) => ({ time, full: false }));
}

/** '2026-11-28' + '15:00' → '11월 28일 (금) 15:00' */
export function trialWhen(day: string, time: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!m) return time;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEK[d.getDay()]}) ${time}`.trim();
}

/** 지점을 고르기 전 안내 (점선 상자). 시간을 안 고른 채 예약하려 하면 빨간 점선 */
export function TrialWait() {
  const invalid = useFieldInvalid();
  return (
    <View style={[styles.wait, invalid && styles.waitInvalid]}>
      <PText style={styles.waitText}>{'지점을 고르면 상담할 수 있는\n날짜 · 시간이 보여요'}</PText>
    </View>
  );
}

/** 날짜 5칸 + 시간 6칸(3열) + 안내 한 줄 */
export function TrialSlots({
  days,
  day,
  onDay,
  slots,
  time,
  onTime,
  note,
}: {
  days: TrialDayTile[];
  day: string;
  onDay: (key: string) => void;
  slots: TrialSlot[];
  time: string;
  onTime: (time: string) => void;
  note: string;
}) {
  return (
    <View>
      <DayStrip days={days} day={day} onDay={onDay} />
      {slots.length === 0 ? <PText style={styles.noSlot}>이 날은 상담할 수 있는 시간이 없어요. 다른 날을 골라 주세요</PText> : null}
      <View style={styles.slots} accessibilityRole="radiogroup" accessibilityLabel="상담 시간">
        {slots.map((s) => {
          const on = !s.full && s.time === time;
          return (
            <View key={s.time} style={styles.slotCell}>
              <Pressable
                sound="pick"
                disabled={s.full}
                onPress={() => onTime(s.time)}
                accessibilityRole="radio"
                accessibilityLabel={s.full ? `${s.time} 마감` : s.time}
                accessibilityState={{ selected: on, checked: on, disabled: s.full }}
                style={({ pressed }) => [styles.slot, on && styles.slotOn, s.full && styles.slotFull, pressed && styles.pressed]}>
                <PText style={[styles.slotText, on && styles.slotTextOn, s.full && styles.slotTextFull]}>{s.time}</PText>
              </Pressable>
            </View>
          );
        })}
      </View>
      <PText style={styles.note}>{note}</PText>
    </View>
  );
}

/**
 * 날짜 줄: 서버가 준 날짜(오늘부터 5일)를 옆으로 넘겨 골라요. 첫 칸과 1일에는 달도 같이 보여요.
 * 원격 시안의 '2주 + 달력' 은 서버 시간표가 5일이라 달력 칸은 빼 뒀어요 (GET /trial-slots 가 기간을 늘리면 다시).
 */
function DayStrip({ days, day, onDay }: { days: TrialDayTile[]; day: string; onDay: (key: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.strip} contentContainerStyle={styles.days} accessibilityRole="radiogroup" accessibilityLabel="상담 날짜">
      {days.map((d, i) => {
        const on = d.key === day;
        return (
          <Pressable
            key={d.key}
            sound="pick"
            onPress={() => onDay(d.key)}
            accessibilityRole="radio"
            accessibilityLabel={`${d.month}월 ${d.date}일 ${d.week}요일`}
            accessibilityState={{ selected: on, checked: on }}
            style={({ pressed }) => [styles.day, on && styles.dayOn, pressed && styles.pressed]}>
            <PText style={[styles.dayWeek, on && styles.dayWeekOn]}>{d.date === 1 || i === 0 ? `${d.month}월 ${d.week}` : d.week}</PText>
            <PText style={[styles.dayNum, on && styles.textOnDark]}>{d.date}</PText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wait: { minHeight: 76, paddingVertical: 12, borderRadius: 14, borderWidth: 2, borderStyle: 'dashed', borderColor: '#CFC6B2', alignItems: 'center', justifyContent: 'center' },
  waitInvalid: { borderColor: ERROR_RED },
  waitText: { textAlign: 'center', fontFamily: Font.body800, fontSize: 13.5, lineHeight: 20, color: Colors.inkSub },
  strip: { flexGrow: 0, marginHorizontal: -2 },
  days: { flexDirection: 'row', gap: 7, paddingHorizontal: 2, paddingVertical: 2 },
  day: { width: 56, height: 62, borderRadius: 14, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  dayOn: { backgroundColor: Colors.purple, borderColor: Colors.purple },
  dayWeek: { fontFamily: Font.body800, fontSize: 12, lineHeight: 16, color: Colors.inkSub },
  dayWeekOn: { color: '#D9CFF2' },
  dayNum: { fontFamily: Font.display, fontSize: 17, lineHeight: 22 },
  textOnDark: { color: Colors.white },
  slots: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, marginHorizontal: -3.5 },
  slotCell: { width: '33.333%', padding: 3.5 },
  slot: { height: 46, borderRadius: 12, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  slotOn: { backgroundColor: Colors.lavender, borderColor: Colors.purple, outlineWidth: 2, outlineColor: Colors.purple, outlineStyle: 'solid' },
  slotFull: { borderColor: Colors.line, backgroundColor: '#F4EFE3' },
  slotText: { fontFamily: Font.display, fontSize: 14.5, lineHeight: 19 },
  slotTextOn: { color: Colors.purple },
  slotTextFull: { color: '#B4AC9B', textDecorationLine: 'line-through' },
  noSlot: { marginTop: 10, paddingVertical: 14, textAlign: 'center', fontFamily: Font.body800, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
  note: { marginTop: 8, fontFamily: Font.body800, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
  pressed: { opacity: 0.85 },
});
