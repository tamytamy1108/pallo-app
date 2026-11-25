import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { MonthCalendar } from '@/components/event/form-parts';
import { Pressable } from '@/components/ui/pressable';
import { Sheet } from '@/components/ui/sheet';
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

/** 옆으로 넘겨 고르는 날짜: 내일부터 2주 (그 뒤는 달력으로) */
export const TRIAL_QUICK_DAYS = 14;
/** 달력으로 고를 수 있는 끝 (오늘부터 며칠 뒤까지) */
export const TRIAL_LAST_DAY = 60;

const tileOf = (d: Date): TrialDayTile => ({ key: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, month: d.getMonth() + 1, date: d.getDate(), week: WEEK[d.getDay()] });

/** 'YYYY-MM-DD' → 날짜 칸 (형식이 틀리면 null) */
export function trialDayTile(key: string): TrialDayTile | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  return m ? tileOf(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) : null;
}

/** 고를 수 있는 날인지 (내일 ~ TRIAL_LAST_DAY 일 뒤) */
export function isTrialDay(key: string, now = new Date()) {
  const t = trialDayTile(key);
  if (!t) return false;
  const d = new Date(Number(key.slice(0, 4)), t.month - 1, t.date);
  const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((d.getTime() - t0.getTime()) / 86400000);
  return diff >= 1 && diff <= TRIAL_LAST_DAY;
}

/** 내일부터 2주 */
export function trialDayTiles(now = new Date()): TrialDayTile[] {
  return Array.from({ length: TRIAL_QUICK_DAYS }, (_, i) => {
    return tileOf(new Date(now.getFullYear(), now.getMonth(), now.getDate() + i + 1));
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
      <DayStrip days={days} day={day} onDay={onDay} />
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
 * 날짜 줄: 내일부터 2주를 옆으로 넘겨 골라요. 맨 끝 [달력] 칸으로 그 뒤 날짜(2주 뒤 ~ 두 달)를 직접 골라요.
 * 달력에서 고른 날은 줄 끝(달력 칸 앞)에 따로 보여요.
 */
function DayStrip({ days, day, onDay }: { days: TrialDayTile[]; day: string; onDay: (key: string) => void }) {
  const [cal, setCal] = useState(false);
  const ref = useRef<ScrollViewInstance>(null);
  const later = days.some((d) => d.key === day) ? null : trialDayTile(day);
  const tile = (d: TrialDayTile, on: boolean, extra?: boolean) => (
    <Pressable
      key={d.key}
      sound="pick"
      onPress={() => (extra ? setCal(true) : onDay(d.key))}
      accessibilityRole="radio"
      accessibilityLabel={`${d.month}월 ${d.date}일 ${d.week}요일${extra ? ' · 달력에서 고른 날 · 바꾸기' : ''}`}
      accessibilityState={{ selected: on, checked: on }}
      style={({ pressed }) => [styles.day, on && styles.dayOn, pressed && styles.pressed]}>
      <PText style={[styles.dayWeek, on && styles.dayWeekOn]}>{extra ? `${d.month}월 ${d.week}` : d.date === 1 || d === days[0] ? `${d.month}월 ${d.week}` : d.week}</PText>
      <PText style={[styles.dayNum, on && styles.textOnDark]}>{d.date}</PText>
    </Pressable>
  );
  return (
    <>
      <ScrollView ref={ref} horizontal showsHorizontalScrollIndicator={false} style={styles.strip} contentContainerStyle={styles.days} accessibilityRole="radiogroup" accessibilityLabel="상담 날짜 · 옆으로 넘겨 2주">
        {days.map((d) => tile(d, d.key === day))}
        {later ? tile(later, true, true) : null}
        <Pressable sound="open" onPress={() => setCal(true)} accessibilityRole="button" accessibilityLabel="2주 뒤 날짜를 달력에서 고르기" style={({ pressed }) => [styles.day, styles.calTile, pressed && styles.pressed]}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={Colors.ink} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Rect x={3.5} y={5} width={17} height={15.5} rx={3} />
            <Path d="M3.5 10h17M8 3v4M16 3v4" />
          </Svg>
          <PText style={styles.calTileT}>달력</PText>
        </Pressable>
      </ScrollView>
      <Sheet open={cal} onClose={() => setCal(false)} title="상담 날짜를 골라요">
        <MonthCalendar
          value={later ? later.key : ''}
          onChange={(key) => {
            onDay(key);
            setCal(false);
            // 고른 날 칸이 보이게 줄 끝으로
            setTimeout(() => ref.current?.scrollToEnd({ animated: true }), 350);
          }}
          minDays={TRIAL_QUICK_DAYS + 1}
          maxDays={TRIAL_LAST_DAY}
          hint="2주 뒤부터 두 달 안에서 골라요 · 2주 안은 날짜 줄에서 골라요"
          pick={(d) => `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEK[d.getDay()]})`}
        />
      </Sheet>
    </>
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
  calTile: { borderStyle: 'dashed', gap: 2 },
  calTileT: { fontFamily: Font.body900, fontSize: 11.5, lineHeight: 15 },
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
