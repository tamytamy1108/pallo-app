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
  return { weeks: Math.ceil(total / perWeek), nowWeek: Math.ceil((MY_BOOK.weekLessons[0] ?? 1) / perWeek) };
}

const stepsPerLesson = (L: StudyLevel) => STAGES.reduce((n, s) => n + STUDY_STEPS[L.kind][s].length, 0);

/** 차례대로 놓인 과 (번호 순 · total 까지) */
const orderedLessons = (L: StudyLevel) => [...L.lessons].sort((a, b) => a.no - b.no).slice(0, L.total ?? L.lessons.length);

/**
 * 교재 전체 진도 시트 (지점 안내의 '전체 진도' 칸에서 열어요): 달력에 수업 날마다 그날 과 · 내 진도 색.
 * 교재는 17 /library/books 에서 받은 내 레벨 교재예요.
 */
export function CourseProgressSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const shelf = useQuery(bookShelfQuery()).data;
  const L = shelf ? findLevel(shelf, MY_LV) : undefined;
  if (!L) return null;
  return <CourseSheet open={open} onClose={onClose} L={L} lessons={orderedLessons(L)} steps={stepsPerLesson(L)} />;
}

function Legend({ swatch, t }: { swatch: ViewStyle; t: string }) {
  return (
    <View style={styles.lg}>
      <View style={[styles.sw, swatch]} />
      <PText style={styles.lgT}>{t}</PText>
    </View>
  );
}

/** 그날 수업하는 내 팀 (내 교재 언어 · getDay 요일) — 날을 누르면 아래에 보여요 */
const teamsOn = (dow: number) => MY_TEAMS.filter((t) => t.lang === '영어' && teamWeekdays(t).includes(dow));

/**
 * 반 진도 요일 (getDay: 일 0 … 토 6) → 그 주 몇 번째 과: 월 · 화 · 토 = A과(0), 수 · 목 · 일 = B과(1), 금 = 휴무.
 * 이번 주 진도는 레벨과 상관없이 늘 두 과예요.
 */
const SLOT_OF_DOW: readonly (0 | 1 | null)[] = [1, 0, 0, 1, 1, null, 0];
const WEEK_LESSONS = 2;
/** 휴무 공휴일 (임시 · 웹 전산에 등록한 값으로 바뀌어요). 일요일은 공휴일이어도 수업해요 */
const HOLIDAYS: Record<string, string> = {
  '2026-12-25': '성탄절',
  '2027-1-1': '새해 첫날',
  '2027-2-6': '설날 연휴',
  '2027-2-8': '설날 연휴',
  '2027-2-9': '설날 대체공휴일',
  '2027-3-1': '삼일절',
};

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
/** 그 주 월요일 */
const mondayOf = (d: Date) => addDays(d, -((d.getDay() + 6) % 7));

/** 수업 날 = 과 · 그날 내 팀, 휴무 날 = 쉬는 까닭 */
type ClassDay = { date: Date; ls?: Lesson; off?: string; teams: Team[] };

/**
 * 반 진도를 날짜에 놓아요 (실서비스는 웹 전산에 등록한 진도를 서버가 날짜별로 내려 줘요).
 * 이번 주 = MY_BOOK.weekLessons 주차, 앞뒤 주는 7일씩. 주마다 A과 · B과 두 과.
 */
function classCalendar(lessons: Lesson[]) {
  const { weeks, nowWeek } = classSchedule(lessons.length);
  const thisMonday = mondayOf(new Date());
  const byDay = new Map<string, ClassDay>();
  const classDates: Date[] = [];
  for (let w = 1; w <= weeks; w++) {
    const monday = addDays(thisMonday, (w - nowWeek) * 7);
    for (let i = 0; i < 7; i++) {
      const date = addDays(monday, i);
      const dow = date.getDay();
      const slot = SLOT_OF_DOW[dow];
      const holiday = dow === 0 ? undefined : HOLIDAYS[dayKey(date)];
      if (slot === null || holiday) {
        byDay.set(dayKey(date), { date, off: holiday ?? '금요일', teams: [] });
        continue;
      }
      const ls = lessons[(w - 1) * WEEK_LESSONS + slot];
      if (!ls) continue;
      byDay.set(dayKey(date), { date, ls, teams: teamsOn(dow) });
      classDates.push(date);
    }
  }
  return { byDay, first: classDates[0] ?? thisMonday, last: classDates[classDates.length - 1] ?? thisMonday };
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
          <Legend swatch={styles.swOff} t="휴무 (금 · 공휴일)" />
        </View>
      </View>

      <View style={styles.day}>
        <PText style={styles.dayT}>
          {sel.getMonth() + 1}월 {sel.getDate()}일 ({DOW[sel.getDay()]})
        </PText>
        {picked?.off ? (
          <PText style={styles.dayS}>{picked.off} 휴무예요</PText>
        ) : picked?.ls ? (
          <>
            {picked.teams.map((t) => (
              <PText key={t.no} style={styles.dayS}>
                {t.no} · {t.when.split(' ')[1]} · {t.pro} 프로
              </PText>
            ))}
            <LessonRow L={L} ls={picked.ls} steps={steps} onPress={() => picked.ls && openUnit(picked.ls.no)} />
          </>
        ) : (
          <PText style={styles.dayS}>수업이 없는 날이에요</PText>
        )}
      </View>
    </Sheet>
  );
}

/** 달력 칩 글자: 패턴형 '5과' · 토픽형 '#101' · 토론형 '101' */
const chipOf = (L: StudyLevel, ls: Lesson) => (L.kind === 'pattern' ? `${ls.no}과` : L.kind === 'topic' ? `#${ls.no}` : String(ls.no));

/** 달력 한 칸: 날짜 + 그날 과 번호 (내 진도만큼 색) · 휴무 날은 회색 '휴무' */
function DayCell({ d, cd, L, steps, isToday, on, onPress }: { d: Date; cd?: ClassDay; L: StudyLevel; steps: number; isToday: boolean; on: boolean; onPress: () => void }) {
  const ls = cd?.ls;
  const done = useDoneCount(ls ? `${L.lv}:${ls.no}:` : 'none:');
  const state = !ls ? null : done >= steps ? 'done' : done > 0 ? 'half' : 'todo';
  const date = `${d.getMonth() + 1}월 ${d.getDate()}일`;
  const label = ls ? `${date} · ${lessonName(L, ls)} · ${steps}단계 중 ${done}단계` : cd?.off ? `${date} · ${cd.off} 휴무` : date;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={label} style={[styles.cell7, styles.dayCell, on && styles.dayOn]}>
      <View style={[styles.dateN, isToday && styles.today]}>
        <PText style={[styles.dateT, isToday && styles.todayT]}>{d.getDate()}</PText>
      </View>
      {ls && (
        <View style={[styles.lsChip, state === 'done' ? styles.swDone : state === 'half' ? styles.swHalf : styles.swTodo]}>
          <PText style={[styles.lsChipT, state === 'done' && styles.lsChipTDone]}>{chipOf(L, ls)}</PText>
        </View>
      )}
      {cd?.off && (
        <View style={[styles.lsChip, styles.swOff]}>
          <PText style={[styles.lsChipT, styles.offT]}>휴무</PText>
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
  legend: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 12, rowGap: 4, marginTop: 6 },
  lg: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sw: { width: 10, height: 10, borderRadius: 3 },
  swDone: { backgroundColor: Colors.purple },
  lgT: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub },
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
  swOff: { backgroundColor: Colors.line },
  offT: { color: Colors.inkSub },
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
