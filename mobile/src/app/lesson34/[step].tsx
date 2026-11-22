import { useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/js-stack';
import { useState } from 'react';

import { SCREEN } from '@/lib/transitions';
import { corner34 } from '@/components/lesson34/corners';
import type { StepCtx } from '@/components/lesson34/finish';
import { StepPage } from '@/components/lesson34/pages';
import { TaskRunner } from '@/components/lesson34/runner';
import { Screen } from '@/components/screen';
import { PText } from '@/components/ui/text';
import { findStep34, findUnit34, unitName34 } from '@/data/lessons34';
import { useLearnPrefs } from '@/state/learn-prefs';
import { stepKey } from '@/state/progress';

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
