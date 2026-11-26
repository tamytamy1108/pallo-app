import type { Decorator } from '@storybook/react-native-web-vite';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { corner34, type CornerEnv } from '@/components/lesson34/corners';
import type { StepCtx } from '@/components/lesson34/finish';
import { RunnerCtx, type Runner } from '@/components/lesson34/frame';
import type { LogItem, Task34 } from '@/components/lesson34/types';
import { findStep34, findUnit34, unitName34, type Unit34 } from '@/data/lessons34';

/**
 * Lv.3 · 4 문제 블록(blocks/*)을 진행기(TaskRunner) 없이 하나만 그려 보는 도구.
 * 블록은 useRunner() 로 진행기를 찾으므로, 가짜 진행기를 넣어 준다 — 다음 · 결과 기록 · 끼워 넣기는 Actions 패널에만 남는다.
 * 스토리에서 `parameters.runner: { soundOff: true, noSpeak: true, goLabel: '완료하기', combo: 3, logs: [...] }` 로 바꾼다.
 */
export type RunnerParams = Partial<Pick<Runner, 'soundOff' | 'noSpeak' | 'goLabel' | 'combo' | 'source' | 'bestKey'>> & { logs?: LogItem[] };

export const STORY_SOURCE = 'Lv.3 #101 The Present · 스토리';

function makeRunner(p: RunnerParams, again: () => void): Runner {
  const logs: LogItem[] = [...(p.logs ?? [])];
  return {
    soundOff: false,
    noSpeak: false,
    goLabel: '다음',
    combo: 0,
    source: STORY_SOURCE,
    bestKey: 'story:match',
    ...p,
    toggleNoSpeak: fn().mockName('runner.toggleNoSpeak'),
    next: fn().mockName('runner.next'),
    mark: fn().mockName('runner.mark'),
    setCombo: fn().mockName('runner.setCombo'),
    log: (x) => logs.push(x),
    logs: () => logs,
    insert: fn().mockName('runner.insert'),
    replaceRest: fn().mockName('runner.replaceRest'),
    setScore: fn().mockName('runner.setScore'),
    setKick: fn().mockName('runner.setKick'),
    peek: fn().mockName('runner.peek'),
    // '다시 하기'는 블록을 처음 상태로 다시 그린다 (진짜 진행기의 nonce 와 같게)
    again,
  };
}

function RunnerHost({ p, children }: { p: RunnerParams; children: (nonce: number) => ReactNode }) {
  const [nonce, setNonce] = useState(0);
  const [rt] = useState(() => makeRunner(p, () => setNonce((n) => n + 1)));
  return (
    <RunnerCtx.Provider value={rt}>
      <View style={{ flex: 1 }}>{children(nonce)}</View>
    </RunnerCtx.Provider>
  );
}

/** 블록 스토리 데코레이터 — 가짜 진행기 + 화면 높이를 채우는 칸 (본문은 스크롤, 아래 칸은 바닥에) */
export const withRunner: Decorator = (Story, context) => (
  <RunnerHost p={(context.parameters.runner as RunnerParams | undefined) ?? {}}>{(nonce) => <Story key={nonce} />}</RunnerHost>
);

/* ───────── 진짜 코너(corners.ts)에서 문제 꺼내기 ───────── */

export const unitOf = (lv: 3 | 4, no = 101): Unit34 => {
  const u = findUnit34(lv, no);
  if (!u) throw new Error(`스토리: Lv.${lv} ${no} 회차 데이터가 없어요`);
  return u;
};

export const envOf = (lv: 3 | 4, unit: number, id: string, noSpeak = false): CornerEnv => ({
  uk: `${lv}:${unit}`,
  key: `${lv}:${unit}:${id}`,
  source: `Lv.${lv} ${unitName34(unitOf(lv, unit))} · ${findStep34(lv, id)?.step.t ?? id}`,
  noSpeak,
});

/** 코너 하나의 문제 목록 (lv · 회차 · 코너 id) — 화면이 만드는 것과 같아요 */
export function tasksOf(lv: 3 | 4, id: string, unit = 101): Task34[] {
  const c = corner34(unitOf(lv, unit), id, envOf(lv, unit, id));
  if (!c) throw new Error(`스토리: ${id} 는 진행기 코너가 아니에요`);
  return c.build();
}

/** 코너 문제 목록에서 n 번째 (모양을 좁혀서) */
export function taskOf<K extends Task34['type']>(lv: 3 | 4, id: string, index: number, type: K, unit = 101): Extract<Task34, { type: K }> {
  const t = tasksOf(lv, id, unit)[index];
  if (!t || t.type !== type) throw new Error(`스토리: ${id}[${index}] 는 ${type} 가 아니에요 (${t?.type})`);
  return t as Extract<Task34, { type: K }>;
}

/** 진행기 · 단계 화면이 받는 ctx */
export function ctxOf(lv: 3 | 4, id: string, unit = 101, resume?: StepCtx['resume']): StepCtx {
  const found = findStep34(lv, id);
  if (!found) throw new Error(`스토리: ${id} 단계가 없어요`);
  return { lv, unit, step: found.step, source: envOf(lv, unit, id).source, resume };
}
