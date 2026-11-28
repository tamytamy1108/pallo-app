import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { apiErrorMessage, isNotFound } from '@/api/errors';
import { basicLessonQuery } from '@/api/queries';
import { ChapterGate } from '@/components/common/member-lock';
import { Celebrate } from '@/components/lesson/celebrate';
import { TaskRunner } from '@/components/lesson/task-runner';
import { leaveLesson, useStepFinish } from '@/components/lesson/use-step-finish';
import { Screen } from '@/components/screen';
import { SafeAreaView } from '@/components/ui/safe-area';
import { ErrorState, LoadingState } from '@/components/ui/state-view';
import { PText } from '@/components/ui/text';
import { Colors } from '@/constants/theme';
import { step0Def, step0Tasks, STEP0_DEFS, type Lesson0, type Step0Def } from '@/data/lesson-lv0';
import { setLastStep, stepKey } from '@/state/progress';

/**
 * Lv.0 HELLO ENGLISH 레슨 화면. 주소: /lesson0/[step]?lv=0&unit=1
 * 단계마다 한 화면에 한 문제 진행기 (TaskRunner) — 키워드 짝 맞추기 · 퍼즐 빈칸 · Our Story 답하기 · 변형 단어 카드 · 문장 따라 말하기.
 * 다 끝내면 완료(축하) 화면 → [이어서 하기]로 다음 단계. 과 콘텐츠는 18 `GET /lessons/0-과` 로 받아요.
 */
function Lesson0Screen() {
  const p = useLocalSearchParams<{ step: string; unit?: string; resume?: string }>();
  const unit = Number(p.unit ?? 1) || 1;
  const step = step0Def(p.step);
  const q = useQuery({ ...basicLessonQuery(unit), enabled: !!step });
  if (step && q.isPending) return <LessonState><LoadingState /></LessonState>;
  if (step && q.isError && !isNotFound(q.error))
    return (
      <LessonState>
        <ErrorState message={apiErrorMessage(q.error)} onRetry={() => q.refetch()} />
      </LessonState>
    );
  const D = q.data;
  if (!D || !step) {
    return (
      <Screen title="준비 중">
        <PText>교재 데이터가 들어오면 열려요.</PText>
      </Screen>
    );
  }
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StepScreen key={`0:${unit}:${step.id}`} D={D} step={step} resume={p.resume === 'resume' || p.resume === 'restart' ? p.resume : undefined} />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

function LessonState({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {children}
    </SafeAreaView>
  );
}

function StepScreen({ D, step, resume }: { D: Lesson0; step: Step0Def; resume?: 'resume' | 'restart' }) {
  const { finish, cel, goHome, goNext } = useStepFinish(D.lv, D.unit, step, STEP0_DEFS);
  const skey = stepKey(D.lv, D.unit, step.id);
  useEffect(() => setLastStep(D.lv, D.unit, step.id), [D.lv, D.unit, step.id]);
  const tasks = useMemo(() => step0Tasks(D, step.id, `${skey}:answers`), [D, step.id, skey]);
  return (
    <>
      <TaskRunner skey={skey} kick={step.t} tasks={tasks} source={`Lv.0 ${D.unit}과 · ${step.t}`} resume={resume} onDone={(s) => finish(s)} onLeave={leaveLesson} />
      {cel ? <Celebrate visible result={cel.result} onHome={goHome} onNext={goNext} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: Colors.cream },
});

/** 비회원은 맵마다 첫 챕터만 (components/common/member-lock ChapterGate) */
export default function Lesson0ScreenGate() {
  const no = Number(useLocalSearchParams<{ unit?: string }>().unit ?? 1);
  return (
    <ChapterGate no={no} label={`${no}과`}>
      <Lesson0Screen />
    </ChapterGate>
  );
}
