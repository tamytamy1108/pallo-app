import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/js-stack';
import { useEffect, useState } from 'react';

import { apiErrorMessage, isNotFound } from '@/api/errors';
import { unit34Query } from '@/api/queries';
import { setChallengeOfferOff } from '@/lib/chal-offer';
import { SCREEN } from '@/lib/transitions';
import { corner34 } from '@/components/lesson34/corners';
import type { StepCtx } from '@/components/lesson34/finish';
import { StepPage } from '@/components/lesson34/pages';
import { TaskRunner } from '@/components/lesson34/runner';
import { Screen } from '@/components/screen';
import { ErrorState, LoadingState } from '@/components/ui/state-view';
import { PText } from '@/components/ui/text';
import { findStep34, unitName34, type Unit34 } from '@/data/lessons34';
import { useLearnPrefs } from '@/state/learn-prefs';
import { setLastStep, stepKey } from '@/state/progress';
import { ChapterGate } from '@/components/common/member-lock';

/**
 * Lv.3 · 4 레슨 (프로토타입 RUN34 진행기 · STEP_VIEW 단계 화면). 주소: /lesson34/[단계 id]?lv=3|4&unit=회차
 * 단계 id 는 프로토타입 STUDY_STEPS.topic · .debate 그대로 (kwl tread match pick6 · warm dtalk ttalk · quiz journal ba / free key side · free2 deb fq · better swap final).
 * 회차 콘텐츠는 18 `GET /lessons/:id` (id = '레벨-회차') 로 받아요.
 */
function Lesson34Screen() {
  const p = useLocalSearchParams<{ step: string; lv?: string; unit?: string; resume?: string }>();
  const lv = p.lv === '4' ? 4 : 3;
  const unit = Number(p.unit) || 101;
  const q = useQuery(unit34Query(lv, unit));
  const screen = <Stack.Screen options={SCREEN.rise} />;
  const missing = isNotFound(q.error);
  if (q.isPending || (q.isError && !missing))
    return (
      <Screen title="">
        {screen}
        {q.isPending ? <LoadingState /> : <ErrorState message={apiErrorMessage(q.error)} onRetry={() => q.refetch()} />}
      </Screen>
    );
  // 회차 · 단계가 바뀌면 처음부터 (문제 목록을 새로 만들어요)
  return <Lesson34Body key={`${lv}:${unit}:${p.step}`} lv={lv} unit={unit} stepId={p.step} u={q.data} resume={p.resume === 'resume' || p.resume === 'restart' ? p.resume : undefined} />;
}

function Lesson34Body({ lv, unit, stepId, u, resume }: { lv: 3 | 4; unit: number; stepId: string; u: Unit34 | undefined; resume?: 'resume' | 'restart' }) {
  const found = findStep34(lv, stepId);
  const { noSpeak } = useLearnPrefs();
  // 문제 목록은 처음 열 때 한 번만 만들어요 (말하기가 어려워요를 켜고 끄면 문제 안에서 바뀌어요)
  const [env] = useState(() => (u && found ? { uk: `${lv}:${unit}`, key: stepKey(lv, unit, stepId), source: `Lv.${lv} ${unitName34(u)} · ${found.step.t}`, noSpeak } : null));

  // TOPIC 이야기하기에서는 표현을 저장해도 챌린지 열기 알림을 띄우지 않아요 (프로토타입 noChal)
  useEffect(() => {
    setChallengeOfferOff(stepId === 'ttalk');
    return () => setChallengeOfferOff(false);
  }, [stepId]);

  // 홈 스터디 맵이 여기서 시작해요 (프로토타입 openStep 의 ST.last)
  useEffect(() => {
    if (found) setLastStep(lv, unit, stepId);
  }, [found, lv, unit, stepId]);

  const screen = <Stack.Screen options={SCREEN.rise} />;
  if (!u || !found || !env) {
    return (
      <Screen title="준비 중">
        {screen}
        <PText>교재 데이터가 들어오면 열려요</PText>
      </Screen>
    );
  }
  const ctx: StepCtx = { lv, unit, step: found.step, source: env.source, resume };
  const corner = corner34(u, stepId, env);
  return (
    <>
      {screen}
      {corner ? <TaskRunner ctx={ctx} kick={corner.kick} build={corner.build} /> : <StepPage ctx={ctx} u={u} />}
    </>
  );
}

/** 비회원은 맵마다 첫 챕터만 (components/common/member-lock ChapterGate) */
export default function Lesson34ScreenGate() {
  const no = Number(useLocalSearchParams<{ unit?: string }>().unit ?? 1);
  return (
    <ChapterGate no={no} label={`${no}과`}>
      <Lesson34Screen />
    </ChapterGate>
  );
}
