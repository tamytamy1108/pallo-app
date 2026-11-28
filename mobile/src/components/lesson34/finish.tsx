import { router } from 'expo-router';
import { useState } from 'react';

import { buildWhere, Celebrate, type CelebrateResult } from '@/components/lesson/celebrate';
import { STAGE_KO } from '@/data/lessons';
import { showToast } from '@/components/ui/toast';
import { findStep34, type Stage, type Step34 } from '@/data/lessons34';
import { sfx } from '@/lib/feedback';
import { awardPoints } from '@/state/ledger';
import { clearPos, DAILY_GOAL, getTodayDone, isDone, markDone, stepKey } from '@/state/progress';
import { setNoListen, useLearnPrefs } from '@/state/learn-prefs';

import { dropRun } from './store';
import { lessonQuestTitle, shareQuest } from '@/state/quest-share';
import { stopSpeaking } from '@/lib/tts';

/** resume: 앞 화면 팝업에서 이미 '이어서 하기'를 골랐으면 'resume' (다시 묻지 않아요) */
export type StepCtx = { lv: 3 | 4; unit: number; step: Step34 & { stage: Stage }; source: string; resume?: 'resume' | 'restart' };

export const lesson34Href = (lv: number, unit: number, id: string) => `/lesson34/${id}?lv=${lv}&unit=${unit}` as const;

/** 레슨 닫기: 앞 화면이 있으면 그리로, 주소로 바로 들어왔으면 라이브러리로 */
export const leave34 = () => (router.canGoBack() ? router.back() : router.replace('/library'));

/** 소리 끄기 (위 줄 스피커 하나 · 15분) */
export function useSoundToggle() {
  const { noListen } = useLearnPrefs();
  const toggle = () => {
    stopSpeaking();
    setNoListen(!noListen);
    sfx('toggle');
    showToast(!noListen ? '15분 동안 소리를 꺼요' : '소리를 다시 켰어요');
  };
  return { soundOff: noListen, toggleSound: toggle };
}

/**
 * 단계 끝내기 (프로토타입 finishStep): 처음 끝낼 때만 포인트 · 오늘 목표 → 완료(축하) 화면.
 * [이어서 하기]는 같은 회차의 다음 안 한 단계, 집 아이콘은 라이브러리로.
 */
export function useStepFinish(ctx: StepCtx) {
  const [res, setRes] = useState<CelebrateResult | null>(null);
  const [next, setNext] = useState<string | null>(null);
  const finish = (score?: { right: number; total: number } | null) => {
    const key = stepKey(ctx.lv, ctx.unit, ctx.step.id);
    const first = markDone(key);
    clearPos(key);
    dropRun(key);
    if (first) awardPoints(`step:${key}`, 'step', ctx.step.xp);
    // 처음 끝낸 단계면 팔로워에게 '퀘스트 성공' (state/quest-share)
    if (first) shareQuest({ key, title: lessonQuestTitle(ctx.lv, ctx.unit, ctx.step.stage), href: lesson34Href(ctx.lv, ctx.unit, ctx.step.id) });
    const found = findStep34(ctx.lv, ctx.step.id);
    const all = found?.all ?? [];
    const left = all.filter((s) => !isDone(stepKey(ctx.lv, ctx.unit, s.id)));
    // 같은 단계(예습 · 본학습 · 복습)에서 먼저, 없으면 다음 단계에서
    const nx = left.find((s) => s.stage === ctx.step.stage) ?? left[0];
    setNext(nx ? nx.id : null);
    // 완료 등급: 회차를 다 끝냈으면 회차 완료, 이 구역(예습 · 본학습 · 복습)을 다 끝냈으면 구역 완료 (처음 끝낼 때만)
    const unitDone = first && left.length === 0;
    const stageDone = first && all.filter((s) => s.stage === ctx.step.stage).every((s) => isDone(stepKey(ctx.lv, ctx.unit, s.id)));
    setRes({
      correct: score?.right ?? 0,
      total: score?.total ?? 0,
      points: first ? ctx.step.xp : 0,
      goalDone: Math.min(getTodayDone(), DAILY_GOAL),
      goalTotal: DAILY_GOAL,
      unitComplete: unitDone,
      tier: unitDone ? 'session' : stageDone ? 'zone' : 'step',
      zone: ctx.step.stage,
      title: unitDone ? `${ctx.unit}회 완료!` : stageDone ? `${STAGE_KO[ctx.step.stage]} 완료!` : undefined,
      sub: unitDone ? `${all.length}단계를 다 했어요` : stageDone && nx ? `다음은 ${STAGE_KO[nx.stage]} · ${nx.t}` : undefined,
      nextPoints: nx?.xp,
      where: buildWhere(all, (id) => isDone(stepKey(ctx.lv, ctx.unit, id)), ctx.step.id, ctx.step.t),
    });
  };
  const celebrate = res ? (
    <Celebrate
      visible
      result={res}
      onHome={() => router.replace('/library')}
      onNext={next ? () => router.replace(lesson34Href(ctx.lv, ctx.unit, next)) : undefined}
    />
  ) : null;
  return { finish, celebrate, finished: res != null };
}
