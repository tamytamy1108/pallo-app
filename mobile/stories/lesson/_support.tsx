import type { Decorator } from '@storybook/react-native-web-vite';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { fn, userEvent, within } from 'storybook/test';

import { TaskCtx, type TaskApi } from '@/components/lesson/task-layout';
import { LV1_01 } from '@/data/lesson-lv1';
import { dialogueTasks, lessonPool, type BuildTask, type OrderTask, type RoleTask, type Task } from '@/data/lessons';
import { clearSavedData } from '@/lib/store';
import { setNoListen, setNoSpeak } from '@/state/learn-prefs';
import { updateMe } from '@/state/me';

import { personaOf, USER_KIND_PATCH } from '../../.storybook/user-kinds';

/**
 * 레슨 스토리 공용 — 기기에 남는 가게(진도 · 멈춘 곳 · 학습 설정 · 표현함)를 스토리마다 처음 상태로 돌린다.
 * clearSavedData 는 나(state/me)까지 지우니, 툴바 회원 유형을 다시 넣는다.
 * opts: 말하기가 어려워요(noSpeak) · 소리 끄기(noListen) 를 켠 채로 시작.
 */
export function freshLesson(opts: { noSpeak?: boolean; noListen?: boolean; seed?: () => void } = {}) {
  return ({ globals }: { globals: Record<string, unknown> }) => {
    clearSavedData();
    updateMe(USER_KIND_PATCH[personaOf(globals)]);
    setNoSpeak(!!opts.noSpeak);
    setNoListen(!!opts.noListen);
    opts.seed?.();
  };
}

/** 문제 화면이 받는 진행기 값 (task-layout TaskCtx). 스토리 parameters.task 로 조금씩 바꾼다. */
export type TaskStageOpts = Partial<Pick<TaskApi, 'soundOff' | 'noSpeak' | 'isLast' | 'index' | 'total'>>;

const api = {
  mark: fn().mockName('mark'),
  next: fn().mockName('next'),
  again: fn().mockName('again'),
  insertAfter: fn().mockName('insertAfter'),
  peek: fn().mockName('peek'),
};

function TaskStage({ task, opts, children }: { task: Task; opts: TaskStageOpts; children: ReactNode }) {
  const value: TaskApi = {
    task,
    index: opts.index ?? 0,
    total: opts.total ?? 5,
    isLast: opts.isLast ?? false,
    soundOff: opts.soundOff ?? false,
    noSpeak: opts.noSpeak ?? false,
    source: 'Lv.1 1과 · 스토리북',
    ...api,
    setFootH: () => {},
  };
  return (
    <View style={{ flex: 1, paddingTop: 16 }}>
      <TaskCtx.Provider value={value}>{children}</TaskCtx.Provider>
    </View>
  );
}

/**
 * 문제 부품(PickTask · BuildTask …)은 레슨 진행기(TaskCtx) 안에서만 그려진다 — 가짜 진행기로 감싼다.
 * 결과 기록 · 다음 · 다시 는 Actions 패널에 남는다. 소리 끄기 · 말하기가 어려워요 · 마지막 문제는 parameters.task.
 */
export const withTask: Decorator = (Story, ctx) => (
  <TaskStage task={(ctx.args as { task: Task }).task} opts={(ctx.parameters.task as TaskStageOpts | undefined) ?? {}}>
    <Story />
  </TaskStage>
);

/* ───────────── 샘플 데이터 (data/lesson-lv1 의 진짜 값) ───────────── */

export const D1 = LV1_01;
export const POOL = lessonPool(LV1_01);
const [orderTask, roleTask, buildTask] = dialogueTasks(LV1_01);
/** 대화문 세 문제 (순서 맞추기 · 역할 고르기 · 마지막 대사 만들기) */
export const DLG = { order: orderTask as OrderTask, role: roleTask as RoleTask, build: buildTask as BuildTask };

/* ───────────── play 도우미 ───────────── */

/** 화면에서 이 이름(접근성 이름)의 버튼을 눌러요 — 모달처럼 canvas 밖에 그려지는 것도 찾게 body 에서 */
export async function tap(name: string | RegExp, root: HTMLElement = document.body) {
  await userEvent.click(await within(root).findByRole('button', { name }));
}

/** 글자로 찾아 눌러요 (StudyButton 처럼 이름 대신 글자만 있는 것) */
export async function tapText(text: string | RegExp, root: HTMLElement = document.body) {
  await userEvent.click(await within(root).findByText(text));
}

export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
