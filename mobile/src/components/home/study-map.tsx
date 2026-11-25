import { useQuery } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import Animated, { css, cubicBezier } from 'react-native-reanimated';
import Svg, { Circle, Defs, Path, Pattern, Rect } from 'react-native-svg';

import { bookShelfQuery } from '@/api/queries';
import { lockedChapter } from '@/components/common/trial-guide';
import { pickIsland, setLib } from '@/components/library/library-state';
import { Pressable } from '@/components/ui/pressable';
import { XmasBackLayer, XmasGarland } from '@/components/home/christmas';
import { CurrentFx, NodeHop, Rider } from '@/components/home/map-current';
import { Celebrate, type CelebrateResult } from '@/components/lesson/celebrate';
import { Raised } from '@/components/ui/raised';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { seasonOf, XMAS } from '@/constants/season';
import { Colors, Spacing } from '@/constants/theme';
import { chestReward, SKIP_POINTS } from '@/data/home';
import { lessonName, STUDY_STEPS } from '@/data/library';
import { STUDY_LEVELS } from '@/data/library-lessons';
import { MY_BOOK, STAGES } from '@/data/mock';
import { sfx } from '@/lib/feedback';
import { useStill } from '@/lib/motion';
import { awardPoints } from '@/state/ledger';
import { chestKey, markChestOpened, useChestOpened } from '@/state/chest';
import { clearPos, DAILY_GOAL, getTodayDone, isDone, markDone, setLastStep, stepKey, useDoneCount, useLastStep } from '@/state/progress';

import { canUse } from '@/state/access';
import { useMe } from '@/state/me';

import { devSeason } from './dev';
import { ChestCelebrate } from './chest-celebrate';
import { ARROW_PATH, CHECK_PATH, LineIcon } from './icons';
import { OPEN_UNITS, useStopAsk } from './map-state';
import { SeasonLayer } from './season-deco';
import { SkipSheet } from './skip-sheet';
import { StopPopup, type StartMode } from './stop-popup';
import { TreasureChest } from './treasure-chest';

const NODE = 64;
const NODE_CUR = 78;
/** 정류장 이름 칸 최대 폭 · 카드 가장자리에서 띄울 거리 */
const LABEL_MAX = 180;
const LABEL_EDGE = 8;
const LOCK_PATH = 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3';
const ZIG = [-1, 0, 1, 0]; // 왼쪽 → 가운데 → 오른쪽 → 가운데 … 꼬불꼬불 (프로토타입과 같아요)
/** 내 교재 레벨 (MY_BOOK.level 'Lv.1' → 1) — 아직 아무 단계도 안 열었을 때 홈 맵 레벨 */
const MY_LV = Number(MY_BOOK.level.replace('Lv.', ''));
/** Lv.0 HELLO ENGLISH 표지 색 (data/library 책장과 같아요) */
const LV0_COLOR = '#4A82C8';

/**
 * 레벨 하나의 맵 재료. 맵 모양은 레벨이 달라도 같고, 정류장 수 · 이름만 그 레벨의 예습 · 본학습 · 복습 단계 (STUDY_STEPS) 그대로
 * (Lv.1 · 2 패턴형 8개 · Lv.3 토픽형 10개 · Lv.4 토론형 9개). 위 칩 = 그 레벨 교재의 과 (Lv.3 토픽 번호 · Lv.4 회차).
 */
function makeLevelMap(lvWanted: number) {
  const L = STUDY_LEVELS.find((x) => x.lv === lvWanted) ?? STUDY_LEVELS[0];
  const lv = L.lv;
  const steps = STAGES.flatMap((g) => STUDY_STEPS[L.kind][g.key].map((s) => ({ id: s.id, stage: g.key, title: s.t, min: s.min, xp: s.xp })));
  const units = L.lessons.map((ls) => ls.no);
  /** 제목 줄 (1과 Cafe Complaint · #102 Activities · Behind the Mask) */
  const unitName = (n: number) => {
    const ls = L.lessons.find((x) => x.no === n);
    return ls ? lessonName(L, ls) : '';
  };
  /** 칩 글자 (1과 · #102 · 2회) */
  const chipLabel = (n: number) => (L.kind === 'topic' ? `#${n}` : L.kind === 'debate' ? `${units.indexOf(n) + 1}회` : `${n}과`);
  /** 과의 단계마다 끝냈는지. count 는 다시 읽을 때를 알리는 값이에요 (끝낸 수가 바뀌면 새로 읽어요) */
  const readDone = (unit: number, count: number) => steps.map((s) => count > 0 && isDone(stepKey(lv, unit, s.id)));
  const stageOf = (i: number) => STAGES.findIndex((g) => g.key === steps[i].stage);
  const stepHref = (unit: number, step: string) => (lv <= 2 ? `/lesson/${step}?lv=${lv}&unit=${unit}` : `/lesson34/${step}?lv=${lv}&unit=${unit}`);
  /** 이번 주 반 진도 (과 번호들) · 칩 글자: 패턴형 '5 & 6챕터', 토픽 · 토론형 '#101 & #102' · '1회 & 2회' */
  const week = (lv === MY_LV ? MY_BOOK.weekLessons : MY_BOOK.weekByLevel[lv]) ?? [];
  const weekText = L.kind === 'pattern' ? `${week.join(' & ')}챕터` : week.map(chipLabel).join(' & ');
  /** 과 제목만 (보상 화면) */
  const unitTitle = (n: number) => L.lessons.find((x) => x.no === n)?.title ?? '';
  return { lv, steps, units, unitName, unitTitle, chipLabel, readDone, stageOf, stepHref, week, weekText };
}
type LevelMap = ReturnType<typeof makeLevelMap>;
const levelMaps = new Map<number, LevelMap>();
const levelMap = (lv: number) => {
  const hit = levelMaps.get(lv);
  if (hit) return hit;
  const m = makeLevelMap(lv);
  levelMaps.set(lv, m);
  return m;
};
/** 홈 맵 레벨 = 마지막으로 연 단계의 레벨 (라이브러리 스터디 맵 · 홈 맵 · 레슨이 같은 기록) · 없으면 내 교재 레벨 */
const homeLevel = (last: { lv: number } | null) => (last && STUDY_LEVELS.some((x) => x.lv === last.lv) ? last.lv : MY_LV);

type Point = { x: number; y: number };

/** 프로토타입 renderMap 과 같은 계산: 구역 알약 · 정류장 · 보상 상자 위치 */
function layout(width: number, steps: LevelMap['steps']) {
  const amp = width / 2 - 52;
  let y = 26;
  const zones: { y: number; si: number }[] = [];
  const nodes: (Point & { i: number })[] = [];
  steps.forEach((s, i) => {
    const first = i === 0 || steps[i - 1].stage !== s.stage;
    if (first) {
      zones.push({ y: y + (i ? 6 : 0), si: STAGES.findIndex((g) => g.key === s.stage) });
      y += 106;
    }
    nodes.push({ x: Math.round(width / 2 + ZIG[i % 4] * amp), y, i });
    y += 66;
  });
  const chest = {
    x: Math.round(width / 2 + ZIG[steps.length % 4] * amp),
    y: y - 6,
  };
  return { nodes, zones, chest, height: y + 70 };
}

/** 정류장을 잇는 부드러운 곡선 */
const curve = (p: Point[]) => p.map((q, i) => (i === 0 ? `M${q.x},${q.y}` : `C${p[i - 1].x},${(p[i - 1].y + q.y) / 2} ${q.x},${(p[i - 1].y + q.y) / 2} ${q.x},${q.y}`)).join(' ');

/** 홈 스터디 맵 카드: 지금 과 · 챕터 줄 · 진도 · 꼬불꼬불 퀘스트 길 · 정류장 팝업 · 구간 건너뛰기 */
export function StudyMap() {
  // 마지막으로 연 단계 — 라이브러리 · 홈 맵 · 레슨이 같은 기록을 써요 (프로토타입 ST.last).
  // 맵은 그 과로 열리고, 캐릭터는 그 단계 위에 서요
  const last = useLastStep();
  // 스터디 맵 · Lv 칩으로 고른 레벨 (없으면 마지막으로 연 단계의 레벨)
  const [pickLv, setPickLv] = useState<number | null>(null);
  const [lvOpen, setLvOpen] = useState(false);
  const M = levelMap(pickLv ?? homeLevel(last));
  const LV = M.lv;
  // 비회원은 레벨마다 첫 챕터만 열려요 (state/access) — 잠긴 과는 칩 · 다음 챕터 버튼에서 막아요
  const allOpen = useMe((m) => canUse(m, 'allChapters'));
  const firstUnit = M.units[0] ?? 1;
  const isFree = (n: number) => allOpen || n === firstUnit;
  const [lesson, setLesson] = useState(() => (last?.lv === LV && isFree(last.unit) ? last.unit : firstUnit));
  const [seenAt, setSeenAt] = useState(last?.at);
  if (last && last.at !== seenAt) {
    // 다른 곳(라이브러리)에서 새 단계를 열었으면 맵도 그 과로 옮겨요
    setSeenAt(last.at);
    setPickLv(null);
    if (last.lv === homeLevel(last) && isFree(last.unit)) setLesson(last.unit);
  }
  const [width, setWidth] = useState(0);
  const [popIdx, setPopIdx] = useState<number | null>(null);
  const [skipStage, setSkipStage] = useState<number | null>(null);
  const [cele, setCele] = useState<CelebrateResult | null>(null);
  // 11월 22일 ~ 12월 31일은 크리스마스 맵 · 나머지는 기기 날짜의 계절
  const [season] = useState(() => devSeason() ?? seasonOf());
  const xmas = season === 'xmas';
  const onDark = xmas ? XMAS.cream : Colors.ink;

  // 진도: 라이브러리와 같은 기록 (state/progress). 끝낸 수가 바뀔 때마다 다시 읽어요
  const doneCount = useDoneCount(`${LV}:${lesson}:`);
  const done = M.readDone(lesson, doneCount);
  const all = done.every(Boolean);
  const lastIdx = last?.lv === LV && last.unit === lesson ? M.steps.findIndex((s) => s.id === last.step) : -1;
  const current = lastIdx >= 0 ? lastIdx : done.findIndex((d) => !d);
  const nextNo = M.units[M.units.indexOf(lesson) + 1];
  const next = nextNo == null ? '' : M.unitName(nextNo);
  const map = width ? layout(width, M.steps) : null;

  // 챕터 줄: 칩 자리 기억 → 고른 과 · 이번 주 과를 가운데로
  const chipRow = useRef<ScrollViewInstance>(null);
  const chipXs = useRef<Record<number, { x: number; w: number }>>({});
  const rowW = useRef(0);
  const [bounce, setBounce] = useState(0);
  const [chestShake, setChestShake] = useState(0);
  const [chestOpen, setChestOpen] = useState(false);
  const opened = useChestOpened(chestKey(LV, lesson));
  const still = useStill();

  /** 고른 과가 칩 줄 밖으로 잘리지 않게 가운데로 */
  const reveal = (n: number) => {
    const c = chipXs.current[n];
    if (c) chipRow.current?.scrollTo({ x: Math.max(0, c.x + c.w / 2 - rowW.current / 2), animated: !still });
  };
  /** 이번 주 진도 칩: 이번 주 과 중 아직 다 안 끝낸 과(다 했으면 첫 과)로 넘어가고, 칩이 통통 */
  const goWeek = () => {
    const n = M.week.find((u) => !M.steps.every((st) => isDone(stepKey(LV, u, st.id)))) ?? M.week[0];
    if (n == null) return;
    sfx('tap');
    tryLesson(n);
    setBounce((b) => b + 1);
  };
  /** 스터디 맵 레벨 바꾸기: 그 레벨에서 마지막으로 연 과(없으면 첫 과)로 */
  const pickLevel = (lv: number) => {
    sfx('tap');
    setLvOpen(false);
    if (lv === LV) return;
    const L2 = levelMap(lv);
    setPickLv(lv);
    setLesson(last?.lv === lv && (allOpen || last.unit === L2.units[0]) ? last.unit : (L2.units[0] ?? 1));
    setPopIdx(null);
  };

  // 오늘의 목표 카드 [이어서 하기] → 맵으로 내려간 뒤 지금 정류장 팝업
  const ask = useStopAsk();
  useEffect(() => {
    if (!ask) return;
    const t = setTimeout(() => setPopIdx(current >= 0 ? current : null), 550);
    return () => clearTimeout(t);
    // 부탁이 왔을 때만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ask]);

  /** 전체 보기 → 라이브러리 스터디 맵, 이 레벨 교재 섬을 골라 둔 채로 */
  const shelf = useQuery(bookShelfQuery()).data;
  const openLibrary = () => {
    sfx('tap');
    const lang = shelf?.findIndex((books) => books.some((b) => b.study?.lv === LV)) ?? -1;
    const bi = lang >= 0 && shelf ? shelf[lang].findIndex((b) => b.study?.lv === LV) : -1;
    if (lang >= 0) pickIsland(bi, { sitMode: false, lang });
    else setLib({ sitMode: false });
    router.navigate('/library' as Href);
  };

  const pickLesson = (n: number) => {
    setLesson(n);
    reveal(n);
  };
  /** 챕터 칩 · 다음 챕터 · 상자의 '다음 코너로': 비회원은 둘째 챕터부터 잠김 (첫 챕터를 다 끝냈으면 '실제 대화' 권유) */
  const tryLesson = (n: number) => {
    if (isFree(n)) return pickLesson(n);
    lockedChapter(M.chipLabel(n), M.steps.every((s) => isDone(stepKey(LV, firstUnit, s.id))));
  };

  const go = (i: number, mode: StartMode) => {
    const step = M.steps[i];
    setPopIdx(null);
    if (!(OPEN_UNITS[LV] ?? []).includes(lesson)) {
      showToast(`${M.chipLabel(lesson)}는 교재가 들어오면 열려요`);
      return;
    }
    if (mode === 'restart') clearPos(stepKey(LV, lesson, step.id));
    setLastStep(LV, lesson, step.id);
    // 팝업에서 이미 이어서 / 처음부터를 골랐으면 레슨이 다시 묻지 않게 넘겨요
    const resume = mode === 'start' ? '' : `&resume=${mode}`;
    router.push(`${M.stepHref(lesson, step.id)}${resume}` as Href);
  };

  const pass = useCallback(
    (si: number) => {
      let gained = 0;
      M.steps.forEach((s, i) => {
        const key = stepKey(LV, lesson, s.id);
        if (M.stageOf(i) <= si && markDone(key)) {
          gained += 1;
          awardPoints(`skip:${key}`, 'skip', SKIP_POINTS);
        }
      });
      setSkipStage(null);
      const allNow = M.steps.every((s) => isDone(stepKey(LV, lesson, s.id)));
      sfx('fanfare');
      // 프로토타입: '테스트 통과!' · 'STAGE n까지 건너뛰었어요' · 단계마다 +10P
      setCele({ correct: 0, total: 0, points: gained * SKIP_POINTS, goalDone: Math.min(getTodayDone(), DAILY_GOAL), goalTotal: DAILY_GOAL, unitComplete: allNow });
    },
    [lesson, LV, M],
  );

  const chestTap = () => {
    if (!all) {
      setChestShake((v) => v + 1);
      showToast(`${M.steps.length}단계를 모두 끝내면 열려요`);
      return;
    }
    setChestOpen(true);
  };

  const popStep = popIdx !== null ? M.steps[popIdx] : null;
  const skipLeft = skipStage !== null ? M.steps.filter((_, i) => M.stageOf(i) <= skipStage && !done[i]).length : 0;

  return (
    <Raised radius={26}>
      <View style={StyleSheet.flatten([styles.card, xmas && { backgroundColor: XMAS.bg }])}>
        {xmas ? <XmasBackLayer /> : <DotPattern />}
        {season !== 'xmas' && <SeasonLayer season={season} />}
        {/* 가랜드는 버튼 · 알약 뒤에 깔려요 */}
        {xmas && <XmasGarland />}

        {/* 맵 내용은 늘 장식보다 앞에 */}
        <View style={styles.content}>
          <View style={styles.head}>
            <View style={styles.headLeft}>
              <Pressable
                onPress={() => {
                  sfx('tap');
                  setLvOpen(true);
                }}
                accessibilityRole="button"
                accessibilityLabel={`스터디 맵 Lv.${LV} · 레벨 바꾸기`}
                hitSlop={6}>
                {({ pressed }) => (
                  <View style={StyleSheet.flatten([styles.pillDark, pressed && styles.pillPressed])}>
                    <PText style={styles.pillDarkText} color={Colors.white}>
                      스터디 맵 · Lv.{LV} ▾
                    </PText>
                  </View>
                )}
              </Pressable>
              {M.week.length > 0 && (
                <Pressable onPress={goWeek} accessibilityRole="button" accessibilityLabel={`이번 주 진도 ${M.weekText}로 가기`} hitSlop={6}>
                  {({ pressed }) => (
                    <View style={StyleSheet.flatten([styles.weekChip, xmas && { backgroundColor: XMAS.cream }, pressed && styles.pillPressed])}>
                      <PText style={styles.weekText}>이번 주 진도</PText>
                    </View>
                  )}
                </Pressable>
              )}
            </View>
            <Pressable onPress={openLibrary} accessibilityRole="button" accessibilityLabel="라이브러리 스터디 맵에서 전체 보기">
              {({ pressed }) => (
                <Raised radius={16} pressed={pressed}>
                  <View style={styles.allBtn}>
                    <PText style={styles.allText}>전체 보기</PText>
                  </View>
                </Raised>
              )}
            </Pressable>
          </View>

          <PText variant="title" numberOfLines={2} style={styles.title} color={onDark}>
            {M.unitName(lesson)}
          </PText>

          <ScrollView ref={chipRow} horizontal showsHorizontalScrollIndicator={false} style={styles.chapScroll} contentContainerStyle={styles.chapRow} onLayout={(e) => (rowW.current = e.nativeEvent.layout.width)}>
            {M.units.map((n) => (
              <ChapChip key={n} M={M} n={n} on={n === lesson} week={M.week.includes(n)} locked={!isFree(n)} bounce={bounce} onPress={() => tryLesson(n)} onLayout={(x, w) => (chipXs.current[n] = { x, w })} />
            ))}
          </ScrollView>

          <View style={styles.prog}>
            <View style={styles.track}>
              <View style={StyleSheet.flatten([styles.fill, { width: `${(doneCount / M.steps.length) * 100}%` }])} />
            </View>
            <PText style={styles.progText} color={onDark}>
              {doneCount}/{M.steps.length}
            </PText>
          </View>

          <View style={StyleSheet.flatten([styles.map, { height: map?.height ?? 900 }])} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
            {map && (
              <>
                <MapPath map={map} done={done} all={all} width={width} />

                {map.zones.map((z) => {
                  const stage = STAGES[z.si];
                  const stageDone = M.steps.every((s, i) => s.stage !== stage.key || done[i]);
                  return (
                    <View key={stage.key} style={StyleSheet.flatten([styles.zoneWrap, { top: z.y }])}>
                      <View style={StyleSheet.flatten([styles.zone, { backgroundColor: stage.color }])}>
                        <View style={styles.zoneNum}>
                          {stageDone ? <LineIcon d={CHECK_PATH} size={13} width={3.6} /> : <PText style={styles.zoneNumText}>{z.si + 1}</PText>}
                        </View>
                        <PText style={styles.zoneLabel}>{stage.label}</PText>
                        {!stageDone && (
                          <Pressable onPress={() => setSkipStage(z.si)} accessibilityRole="button" accessibilityLabel={`${stage.label}까지 건너뛰기`} style={({ pressed }) => StyleSheet.flatten([styles.skip, pressed && styles.skipPressed])}>
                            <PText style={styles.skipText}>건너뛰기</PText>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  );
                })}

                {map.nodes.map((n) => {
                  const step = M.steps[n.i];
                  const stage = STAGES[M.stageOf(n.i)];
                  const isCur = n.i === current;
                  const isDoneStep = done[n.i];
                  const size = isCur ? NODE_CUR : NODE;
                  return (
                    <View key={step.id} style={StyleSheet.flatten([styles.nodeWrap, { left: n.x - size / 2, top: n.y - size / 2, width: size }])}>
                      {isCur && (
                        <View style={{ position: 'absolute', left: size / 2, top: size / 2 }}>
                          <CurrentFx />
                        </View>
                      )}
                      <Pressable onPress={() => setPopIdx(n.i)} accessibilityRole="button" accessibilityLabel={`${stage.label} ${step.title}${isDoneStep ? ', 완료' : ''}`}>
                        {({ pressed }) => (
                          <NodeHop on={isCur && !pressed} style={{ width: size, height: size + 5 }}>
                            <View
                              style={StyleSheet.flatten([
                                styles.node,
                                { width: size, height: size, borderRadius: size / 2, backgroundColor: isCur || isDoneStep ? stage.color : Colors.white },
                                pressed && styles.nodePressed,
                              ])}>
                              {isDoneStep ? (
                                <LineIcon d={CHECK_PATH} size={28} width={3.2} />
                              ) : (
                                <PText style={isCur ? styles.nodeNumCur : styles.nodeNum} color={isCur ? Colors.ink : '#A39C8E'}>
                                  {n.i + 1}
                                </PText>
                              )}
                            </View>
                          </NodeHop>
                        )}
                      </Pressable>
                      {/* 이름은 정류장 가운데 기준 · 카드 밖으로 안 나가게 폭을 줄이고 길면 두 줄 (Lv.4 'SAY IT BETTER 즉시 변환' 같은 긴 이름) */}
                      <View style={{ width: Math.min(LABEL_MAX, 2 * (Math.min(n.x, width - n.x) - LABEL_EDGE)) }}>
                        <PText numberOfLines={2} style={StyleSheet.flatten([styles.nodeLabel, xmas && styles.labelXmas])}>
                          {step.title}
                        </PText>
                      </View>
                      {isCur && (
                        <View style={{ position: 'absolute', left: size / 2, top: size / 2, zIndex: 4 }}>
                          <Rider />
                        </View>
                      )}
                    </View>
                  );
                })}

                <ChestNode M={M} x={map.chest.x} y={map.chest.y} ready={all} opened={all && opened} lesson={lesson} xmas={xmas} shake={chestShake} onPress={chestTap} />
              </>
            )}
          </View>

          {/* 다음 챕터: 라이브러리(스터디 맵 · 이 레벨 교재)로 가요. 비회원이 잠긴 챕터를 누르면 잠김 안내 */}
          {next && (
            <Pressable
              onPress={() => (isFree(nextNo) ? openLibrary() : tryLesson(nextNo))}
              accessibilityRole="button"
              accessibilityLabel={`다음 챕터 ${next}${!isFree(nextNo) ? ', 잠김' : ' · 라이브러리에서 보기'}`}
              style={styles.nextWrap}>
              {({ pressed }) => (
                <Raised radius={20} pressed={pressed}>
                  <View style={StyleSheet.flatten([styles.nextBtn, !isFree(nextNo) && styles.nextLocked])}>
                    <PText style={styles.nextText} numberOfLines={1}>
                      다음 챕터 · {next}
                    </PText>
                    <LineIcon d={!isFree(nextNo) ? LOCK_PATH : ARROW_PATH} size={!isFree(nextNo) ? 20 : 22} width={2.4} />
                  </View>
                </Raised>
              )}
            </Pressable>
          )}
        </View>
      </View>

      <StopPopup
        step={popStep}
        kicker={popIdx !== null ? `${STAGES[M.stageOf(popIdx)].label} · ${M.stageOf(popIdx) + 1}-${M.steps.slice(0, popIdx).filter((s) => s.stage === M.steps[popIdx].stage).length + 1}` : ''}
        stepKeyText={popStep ? stepKey(LV, lesson, popStep.id) : ''}
        onClose={() => setPopIdx(null)}
        onGo={(mode) => popIdx !== null && go(popIdx, mode)}
      />
      {/* 스터디 맵 · Lv 칩: 레벨 바꾸기 */}
      <Sheet open={lvOpen} onClose={() => setLvOpen(false)} title="스터디 맵 레벨" label="스터디 맵 레벨 바꾸기">
        <View style={styles.lvList}>
          {/* Lv.0 HELLO ENGLISH: 교재가 아직 없어 맵을 그릴 수 없어요 (라이브러리 · 전체 진도에서도 '준비 중') */}
          <Pressable
            onPress={() => {
              sfx('tap');
              showToast('Lv.0 교재는 준비 중이에요 · 들어오면 맵이 열려요');
            }}
            accessibilityRole="radio"
            accessibilityState={{ checked: false, disabled: true }}
            accessibilityLabel="Lv.0 HELLO ENGLISH · 준비 중">
            {({ pressed }) => (
              <View style={StyleSheet.flatten([styles.lvRow, styles.lvRowOff, pressed && styles.pillPressed])}>
                <View style={StyleSheet.flatten([styles.lvDot, { backgroundColor: LV0_COLOR }])}>
                  <PText style={styles.lvDotT} color={Colors.white}>
                    0
                  </PText>
                </View>
                <View style={styles.lvTx}>
                  <PText style={styles.lvName} numberOfLines={1}>
                    HELLO ENGLISH
                  </PText>
                  <PText style={styles.lvAbout} numberOfLines={1}>
                    왕기초 · 교재 준비 중
                  </PText>
                </View>
              </View>
            )}
          </Pressable>
          {STUDY_LEVELS.map((L) => {
            const on = L.lv === LV;
            return (
              <Pressable key={L.lv} onPress={() => pickLevel(L.lv)} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={`Lv.${L.lv} ${L.series}${L.lv === MY_LV ? ' · 내 교재' : ''}`}>
                {({ pressed }) => (
                  <View style={StyleSheet.flatten([styles.lvRow, on && styles.lvRowOn, pressed && styles.pillPressed])}>
                    <View style={StyleSheet.flatten([styles.lvDot, { backgroundColor: L.c }])}>
                      <PText style={styles.lvDotT} color={Colors.white}>
                        {L.lv}
                      </PText>
                    </View>
                    <View style={styles.lvTx}>
                      <PText style={styles.lvName} numberOfLines={1}>
                        {L.series}
                        {L.lv === MY_LV ? <PText style={styles.lvMine}> · 내 교재</PText> : null}
                      </PText>
                      <PText style={styles.lvAbout} numberOfLines={1}>
                        {L.about}
                      </PText>
                    </View>
                    {on && <PText style={styles.lvCheck}>✓</PText>}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
      <SkipSheet stage={skipStage} left={skipLeft} onClose={() => setSkipStage(null)} onPass={pass} />
      {cele && <Celebrate visible result={cele} onHome={() => setCele(null)} />}
      {chestOpen && (
        <ChestCelebrate
          unit={lesson}
          unitLabel={M.chipLabel(lesson)}
          title={M.unitTitle(lesson)}
          reward={chestReward(lesson)}
          opened={opened}
          onOpen={() => markChestOpened(chestKey(LV, lesson))}
          onHome={() => setChestOpen(false)}
          onNext={
            next
              ? () => {
                  setChestOpen(false);
                  tryLesson(nextNo);
                }
              : undefined
          }
        />
      )}
    </Raised>
  );
}

/* ───────── 길: 끝낸 구간은 잉크 실선 · 남은 구간은 점선 ───────── */

function MapPath({ map, done, all, width }: { map: ReturnType<typeof layout>; done: boolean[]; all: boolean; width: number }) {
  const pts: Point[] = [...map.nodes, map.chest];
  const doneIdx = done.reduce((m, d, i) => (d ? i : m), -1);
  const split = all ? pts.length : Math.max(1, doneIdx + 2);
  const solid = pts.slice(0, split);
  const dashed = pts.slice(Math.max(0, split - 1));
  return (
    <Svg width={width} height={map.height} style={StyleSheet.absoluteFill} pointerEvents="none">
      {dashed.length > 1 && <Path d={curve(dashed)} fill="none" stroke="#C9C2B3" strokeWidth={6} strokeLinecap="round" strokeDasharray="2 12" />}
      {solid.length > 1 && <Path d={curve(solid)} fill="none" stroke={Colors.ink} strokeWidth={6} strokeLinecap="round" />}
    </Svg>
  );
}

/* ───────── 챕터 줄: 이번 주 진도 보기 · 고른 과 보이게 ───────── */

const WK_EASE = cubicBezier(0.3, 1.6, 0.5, 1);
/** wkBounce .8초: 이번 주 과 칩이 통통 */
const wkBounce = css.keyframes({
  '0%': { transform: [{ translateY: 0 }, { scale: 1 }] },
  '30%': { transform: [{ translateY: -10 }, { scale: 1.06 }] },
  '55%': { transform: [{ translateY: 0 }, { scale: 0.97 }] },
  '75%': { transform: [{ translateY: -4 }, { scale: 1 }] },
  '100%': { transform: [{ translateY: 0 }, { scale: 1 }] },
});

const wkAnim = css.create({
  0: { animationName: wkBounce, animationDuration: '800ms', animationDelay: '280ms', animationTimingFunction: WK_EASE },
  1: { animationName: wkBounce, animationDuration: '800ms', animationDelay: '370ms', animationTimingFunction: WK_EASE },
});

function ChapChip({ M, n, on, week, locked, bounce, onPress, onLayout }: { M: LevelMap; n: number; on: boolean; week: boolean; locked: boolean; bounce: number; onPress: () => void; onLayout: (x: number, w: number) => void }) {
  const still = useStill();
  const count = useDoneCount(`${M.lv}:${n}:`);
  const full = count >= M.steps.length;
  const part = count > 0 && !full;
  const k = M.week.indexOf(n);
  const anim = week && bounce > 0 && !still ? wkAnim[k === 0 ? 0 : 1] : null;
  return (
    // 이번 주 칩은 누를 때마다 key 를 바꿔 처음부터 다시 통통
    <Animated.View key={week ? bounce : 0} style={anim} onLayout={(e) => onLayout(e.nativeEvent.layout.x, e.nativeEvent.layout.width)}>
      <Pressable
        onPress={onPress}
        accessibilityRole="tab"
        accessibilityState={{ selected: on }}
        accessibilityLabel={`${M.unitName(n)}${locked ? ', 지점 회원 전용' : `, ${count}/${M.steps.length}`}${week ? ', 이번 주 스터디 진도' : ''}`}
        style={({ pressed }) => StyleSheet.flatten([styles.chap, week && styles.chapWeek, full && styles.chapDone, on && styles.chapOn, locked && styles.chapLocked, pressed && styles.chapPressed])}>
        {/* 비회원 잠금: 흐리게 + 자물쇠 */}
        {locked && <LineIcon d={LOCK_PATH} size={12} width={2.6} color={Colors.inkSub} />}
        <PText style={styles.chapText} color={on ? Colors.white : locked ? Colors.inkSub : Colors.ink}>
          {M.chipLabel(n)}
        </PText>
        {full && <LineIcon d={CHECK_PATH} size={12} width={3.6} color={on ? Colors.yellow : Colors.ink} />}
        {part && !on && <View style={styles.chapDot} />}
      </Pressable>
    </Animated.View>
  );
}

/* ───────── 보상 상자 (.node.chest · .tchest) ───────── */

/** chestShake 2.4초: 열 수 있는 상자가 가끔 들썩 */
const chestShakeKf = css.keyframes({
  '0%, 52%, 100%': { transform: [{ translateY: 0 }, { rotate: '0deg' }] },
  '58%': { transform: [{ translateY: -6 }, { rotate: '-7deg' }] },
  '64%': { transform: [{ translateY: -6 }, { rotate: '6deg' }] },
  '70%': { transform: [{ translateY: -3 }, { rotate: '-4deg' }] },
  '76%': { transform: [{ translateY: 0 }, { rotate: '2deg' }] },
  '82%': { transform: [{ translateY: 0 }, { rotate: '0deg' }] },
});
/** chestLid: 뚜껑이 살짝 들썩 */
const chestLidKf = css.keyframes({
  '0%, 55%, 85%, 100%': { transform: [{ translateY: 0 }, { rotate: '0deg' }] },
  '62%': { transform: [{ translateY: -5 }, { rotate: '-4deg' }] },
  '70%': { transform: [{ translateY: -3 }, { rotate: '3deg' }] },
});
/** shake .4초: 잠긴 상자를 누르면 도리도리 */
const lockedShake = css.keyframes({
  '0%, 100%': { transform: [{ translateX: 0 }] },
  '20%, 60%': { transform: [{ translateX: -6 }] },
  '40%, 80%': { transform: [{ translateX: 6 }] },
});

/**
 * 맵 끝의 보상 상자 (보석함 · treasure-chest). 잠김: 회색 · 열 수 있음: 보라 + 들썩 + 빛 · 이미 연 상자: 열린 모습 그대로.
 * 누르면 챕터 완료 보상 화면 (ChestCelebrate).
 */
function ChestNode({ M, x, y, ready, opened, lesson, xmas, shake, onPress }: { M: LevelMap; x: number; y: number; ready: boolean; opened: boolean; lesson: number; xmas: boolean; shake: number; onPress: () => void }) {
  const still = useStill();
  const live = ready && !opened;
  const W = ready ? 80 : 72;
  const H = Math.round(W * (106 / 120));
  const loop = (name: typeof chestShakeKf) =>
    live && !still ? { animationName: name, animationDuration: '2400ms', animationIterationCount: 'infinite' as const, animationTimingFunction: 'ease-in-out' as const } : null;
  const nudge = !ready && shake > 0 && !still ? { animationName: lockedShake, animationDuration: '400ms' } : null;
  return (
    <View style={StyleSheet.flatten([styles.chestWrap, { left: x - W / 2, top: y - H / 2 - 3, width: W }])}>
      {live && (
        <View style={{ position: 'absolute', left: W / 2, top: H / 2 }}>
          <CurrentFx chest />
        </View>
      )}
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${M.chipLabel(lesson)} 보상 상자${opened ? ', 받은 보상 보기' : ready ? ', 열 수 있어요' : ', 잠김'}`}>
        {({ pressed }) => (
          <Animated.View key={shake} style={[{ width: W, height: H }, nudge, ready && pressed && styles.chestPressed]}>
            <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: '50% 90%' }, loop(chestShakeKf)]}>
              <TreasureChest width={W} locked={!ready} open={opened} lidLoop={loop(chestLidKf)} />
            </Animated.View>
          </Animated.View>
        )}
      </Pressable>
      <PText style={StyleSheet.flatten([styles.nodeLabel, styles.chestLabel, ready && styles.chestLabelOpen, xmas && styles.labelXmas])}>{M.chipLabel(lesson)} 보상</PText>
    </View>
  );
}

/** 카드 바탕의 옅은 점 무늬 (웹에서는 크기를 직접 줘야 카드 전체에 깔려요) */
function DotPattern() {
  const [size, setSize] = useState({ w: 0, h: 0 });
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {size.w > 0 && (
        <Svg width={size.w} height={size.h}>
          <Defs>
            <Pattern id="dots" width={18} height={18} patternUnits="userSpaceOnUse">
              <Circle cx={9} cy={9} r={1.2} fill="#ECE5D3" />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#dots)" />
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingTop: 16,
    paddingHorizontal: 14,
    paddingBottom: 20,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
  content: { zIndex: 1 },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  headLeft: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pillDark: {
    height: 26,
    paddingHorizontal: 11,
    borderRadius: 13,
    backgroundColor: Colors.ink,
    justifyContent: 'center',
  },
  pillPressed: { opacity: 0.7 },
  lvList: { gap: 8 },
  lvRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 16, borderWidth: 2, borderColor: Colors.line, backgroundColor: Colors.white },
  lvRowOff: { opacity: 0.55 },
  lvRowOn: { borderColor: Colors.ink, backgroundColor: Colors.yellow },
  lvDot: { width: 34, height: 34, borderRadius: 11, borderWidth: 2, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  lvDotT: { fontFamily: Font.display, fontSize: 15, lineHeight: 19 },
  lvTx: { flex: 1, minWidth: 0 },
  lvName: { fontFamily: Font.body900, fontSize: 14.5, lineHeight: 20 },
  lvMine: { fontFamily: Font.body800, fontSize: 12, color: Colors.purple },
  lvAbout: { marginTop: 1, fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  lvCheck: { fontFamily: Font.body900, fontSize: 16, lineHeight: 20 },
  pillDarkText: { fontFamily: Font.body800, fontSize: 12, lineHeight: 16 },
  weekChip: {
    height: 26,
    paddingHorizontal: 9,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: '#F1EBDC',
    justifyContent: 'center',
  },
  weekText: { fontFamily: Font.body900, fontSize: 11, lineHeight: 14 },
  allBtn: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.ink,
    backgroundColor: Colors.yellow,
    justifyContent: 'center',
  },
  allText: { fontFamily: Font.body800, fontSize: 12, lineHeight: 16 },
  title: { marginTop: 8, fontSize: 20, lineHeight: 25 },
  chapScroll: { marginHorizontal: -14, marginTop: 6 },
  chapRow: { gap: 8, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 6 },
  chap: {
    minWidth: 58,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  chapWeek: { backgroundColor: '#F1EBDC' },
  chapDone: { backgroundColor: Colors.yellow },
  chapOn: { backgroundColor: Colors.ink },
  chapLocked: { opacity: 0.55, borderStyle: 'dashed' },
  chapPressed: { transform: [{ scale: 0.94 }] },
  chapText: { fontFamily: Font.display, fontSize: 13, lineHeight: 16 },
  // .chap.part::after: 진행 중인 과는 노란 점
  chapDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.yellow, borderWidth: 1.5, borderColor: Colors.ink },
  prog: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  track: {
    flex: 1,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: '#F6F1E4',
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: Colors.yellow },
  progText: { fontFamily: Font.display, fontSize: 12, lineHeight: 16 },
  map: { marginTop: 8 },
  zoneWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  zone: {
    height: 40,
    paddingHorizontal: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 5,
  },
  zoneNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneNumText: { fontFamily: Font.display, fontSize: 12, lineHeight: 15 },
  zoneLabel: {
    fontFamily: Font.body900,
    fontSize: 14,
    lineHeight: 18,
    marginRight: 6,
  },
  skip: {
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(30,26,43,0.25)',
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
  },
  // .z2s:active: 하얗게 · 살짝 작게
  skipPressed: { backgroundColor: Colors.white, transform: [{ scale: 0.95 }] },
  skipText: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 15 },
  nodeWrap: { position: 'absolute', alignItems: 'center', zIndex: 3 },
  // 사탕 같은 볼록 동전: 위쪽 반달 광택 · 아래로 갈수록 살짝 어둡게 · 안쪽 아래 그늘 · 잉크 바닥 그림자 (프로토타입 #qmapInner .node)
  node: {
    borderWidth: 2.5,
    borderColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundImage:
      'radial-gradient(ellipse 62% 36% at 50% 20%, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.35) 55%, rgba(255, 255, 255, 0) 72%), radial-gradient(ellipse 90% 60% at 50% 100%, rgba(30, 26, 43, 0.14) 0%, rgba(30, 26, 43, 0) 70%), linear-gradient(180deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 45%)',
    boxShadow: 'inset 0 -6px 0 rgba(30, 26, 43, 0.1), inset 0 2px 0 rgba(255, 255, 255, 0.7), 0 5px 0 #1E1A2B, 0 12px 14px -4px rgba(30, 26, 43, 0.22)',
  },
  nodePressed: {
    transform: [{ translateY: 4 }],
    boxShadow: 'inset 0 -6px 0 rgba(30, 26, 43, 0.1), inset 0 2px 0 rgba(255, 255, 255, 0.7), 0 1px 0 #1E1A2B',
  },
  nodeNum: { fontFamily: Font.display, fontSize: 17, lineHeight: 21 },
  nodeNumCur: { fontFamily: Font.display, fontSize: 22, lineHeight: 27 },
  nodeLabel: {
    marginTop: 5,
    fontFamily: Font.body800,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  chestWrap: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 3,
  },
  chestPressed: { transform: [{ translateY: 3 }] },
  chestLabel: { color: '#9A93A6', marginTop: 2 },
  chestLabelOpen: { color: Colors.ink },
  labelXmas: {
    color: XMAS.cream,
    textShadowColor: XMAS.top,
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 1 },
  },
  nextBtn: {
    height: 56,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  // 장식(나무 · 눈 언덕)보다 위에 · 카드 아래 끝에서 띄워요
  nextWrap: { zIndex: 5, marginBottom: Spacing.stack },
  // 비회원: 다음 챕터 잠김 (흐린 면 · 자물쇠)
  nextLocked: { backgroundColor: '#EEE8DA' },
  nextText: { flex: 1, fontFamily: Font.body900, fontSize: 15, lineHeight: 20 },
});
