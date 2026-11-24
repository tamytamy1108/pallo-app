import { StyleSheet, View } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import type { StudyLang } from '@/state/me';

import { ERROR_RED, useFieldInvalid } from './parts';

/**
 * 체험 상담 날짜 · 시간 고르기 (프로토타입 onboarding-options.html #t-pick 의 .t1-wait · .dys/.dy · .sls/.sl · .t1-note).
 * 시간표는 가짜예요. 실제로는 48 `GET /trial-slots?branch=&date=&lang=` — 지점 · 언어 프로님 일정 (Q-O10).
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

/** 내일부터 5일 */
export function trialDayTiles(now = new Date()): TrialDayTile[] {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i + 1);
    return { key: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, month: d.getMonth() + 1, date: d.getDate(), week: WEEK[d.getDay()] };
  });
}

/** 언어마다 프로님 상담 시간이 달라요 (가짜) */
const TIMES: Record<StudyLang, readonly string[]> = {
  en: ['10:00', '11:00', '14:00', '15:00', '19:00', '20:00'],
  ja: ['10:30', '13:00', '14:30', '16:00', '19:30', '20:30'],
  zh: ['11:00', '13:30', '15:00', '17:00', '18:30', '20:00'],
  es: ['10:00', '12:00', '14:00', '16:30', '18:00', '19:30'],
};

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7);

/** 그 지점 · 날짜 · 언어의 상담 시간 6칸. 몇 칸은 마감 (가짜 · 한 칸은 늘 비워 둬요) */
export function trialSlots(branch: string, day: string, lang: StudyLang): TrialSlot[] {
  const slots = TIMES[lang].map((time) => ({ time, full: hash(branch + day + lang + time) % 3 === 0 }));
  if (slots.every((s) => s.full)) slots[slots.length - 1] = { ...slots[slots.length - 1], full: false };
  return slots;
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
      <View style={styles.days} accessibilityRole="radiogroup" accessibilityLabel="상담 날짜">
        {days.map((d) => {
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
              <PText style={[styles.dayWeek, on && styles.dayWeekOn]}>{d.week}</PText>
              <PText style={[styles.dayNum, on && styles.textOnDark]}>{d.date}</PText>
            </Pressable>
          );
        })}
      </View>
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

const styles = StyleSheet.create({
  wait: { minHeight: 76, paddingVertical: 12, borderRadius: 14, borderWidth: 2, borderStyle: 'dashed', borderColor: '#CFC6B2', alignItems: 'center', justifyContent: 'center' },
  waitInvalid: { borderColor: ERROR_RED },
  waitText: { textAlign: 'center', fontFamily: Font.body800, fontSize: 13.5, lineHeight: 20, color: Colors.inkSub },
  days: { flexDirection: 'row', gap: 7 },
  day: { flex: 1, height: 62, borderRadius: 14, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
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
  note: { marginTop: 8, fontFamily: Font.body800, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
  pressed: { opacity: 0.85 },
});
