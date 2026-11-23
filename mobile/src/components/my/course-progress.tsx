import { useQuery } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { bookShelfQuery } from '@/api/queries';
import { Pressable } from '@/components/ui/pressable';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
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

/** 전체 진도 시트: 주차마다 그 주에 나가는 과 · 내 단계 진도. 과를 누르면 과 화면 */
function CourseSheet({ open, onClose, L, lessons, steps }: { open: boolean; onClose: () => void; L: StudyLevel; lessons: Lesson[]; steps: number }) {
  const { weeks, nowWeek, weekOf } = classSchedule(lessons.length);
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
          지금 {nowWeek}주차 · 이번 주 {MY_BOOK.weekLessons.join(' · ')}과를 나가요
        </PText>
      </View>
      {Array.from({ length: weeks }, (_, i) => i + 1).map((w) => (
        <View key={w} style={[styles.week, w === nowWeek && styles.weekNow]}>
          <View style={styles.weekHd}>
            <PText style={styles.weekN}>{w}주차</PText>
            <View style={[styles.tag, w === nowWeek ? styles.tagNow : w < nowWeek ? styles.tagPast : styles.tagNext]}>
              <PText style={styles.tagT}>{w < nowWeek ? '지난 진도' : w === nowWeek ? '이번 주' : '예정'}</PText>
            </View>
          </View>
          {lessons
            .filter((ls) => weekOf(ls.no) === w)
            .map((ls) => (
              <LessonRow key={ls.no} L={L} ls={ls} steps={steps} onPress={() => openUnit(ls.no)} />
            ))}
        </View>
      ))}
    </Sheet>
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
  week: { padding: 12, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.line, backgroundColor: Colors.white, gap: 4 },
  weekNow: { borderWidth: 2, borderColor: Colors.ink, backgroundColor: '#FFFBDD' },
  weekHd: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  weekN: { fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  tagNow: { backgroundColor: Colors.yellow, borderWidth: 1.5, borderColor: Colors.ink },
  tagPast: { backgroundColor: Colors.lavender },
  tagNext: { backgroundColor: '#F3EEE2' },
  tagT: { fontFamily: Font.body900, fontSize: 11, lineHeight: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  rowTx: { flex: 1, minWidth: 0 },
  rowT: { fontFamily: Font.body900, fontSize: 13.5, lineHeight: 19 },
  rowS: { fontFamily: Font.body700, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub },
  cnt: { minWidth: 46, height: 26, paddingHorizontal: 8, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3EEE2' },
  cntAll: { backgroundColor: Colors.purple },
  cntT: { fontFamily: Font.body900, fontSize: 11.5, lineHeight: 16, fontVariant: ['tabular-nums'] },
  cntTAll: { color: Colors.white },
});
