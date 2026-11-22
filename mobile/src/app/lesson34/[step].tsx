import { useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/js-stack';
import { useEffect, useState } from 'react';

import { setChallengeOfferOff } from '@/lib/chal-offer';
import { SCREEN } from '@/lib/transitions';
import { corner34 } from '@/components/lesson34/corners';
import type { StepCtx } from '@/components/lesson34/finish';
import { StepPage } from '@/components/lesson34/pages';
import { TaskRunner } from '@/components/lesson34/runner';
import { Screen } from '@/components/screen';
import { PText } from '@/components/ui/text';
import { findStep34, findUnit34, unitName34 } from '@/data/lessons34';
import { useLearnPrefs } from '@/state/learn-prefs';
import { setLastStep, stepKey } from '@/state/progress';

/**
 * Lv.3 · 4 레슨 (프로토타입 RUN34 진행기 · STEP_VIEW 단계 화면). 주소: /lesson34/[단계 id]?lv=3|4&unit=회차
 * 단계 id 는 프로토타입 STUDY_STEPS.topic · .debate 그대로 (kwl tread match pick6 · warm dtalk ttalk · quiz journal ba / free key side · free2 deb fq · better swap final).
 */
export default function Lesson34Screen() {
  const p = useLocalSearchParams<{ step: string; lv?: string; unit?: string }>();
  const lv = p.lv === '4' ? 4 : 3;
  const unit = Number(p.unit) || 101;
  const u = findUnit34(lv, unit);
  const found = findStep34(lv, p.step);
  const { noSpeak } = useLearnPrefs();
  // 문제 목록은 처음 열 때 한 번만 만들어요 (말하기가 어려워요를 켜고 끄면 문제 안에서 바뀌어요)
  const [env] = useState(() => (u && found ? { uk: `${lv}:${unit}`, key: stepKey(lv, unit, p.step), source: `Lv.${lv} ${unitName34(u)} · ${found.step.t}`, noSpeak } : null));

  // TOPIC 이야기하기에서는 표현을 저장해도 챌린지 열기 알림을 띄우지 않아요 (프로토타입 noChal)
  useEffect(() => {
    setChallengeOfferOff(p.step === 'ttalk');
    return () => setChallengeOfferOff(false);
  }, [p.step]);

  // 홈 스터디 맵이 여기서 시작해요 (프로토타입 openStep 의 ST.last)
  useEffect(() => {
    if (found) setLastStep(lv, unit, p.step);
  }, [found, lv, unit, p.step]);

  const screen = <Stack.Screen options={SCREEN.rise} />;
  if (!u || !found || !env) {
    return (
      <Screen title="준비 중">
        {screen}
        <PText>교재 데이터가 들어오면 열려요</PText>
      </Screen>
    );
  }
  const ctx: StepCtx = { lv, unit, step: found.step, source: env.source };
  const corner = corner34(u, p.step, env);
  return (
    <>
      {screen}
      {corner ? <TaskRunner ctx={ctx} kick={corner.kick} build={corner.build} /> : <StepPage ctx={ctx} u={u} />}
    </>
  );
}
