import { router } from 'expo-router';
import { useState } from 'react';

import { buildWhere, type CelebrateResult } from '@/components/lesson/celebrate';
import { stopSay } from '@/components/lesson/voice';
import { lessonBase } from '@/components/library/open-step';
import { nextStepAfter, STAGE_KO, type AnyStepDef } from '@/data/lessons';
import { awardPoints } from '@/state/ledger';
import { DAILY_GOAL, getBest, getTodayDone, isDone, markDone, setBest, stepKey } from '@/state/progress';
import { lessonQuestTitle, shareQuest } from '@/state/quest-share';

export type StepScore = { right: number; total: number; timed?: number; fast?: number };

/**
 * 단계를 끝냈을 때 (프로토타입 finishStep): 완료 기록 → 포인트(처음 끝낼 때만 +5 / +10 / +15, 더 빨리 풀면 그 차이만큼 보너스)
 * → 이번 주 포인트 · 오늘 목표 → 축하 화면. defs = 그 레벨의 단계 목록 (Lv.1 · 2 STEP_DEFS · Lv.0 STEP0_DEFS).
 * [이어서 하기]는 다음 단계, 집 아이콘은 라이브러리로.
 */
export function useStepFinish<S extends AnyStepDef>(lv: number, unit: number, step: S, defs: readonly S[]) {
  const [cel, setCel] = useState<null | { result: CelebrateResult; next: S | null }>(null);
  const base = lessonBase(lv);

  const finish = (score: StepScore | null) => {
    stopSay();
    const key = stepKey(lv, unit, step.id);
    const first = markDone(key);
    // 시간 안에 맞힌 비율만큼 보너스 · 지난번보다 빨리 풀면 그 차이만큼 더
    const speed = score?.timed ? Math.round(step.xp * 0.5 * ((score.fast ?? 0) / score.timed)) : 0;
    const bestK = `${key}:best`;
    const gain = Math.max(0, speed - (getBest(bestK) ?? 0));
    if (gain) setBest(bestK, speed);
    if (first) awardPoints(`step:${key}`, 'step', step.xp);
    // 처음 끝낸 단계면 팔로워에게 '퀘스트 성공' (회원 · 설정 켜짐 · 한 번만 — state/quest-share)
    if (first) shareQuest({ key, title: lessonQuestTitle(lv, unit, step.stage), href: `${base}/${step.id}?lv=${lv}&unit=${unit}` });
    if (gain) awardPoints(`speed:${key}:${speed}`, 'speed', gain);
    const points = (first ? step.xp : 0) + gain;

    const done = (id: string) => isDone(stepKey(lv, unit, id));
    const next = nextStepAfter(step, done, defs);
    const stage = defs.filter((s) => s.stage === step.stage);
    const stageDone = first && stage.every((s) => done(s.id));
    const unitDone = first && defs.every((s) => done(s.id));
    setCel({
      next,
      result: {
        correct: score?.right ?? 0,
        total: score?.total ?? 0,
        points,
        goalDone: Math.min(getTodayDone(), DAILY_GOAL),
        goalTotal: DAILY_GOAL,
        timed: score?.timed,
        fast: score?.fast,
        title: unitDone ? `${unit}과 완료!` : stageDone ? `${STAGE_KO[step.stage]} 완료!` : undefined,
        sub: unitDone ? `${defs.length}단계를 다 했어요` : stageDone && next ? `다음은 ${STAGE_KO[next.stage]} · ${next.t}` : undefined,
        big: stageDone,
        unitComplete: unitDone,
        tier: unitDone ? 'session' : stageDone ? 'zone' : 'step',
        zone: step.stage,
        nextPoints: next?.xp,
        where: buildWhere(defs, done, step.id, step.t),
      },
    });
  };

  const goHome = () => {
    setCel(null);
    if (router.canDismiss()) router.dismissAll();
    router.navigate('/library');
  };
  const goNext = cel?.next
    ? () => {
        const id = cel.next?.id;
        setCel(null);
        if (id) router.replace({ pathname: `${base}/[step]` as '/lesson/[step]', params: { step: id, lv: String(lv), unit: String(unit) } });
      }
    : undefined;

  return { finish, cel, goHome, goNext };
}

/** 학습 화면 닫기: 앞 화면이 있으면 그리로, 주소로 바로 들어왔으면 홈으로 */
export const leaveLesson = () => {
  stopSay();
  if (router.canGoBack()) router.back();
  else router.replace('/home');
};
