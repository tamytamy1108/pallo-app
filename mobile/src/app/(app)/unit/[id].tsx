import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Stack } from 'expo-router/js-stack';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from '@/components/ui/safe-area';
import Svg, { Path } from 'react-native-svg';

import { apiErrorMessage } from '@/api/errors';
import { bookShelfQuery } from '@/api/queries';
import { BackButton } from '@/components/ui/back-button';
import { Pressable } from '@/components/ui/pressable';
import { SCREEN } from '@/lib/transitions';
import { LessonSheet } from '@/components/library/lesson-sheet';
import { openStep } from '@/components/library/open-step';
import { StepPopup } from '@/components/library/step-popup';
import { ListenCard, UnitHero, UnitSummary } from '@/components/library/unit-parts';
import { Raised } from '@/components/ui/raised';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-view';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { useScrollEndPad } from '@/components/ui/scroll-end';
import { STAGES, STAGE_COLOR, STAGE_KO, STUDY_STEPS, findLevel, listenItemsOf, parseUnitId, stepTitle, unitId, type StageKey, type Step, type StudyLevel, type Lesson } from '@/data/library';
import { sfx } from '@/lib/feedback';
import { isDone, stepKey, useDoneCount, useIsDone, useSavedPos } from '@/state/progress';
import { ChapterGate } from '@/components/common/member-lock';
import { usePullRefresh } from '@/components/ui/pull-refresh';

const NOTE: Record<StageKey, string> = {
  pre: '스터디 전에 해요. 수업에서 바로 말할 수 있게 표현과 내 답을 미리 준비해요.',
  main: '스터디에서 하는 활동이에요. 못 온 날은 AI와 같은 활동을 해요.',
  post: '스터디가 끝난 뒤 해요. 예습 때 답과 비교해서 얼마나 늘었는지 보여줘요.',
};

const back = () => (router.canGoBack() ? router.back() : router.replace('/library'));

/**
 * 과 화면 (프로토타입 #study · showHub): 표지 · 제목 → 오늘의 패턴(이번 회차) → 리스닝 룸 → 예습 · 본학습 · 복습 탭 → 단계 카드.
 * 단계 카드: 다음 할 단계 = 연노랑 + '다음', 하다 만 단계 = '이어서', 끝낸 단계 = 체크. 누르면 시작 창 → 레슨.
 */
function UnitScreen() {
  // '/unit/1-1' (레벨-과) · 홈 스터디 맵의 '/unit/1?lv=1' 둘 다 받아요
  const { id, lv: lvParam } = useLocalSearchParams<{ id: string; lv?: string }>();
  const { lv, no } = id?.includes('-') ? parseUnitId(id) : { lv: Number(lvParam ?? 1), no: Number(id) };
  // 과 목록은 17 /library/books 책장에서 (라이브러리 탭에서 받아 둔 값)
  const shelf = useQuery(bookShelfQuery());
  if (shelf.isPending || shelf.isError)
    return (
      <SafeAreaView style={styles.safe}>
        <TopBar title="" onList={() => {}} />
        {shelf.isPending ? <LoadingState /> : <ErrorState message={apiErrorMessage(shelf.error)} onRetry={() => shelf.refetch()} />}
      </SafeAreaView>
    );
  const L = findLevel(shelf.data, lv);
  const ls = L?.lessons.find((x) => x.no === no);
  if (!L || !ls || !ls.data)
    return (
      <SafeAreaView style={styles.safe}>
        <TopBar title="" onList={() => {}} />
        <EmptyState title="교재 데이터가 들어오면 열려요" />
      </SafeAreaView>
    );
  return <UnitBody key={`${lv}-${no}`} L={L} ls={ls} />;
}

function UnitBody({ L, ls }: { L: StudyLevel; ls: Lesson }) {
  const endPad = useScrollEndPad();
  const pull = usePullRefresh();
  useDoneCount(`${L.lv}:${ls.no}:`);
  const steps = STUDY_STEPS[L.kind];
  const doneIn = (k: StageKey) => steps[k].filter((s) => isDone(stepKey(L.lv, ls.no, s.id))).length;
  // 처음 열면 아직 남은 단계가 있는 구역부터
  const [stage, setStage] = useState<StageKey>(() => STAGES.find((k) => doneIn(k) < steps[k].length) ?? 'post');
  const [sheet, setSheet] = useState(false);
  const [pop, setPop] = useState<{ s: Step; i: number } | null>(null);
  const list = steps[stage];
  const nextId = list.find((s) => !isDone(stepKey(L.lv, ls.no, s.id)))?.id;
  const items = listenItemsOf(unitId(L.lv, ls.no));
  const unit = L.kind === 'pattern' || L.kind === 'basic' ? '과' : '회차';
  const popKey = pop ? stepKey(L.lv, ls.no, pop.s.id) : '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={SCREEN.push} />
      <TopBar title={`LV.${L.lv} ${L.series}`} onList={() => setSheet(true)} />
      <ScrollView {...pull.scrollProps} contentContainerStyle={[styles.body, { paddingBottom: endPad }]}>
        <UnitHero L={L} ls={ls} />
        <UnitSummary L={L} ls={ls} />
        <ListenCard sub={`이 ${unit} 문장 ${items.length}개 · 영어→뜻 · 따라 말하기`} onPress={() => router.push(`/listening?unit=${unitId(L.lv, ls.no)}` as Href)} />
        <StageTabs stage={stage} counts={STAGES.map((k) => `${doneIn(k)}/${steps[k].length}`)} onStage={setStage} />
        <PText style={styles.note}>{NOTE[stage]}</PText>
        <View style={styles.steps}>
          {list.map((s, i) => (
            <StepCard key={s.id} L={L} ls={ls} s={s} i={i} stage={stage} next={s.id === nextId} onPress={() => setPop({ s, i })} />
          ))}
        </View>
      </ScrollView>
      <LessonSheet open={sheet} onClose={() => setSheet(false)} L={L} current={ls.no} />
      <PopupFor
        stepK={popKey}
        info={pop ? { kick: `${STAGE_KO[stage]} · ${pop.i + 1}`, title: stepTitle(pop.s, ls.data), xp: pop.s.xp, done: isDone(popKey) } : null}
        onClose={() => setPop(null)}
        onGo={(mode) => {
          const s = pop?.s;
          setPop(null);
          if (s) openStep(L.lv, ls.no, s.id, mode);
        }}
      />
    </SafeAreaView>
  );
}

/** 시작 창에 멈춘 곳(이어서)을 넣어요 */
function PopupFor({ stepK, info, onClose, onGo }: { stepK: string; info: { kick: string; title: string; xp: number; done: boolean } | null; onClose: () => void; onGo: (mode: 'start' | 'resume' | 'restart') => void }) {
  const pos = useSavedPos(stepK);
  return <StepPopup info={info ? { ...info, pos } : null} onClose={onClose} onGo={onGo} />;
}

/** 위 줄: ‹ 뒤로 · 가운데 'LV.1 EVERYDAY ENGLISH ▾' (누르면 과 목록) */
function TopBar({ title, onList }: { title: string; onList: () => void }) {
  return (
    <View style={styles.top}>
      <BackButton onPress={back} label="라이브러리로" />
      {title ? (
        <Pressable
          onPress={() => {
            sfx('tap');
            onList();
          }}
          accessibilityRole="button"
          accessibilityLabel="과 목록 열기"
          style={styles.mid}>
          <PText style={styles.midText} numberOfLines={1}>
            {title}
          </PText>
          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={Colors.ink} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M6 9l6 6 6-6" />
          </Svg>
        </Pressable>
      ) : null}
      <View style={styles.backBtn} />
    </View>
  );
}

/** 예습 · 본학습 · 복습 (프로토타입 .segtabs.st-stagetabs) — 바꿔도 스크롤 위치 그대로 */
function StageTabs({ stage, counts, onStage }: { stage: StageKey; counts: string[]; onStage: (k: StageKey) => void }) {
  return (
    <View style={styles.seg} accessibilityRole="tablist">
      {STAGES.map((k, i) => {
        const on = k === stage;
        return (
          <Pressable
            key={k}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => {
              if (on) return;
              sfx('tap');
              onStage(k);
            }}
            style={[styles.segBtn, on && styles.segOn]}>
            <PText style={styles.segText} color={on ? Colors.white : Colors.ink}>
              {STAGE_KO[k]}
              <PText style={styles.segEm} color={on ? Colors.white : Colors.ink}>
                {'  '}
                {counts[i]}
              </PText>
            </PText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** 단계 카드 (프로토타입 .st-step): 번호(끝내면 체크) · 이름 · 설명 · 다음/이어서/다시 하기 · +P */
function StepCard({ L, ls, s, i, stage, next, onPress }: { L: StudyLevel; ls: Lesson; s: Step; i: number; stage: StageKey; next: boolean; onPress: () => void }) {
  const key = stepKey(L.lv, ls.no, s.id);
  const done = useIsDone(key);
  const resume = useSavedPos(key) !== undefined;
  const tag = resume ? '이어서' : next ? '다음' : done ? '다시 하기' : '';
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${stepTitle(s, ls.data)} ${tag}`}>
      {({ pressed }) => (
        <Raised radius={22} pressed={pressed} style={styles.tight}>
          <View style={[styles.step, next && styles.stepNext]}>
            <View style={[styles.sn, (next || done) && { backgroundColor: STAGE_COLOR[stage] }]}>
              {done ? (
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={Colors.ink} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="m5 12 5 5 9-10" />
                </Svg>
              ) : (
                <PText style={styles.snText}>{i + 1}</PText>
              )}
            </View>
            <View style={styles.stepT}>
              <PText style={styles.stepB}>{stepTitle(s, ls.data)}</PText>
              <PText style={styles.stepS}>{s.d}</PText>
            </View>
            <View style={styles.min}>
              {tag ? <PText style={styles.minB}>{tag}</PText> : null}
              <PText style={styles.minText}>+{s.xp}P</PText>
            </View>
          </View>
        </Raised>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingBottom: 10 },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  mid: { flex: 1, height: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 4 },
  midText: { flexShrink: 1, fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  body: { paddingTop: 6, paddingHorizontal: 16, gap: 10 },
  note: { marginTop: -4, marginHorizontal: 2, fontFamily: Font.body700, fontSize: 13, lineHeight: 20.15, color: Colors.inkSub },
  seg: { flexDirection: 'row', gap: 6, padding: 5, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  segBtn: { flex: 1, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: Colors.ink },
  segText: { fontFamily: Font.body800, fontSize: 14, lineHeight: 19 },
  segEm: { fontFamily: Font.display, fontSize: 11, lineHeight: 19, opacity: 0.75 },
  steps: { gap: 10 },
  tight: { marginBottom: 0 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 22, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  stepNext: { backgroundColor: '#FFFBE0' },
  sn: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  snText: { fontFamily: Font.display, fontSize: 13, lineHeight: 16 },
  stepT: { flex: 1, minWidth: 0, gap: 2 },
  stepB: { fontFamily: Font.body900, fontSize: 15, lineHeight: 19.5, letterSpacing: -0.2 },
  stepS: { fontFamily: Font.body600, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  min: { alignItems: 'flex-end' },
  minB: { fontFamily: Font.body900, fontSize: 12, lineHeight: 18 },
  minText: { fontFamily: Font.body800, fontSize: 11, lineHeight: 16.5, color: Colors.inkSub },
});

/** 비회원은 맵마다 첫 챕터만 (components/common/member-lock ChapterGate) */
export default function UnitScreenGate() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const no = id?.includes('-') ? parseUnitId(id).no : Number(id ?? 1);
  return (
    <ChapterGate no={no} label={`${no}과`}>
      <UnitScreen />
    </ChapterGate>
  );
}
