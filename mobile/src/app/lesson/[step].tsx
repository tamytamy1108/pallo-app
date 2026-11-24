import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ClientErrorCode, errorMessage, isApiError } from '@/api/errors';
import { patternLessonQuery } from '@/api/queries';
import { Celebrate } from '@/components/lesson/celebrate';
import { ChalView } from '@/components/lesson/chal-view';
import { QuizView } from '@/components/lesson/quiz-view';
import { SitView } from '@/components/lesson/sit-view';
import { StoryView } from '@/components/lesson/story-view';
import { TalkView } from '@/components/lesson/talk-view';
import { TaskRunner } from '@/components/lesson/task-runner';
import { leaveLesson, useStepFinish } from '@/components/lesson/use-step-finish';
import { Screen } from '@/components/screen';
import { ErrorState, LoadingState } from '@/components/ui/state-view';
import { PText } from '@/components/ui/text';
import { Colors } from '@/constants/theme';
import { bankTasks, chalFinishTasks, dialogueTasks, patternTasks, stepDef, stepTitle, storyTasks, type LessonData, type StepDef, type Task } from '@/data/lessons';
import { setLastStep, stepKey } from '@/state/progress';
import { ChapterGate } from '@/components/common/member-lock';

/**
 * 레슨 화면 (프로토타입 #lesson 진행기 · #study 단계 화면). 주소: /lesson/[step]?lv=1&unit=1
 * - 예습(오늘의 패턴 · 대화문 · Bank)은 한 화면에 한 문제 진행기
 * - 본학습 · 복습(상황 활동 · My Story · AI 프리토킹 · 스피킹 퀴즈 · 챌린지)은 단계 화면 → 끝에 진행기로 이어지기도 해요
 * - 다 끝내면 완료(축하) 화면. resume=resume|restart: 앞 화면(과 화면 팝업)에서 이미 고른 경우
 * 과 콘텐츠는 18 `GET /lessons/:id` (id = '레벨-과') 로 받아요. 같은 과의 다른 단계로 가면 받아 둔 값을 그대로 써요.
 */
function LessonScreen() {
  const p = useLocalSearchParams<{ step: string; lv?: string; unit?: string; resume?: string }>();
  const lv = Number(p.lv ?? 1) || 1;
  const unit = Number(p.unit ?? 1) || 1;
  const step = stepDef(p.step);
  const q = useQuery({ ...patternLessonQuery(lv, unit), enabled: !!step });
  if (step && q.isPending) return <LessonState><LoadingState /></LessonState>;
  if (step && q.isError && !(isApiError(q.error) && q.error.code === ClientErrorCode.notFound))
    return (
      <LessonState>
        <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />
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
        <StepScreen key={`${lv}:${unit}:${step.id}`} D={D} step={step} resume={p.resume === 'resume' || p.resume === 'restart' ? p.resume : undefined} />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

/** 과 콘텐츠를 받는 중 · 못 받았을 때 (레슨 화면과 같은 바탕) */
function LessonState({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {children}
    </SafeAreaView>
  );
}

function StepScreen({ D, step, resume }: { D: LessonData; step: StepDef; resume?: 'resume' | 'restart' }) {
  const { finish, cel, goHome, goNext } = useStepFinish(D.lv, D.unit, step);
  const skey = stepKey(D.lv, D.unit, step.id);
  // 홈 스터디 맵이 마지막으로 연 단계에서 시작해요
  useEffect(() => setLastStep(D.lv, D.unit, step.id), [D.lv, D.unit, step.id]);
  const source = `Lv.${D.lv} ${D.unit}과 · ${stepTitle(step, D)}`;
  // 단계 화면 끝에 이어지는 진행기 (My Story 문장 순서 · 따라 읽기, 챌린지 모범 답 따라 말하기)
  const [tail, setTail] = useState<{ kick: string; tasks: Task[] } | null>(null);
  const runnerTasks = useMemo<{ kick: string; tasks: Task[] } | null>(() => {
    if (step.id === 'pat') return { kick: '오늘의 패턴', tasks: patternTasks(D) };
    if (step.id === 'dlg') return { kick: '대화문', tasks: dialogueTasks(D) };
    if (step.id === 'bank') return { kick: D.bankName, tasks: bankTasks(D) };
    return null;
  }, [D, step.id]);
  const run = tail ?? runnerTasks;

  let body;
  if (run) {
    body = <TaskRunner key={tail ? 'tail' : 'main'} skey={skey} kick={run.kick} tasks={run.tasks} source={source} resume={tail ? 'restart' : resume} onDone={(s) => finish(s)} onLeave={leaveLesson} />;
  } else if (step.id === 'quiz') {
    body = <QuizView D={D} skey={skey} source={source} onFinish={(s) => finish(s)} onLeave={leaveLesson} />;
  } else if (step.id === 'sit' && D.scene) {
    body = <SitView D={D} skey={skey} source={source} onFinish={(s) => finish(s)} onLeave={leaveLesson} />;
  } else if (step.id === 'sit' && D.act) {
    // Lv.2 상황 역할극: 같은 대화 화면에 교재 상황 대사 · 추천 답 (프로토타입은 미션 대화 renderChat)
    body = <TalkView D={D} C={{ who: D.act.who, lines: D.act.lines, replies: D.act.replies }} title={D.actTitle} source={source} onFinish={(s) => finish(s)} onLeave={leaveLesson} />;
  } else if (step.id === 'talk') {
    body = <TalkView D={D} C={D.talk} title={stepTitle(step, D)} source={source} onFinish={(s) => finish(s)} onLeave={leaveLesson} />;
  } else if (step.id === 'story') {
    body = <StoryView D={D} skey={`${skey}:story`} onParagraph={(para) => setTail({ kick: 'My Story', tasks: storyTasks(para) })} onLeave={leaveLesson} />;
  } else if (step.id === 'chal') {
    body = <ChalView D={D} title={stepTitle(step, D)} onShadow={(model, sit) => setTail({ kick: '30초 챌린지 · 모범 답 따라 말하기', tasks: chalFinishTasks(model, sit) })} onFinish={() => finish(null)} onLeave={leaveLesson} />;
  } else {
    body = (
      <Screen title="준비 중">
        <PText>이 단계는 다음에 만들어요.</PText>
      </Screen>
    );
  }

  return (
    <>
      {body}
      {cel ? <Celebrate visible result={cel.result} onHome={goHome} onNext={goNext} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: Colors.cream },
});

/** 비회원은 맵마다 첫 챕터만 (components/common/member-lock ChapterGate) */
export default function LessonScreenGate() {
  const no = Number(useLocalSearchParams<{ unit?: string }>().unit ?? 1);
  return (
    <ChapterGate no={no} label={`${no}과`}>
      <LessonScreen />
    </ChapterGate>
  );
}
