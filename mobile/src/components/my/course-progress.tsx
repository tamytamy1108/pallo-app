import { useQuery } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { bookShelfQuery } from '@/api/queries';
import { Pressable } from '@/components/ui/pressable';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { DOW, MY_TEAMS, teamWeekdays, type Team } from '@/data/account';
import { findLevel, lessonName, STAGES, STUDY_STEPS, unitId, type Lesson, type StudyLevel } from '@/data/library';
import { MY_BOOK } from '@/data/mock';
import { sfx } from '@/lib/feedback';
import { useDoneCount } from '@/state/progress';

/** 내 교재 레벨 (MY_BOOK.level 'Lv.1' → 1) */
const MY_LV = Number(MY_BOOK.level.replace('Lv.', ''));

/** 반 진도: 한 주에 나가는 과 수 · 이번 주가 몇 주차인지 (MY_BOOK.weekLessons = 이번 주에 나가는 과 번호) */
function classSchedule(total: number) {
  const perWeek = Math.max(1, MY_BOOK.weekLessons.length);
  const weekOf = (no: number) => Math.ceil(no / perWeek);
  return { weeks: Math.ceil(total / perWeek), nowWeek: weekOf(MY_BOOK.weekLessons[0] ?? 1), weekOf };
}

const stepsPerLesson = (L: StudyLevel) => STAGES.reduce((n, s) => n + STUDY_STEPS[L.kind][s].length, 0);

/** 차례대로 놓인 과 (번호 순 · total 까지) */
const orderedLessons = (L: StudyLevel) => [...L.lessons].sort((a, b) => a.no - b.no).slice(0, L.total ?? L.lessons.length);

/**
 * 지점 안내 보드 안의 '전체 진도' 칸: 교재 전체를 과 하나 = 칸 하나로 늘어놓고,
 * 내가 끝낸 단계만큼 칠하고, 반이 이번 주 나가는 과는 노란 칸. 누르면 주차별 전체 진도 시트.
 */
export function CourseProgress() {
  const shelf = useQuery(bookShelfQuery()).data;
  const [open, setOpen] = useState(false);
  const L = shelf ? findLevel(shelf, MY_LV) : undefined;
  if (!L) return null;
  const lessons = orderedLessons(L);
  const { weeks, nowWeek } = classSchedule(lessons.length);
  const steps = stepsPerLesson(L);
  return (
    <>
      <Pressable
        onPress={() => {
          sfx('tap');
          setOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={`전체 진도 보기 · ${L.series} · ${weeks}주 중 ${nowWeek}주차`}
        style={styles.box}>
        <View style={styles.boxHd}>
          <PText style={styles.boxK}>전체 진도</PText>
          <PText style={styles.boxWeek}>
            {nowWeek}주차 <PText style={styles.boxWeekOf}>/ {weeks}주</PText>
          </PText>
        </View>
        <PText style={styles.boxT} numberOfLines={1}>
          Lv.{L.lv} {L.series}
        </PText>
        <View style={styles.strip}>
          {lessons.map((ls) => (
            <Cell key={ls.no} L={L} ls={ls} steps={steps} now={MY_BOOK.weekLessons.includes(ls.no)} />
          ))}
        </View>
        <View style={styles.legend}>
          <Legend swatch={styles.swDone} t="내가 끝낸 만큼" />
          <Legend swatch={styles.swNow} t={`이번 주 ${MY_BOOK.weekLessons.join(' · ')}과`} />
          <PText style={styles.more}>전체 보기 ›</PText>
        </View>
      </Pressable>
      <CourseSheet open={open} onClose={() => setOpen(false)} L={L} lessons={lessons} steps={steps} />
    </>
  );
}

/** 과 한 칸: 끝낸 단계만큼 아래에서 위로 차올라요 */
function Cell({ L, ls, steps, now }: { L: StudyLevel; ls: Lesson; steps: number; now: boolean }) {
  const done = useDoneCount(`${L.lv}:${ls.no}:`);
  const pct = Math.round(Math.min(1, done / steps) * 100);
  return <View style={[styles.cell, now && styles.cellNow]}>{pct > 0 && <View style={[styles.cellFill, { height: `${pct}%` }]} />}</View>;
}

function Legend({ swatch, t }: { swatch: ViewStyle; t: string }) {
  return (
    <View style={styles.lg}>
      <View style={[styles.sw, swatch]} />
      <PText style={styles.lgT}>{t}</PText>
    </View>
  );
}

/** 내 교재 언어 팀들이 수업하는 요일 (월 = 1 … 일 = 7 로 돌려서 월요일부터 차례로) */
const teamsOn = (dow: number) => MY_TEAMS.filter((t) => t.lang === '영어' && teamWeekdays(t).includes(dow % 7));
const CLASS_DOWS = [1, 2, 3, 4, 5, 6, 7].filter((d) => teamsOn(d).length > 0);

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
/** 그 주 월요일 */
const mondayOf = (d: Date) => addDays(d, -((d.getDay() + 6) % 7));

type ClassDay = { date: Date; ls: Lesson; teams: Team[] };

/**
 * 반 진도를 날짜에 놓아요: 이번 주 = MY_BOOK.weekLessons 주차, 앞뒤 주는 7일씩.
 * 한 주의 수업 요일을 차례로 그 주 과들에 고르게 나눠요 (주 2과 · 월화수목 → 월화 앞 과 · 수목 뒤 과).
 */
function classCalendar(lessons: Lesson[]) {
  const { weeks, nowWeek } = classSchedule(lessons.length);
  const perWeek = Math.max(1, MY_BOOK.weekLessons.length);
  const thisMonday = mondayOf(new Date());
  const byDay = new Map<string, ClassDay>();
  for (let w = 1; w <= weeks; w++) {
    const monday = addDays(thisMonday, (w - nowWeek) * 7);
    CLASS_DOWS.forEach((dow, i) => {
      const ls = lessons[(w - 1) * perWeek + Math.floor((i * perWeek) / CLASS_DOWS.length)];
      if (!ls) return;
      const date = addDays(monday, dow - 1);
      byDay.set(dayKey(date), { date, ls, teams: teamsOn(dow) });
    });
  }
  const all = [...byDay.values()];
  return { byDay, first: all[0]?.date ?? thisMonday, last: all[all.length - 1]?.date ?? thisMonday };
}

/** 월요일부터 시작하는 달력 칸 (앞뒤 빈칸은 null) */
function monthCells(y: number, m: number) {
  const first = new Date(y, m, 1);
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(y, m + 1, 0).getDate();
  const cells: (Date | null)[] = [...Array<null>(lead).fill(null), ...Array.from({ length: days }, (_, i) => new Date(y, m, i + 1))];
  while (cells.length % 7) cells.push(null);
  return cells;
}

const WEEK_HEAD = ['월', '화', '수', '목', '금', '토', '일'];

/** 전체 진도 시트: 달력에 수업 날마다 그날 나가는 과 · 내 진도 색. 날을 누르면 아래에 그날 수업 · 과 */
function CourseSheet({ open, onClose, L, lessons, steps }: { open: boolean; onClose: () => void; L: StudyLevel; lessons: Lesson[]; steps: number }) {
  const { weeks, nowWeek } = classSchedule(lessons.length);
  const cal = useMemo(() => classCalendar(lessons), [lessons]);
  const today = new Date();
  const [month, setMonth] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [sel, setSel] = useState(today);
  const picked = cal.byDay.get(dayKey(sel));
  const canPrev = new Date(month.y, month.m, 1) > cal.first;
  const canNext = new Date(month.y, month.m + 1, 0) < cal.last;
  const move = (n: number) => {
    sfx('tap');
    setMonth(({ y, m }) => ({ y: new Date(y, m + n, 1).getFullYear(), m: new Date(y, m + n, 1).getMonth() }));
  };
  const openUnit = (no: number) => {
    sfx('tap');
    onClose();
    router.push(`/unit/${unitId(L.lv, no)}` as Href);
  };
  return (
    <Sheet open={open} onClose={onClose} title="전체 진도" tall label="전체 진도">
      <View style={[styles.hero, { backgroundColor: L.c }]}>
        <PText style={styles.heroK}>
          Lv.{L.lv} · {lessons.length}과 · {weeks}주 과정
        </PText>
        <PText style={styles.heroT}>{L.series}</PText>
        <PText style={styles.heroS}>
          지금 {nowWeek}주차 · {cal.first.getMonth() + 1}/{cal.first.getDate()} ~ {cal.last.getMonth() + 1}/{cal.last.getDate()}
        </PText>
      </View>

      <View style={styles.cal}>
        <View style={styles.calHd}>
          <Pressable onPress={() => move(-1)} disabled={!canPrev} accessibilityRole="button" accessibilityLabel="이전 달" hitSlop={8} style={[styles.calNav, !canPrev && styles.calNavOff]}>
            <PText style={styles.calNavT}>‹</PText>
          </Pressable>
          <PText style={styles.calTitle}>
            {month.y}년 {month.m + 1}월
          </PText>
          <Pressable onPress={() => move(1)} disabled={!canNext} accessibilityRole="button" accessibilityLabel="다음 달" hitSlop={8} style={[styles.calNav, !canNext && styles.calNavOff]}>
            <PText style={styles.calNavT}>›</PText>
          </Pressable>
        </View>
        <View style={styles.grid}>
          {WEEK_HEAD.map((d, i) => (
            <PText key={d} style={[styles.dow, i >= 5 && styles.dowEnd]}>
              {d}
            </PText>
          ))}
          {monthCells(month.y, month.m).map((d, i) =>
            d ? (
              <DayCell
                key={dayKey(d)}
                d={d}
                cd={cal.byDay.get(dayKey(d))}
                L={L}
                steps={steps}
                isToday={dayKey(d) === dayKey(today)}
                on={dayKey(d) === dayKey(sel)}
                onPress={() => {
                  sfx('tap');
                  setSel(d);
                }}
              />
            ) : (
              <View key={`e${i}`} style={styles.cell7} />
            ),
          )}
        </View>
        <View style={styles.legend}>
          <Legend swatch={styles.swDone} t="다 끝낸 과" />
          <Legend swatch={styles.swHalf} t="하는 중" />
          <Legend swatch={styles.swTodo} t="아직" />
        </View>
      </View>

      <View style={styles.day}>
        <PText style={styles.dayT}>
          {sel.getMonth() + 1}월 {sel.getDate()}일 ({DOW[sel.getDay()]})
        </PText>
        {picked ? (
          <>
            {picked.teams.map((t) => (
              <PText key={t.no} style={styles.dayS}>
                {t.no} · {t.when.split(' ')[1]} · {t.pro} 프로
              </PText>
            ))}
            <LessonRow L={L} ls={picked.ls} steps={steps} onPress={() => openUnit(picked.ls.no)} />
          </>
        ) : (
          <PText style={styles.dayS}>수업이 없는 날이에요</PText>
        )}
      </View>
    </Sheet>
  );
}

/** 달력 한 칸: 날짜 + 그날 과 번호 (내 진도만큼 색) */
function DayCell({ d, cd, L, steps, isToday, on, onPress }: { d: Date; cd?: ClassDay; L: StudyLevel; steps: number; isToday: boolean; on: boolean; onPress: () => void }) {
  const done = useDoneCount(cd ? `${L.lv}:${cd.ls.no}:` : 'none:');
  const state = !cd ? null : done >= steps ? 'done' : done > 0 ? 'half' : 'todo';
  const label = cd ? `${d.getMonth() + 1}월 ${d.getDate()}일 · ${lessonName(L, cd.ls)} · ${steps}단계 중 ${done}단계` : `${d.getMonth() + 1}월 ${d.getDate()}일`;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={label} style={[styles.cell7, styles.dayCell, on && styles.dayOn]}>
      <View style={[styles.dateN, isToday && styles.today]}>
        <PText style={[styles.dateT, isToday && styles.todayT]}>{d.getDate()}</PText>
      </View>
      {cd && (
        <View style={[styles.lsChip, state === 'done' ? styles.swDone : state === 'half' ? styles.swHalf : styles.swTodo]}>
          <PText style={[styles.lsChipT, state === 'done' && styles.lsChipTDone]}>{cd.ls.no}과</PText>
        </View>
      )}
    </Pressable>
  );
}

function LessonRow({ L, ls, steps, onPress }: { L: StudyLevel; ls: Lesson; steps: number; onPress: () => void }) {
  const done = useDoneCount(`${L.lv}:${ls.no}:`);
  const all = done >= steps;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${lessonName(L, ls)} · ${steps}단계 중 ${done}단계`} style={styles.row}>
      <View style={styles.rowTx}>
        <PText style={styles.rowT} numberOfLines={1}>
          {lessonName(L, ls)}
        </PText>
        <PText style={styles.rowS} numberOfLines={1}>
          {ls.sub}
        </PText>
      </View>
      <View style={[styles.cnt, all && styles.cntAll]}>
        <PText style={[styles.cntT, all && styles.cntTAll]}>{all ? '완료' : `${done}/${steps}`}</PText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { marginTop: 12, padding: 12, borderRadius: 14, backgroundColor: '#F3EEE2', gap: 4 },
  boxHd: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  boxK: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17, color: Colors.purple, letterSpacing: 0.3 },
  boxWeek: { fontFamily: Font.display, fontSize: 15, lineHeight: 20, fontVariant: ['tabular-nums'] },
  boxWeekOf: { fontFamily: Font.body800, fontSize: 12, color: Colors.inkSub },
  boxT: { fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  strip: { flexDirection: 'row', gap: 3, marginTop: 6, height: 26 },
  cell: { flex: 1, borderRadius: 4, backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.line, overflow: 'hidden', justifyContent: 'flex-end' },
  cellNow: { borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow },
  cellFill: { width: '100%', backgroundColor: Colors.purple },
  legend: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 12, rowGap: 4, marginTop: 6 },
  lg: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sw: { width: 10, height: 10, borderRadius: 3 },
  swDone: { backgroundColor: Colors.purple },
  swNow: { backgroundColor: Colors.yellow, borderWidth: 1.5, borderColor: Colors.ink },
  lgT: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub },
  more: { marginLeft: 'auto', fontFamily: Font.body900, fontSize: 12.5, lineHeight: 18, color: Colors.purple },
  hero: { padding: 16, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, gap: 2 },
  heroK: { fontFamily: Font.body900, fontSize: 11.5, lineHeight: 16, color: 'rgba(255,255,255,0.85)', letterSpacing: 0.3 },
  heroT: { fontFamily: Font.display, fontSize: 20, lineHeight: 26, color: Colors.white },
  heroS: { marginTop: 4, fontFamily: Font.body800, fontSize: 12.5, lineHeight: 18, color: Colors.white },
  cal: { padding: 12, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, gap: 8 },
  calHd: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calTitle: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21, fontVariant: ['tabular-nums'] },
  calNav: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white },
  calNavOff: { opacity: 0.3 },
  calNavT: { fontFamily: Font.body900, fontSize: 18, lineHeight: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dow: { width: `${100 / 7}%`, textAlign: 'center', fontFamily: Font.body900, fontSize: 11.5, lineHeight: 18, color: Colors.inkSub },
  dowEnd: { color: Colors.rosePink },
  cell7: { width: `${100 / 7}%`, height: 54 },
  dayCell: { alignItems: 'center', paddingTop: 4, gap: 3, borderRadius: 10 },
  dayOn: { backgroundColor: Colors.lavender },
  dateN: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  today: { backgroundColor: Colors.ink },
  dateT: { fontFamily: Font.body800, fontSize: 12, lineHeight: 16, fontVariant: ['tabular-nums'] },
  todayT: { color: Colors.white },
  lsChip: { minWidth: 34, paddingHorizontal: 4, height: 18, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  lsChipT: { fontFamily: Font.body900, fontSize: 10, lineHeight: 14, fontVariant: ['tabular-nums'] },
  lsChipTDone: { color: Colors.white },
  swHalf: { backgroundColor: Colors.lavender, borderWidth: 1.5, borderColor: Colors.purple },
  swTodo: { backgroundColor: Colors.yellow, borderWidth: 1.5, borderColor: Colors.ink },
  day: { padding: 14, borderRadius: 18, borderWidth: 1.5, borderColor: Colors.line, backgroundColor: Colors.white, gap: 2 },
  dayT: { fontFamily: Font.body900, fontSize: 14.5, lineHeight: 20, marginBottom: 2 },
  dayS: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  rowTx: { flex: 1, minWidth: 0 },
  rowT: { fontFamily: Font.body900, fontSize: 13.5, lineHeight: 19 },
  rowS: { fontFamily: Font.body700, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub },
  cnt: { minWidth: 46, height: 26, paddingHorizontal: 8, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3EEE2' },
  cntAll: { backgroundColor: Colors.purple },
  cntT: { fontFamily: Font.body900, fontSize: 11.5, lineHeight: 16, fontVariant: ['tabular-nums'] },
  cntTAll: { color: Colors.white },
});
