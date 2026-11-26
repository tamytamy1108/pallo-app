import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { userEvent, within } from 'storybook/test';

import { TaskRunner } from '@/components/lesson34/runner';
import type { Task34 } from '@/components/lesson34/types';
import { setNoListen, setNoSpeak } from '@/state/learn-prefs';
import { markDone, savePos, stepKey } from '@/state/progress';

import { freshDevice } from '../_support/fresh-device';
import { ctxOf, tasksOf } from './_runner';

/**
 * Lv.3 · 4 코너 진행기 — 위 줄(X · 진행 막대 · n/전체 · 소리) · 위 작은 안내 · 문제 하나 · 확인 창(그만하기 · 이어서 하기) · 축하 화면.
 * 문제마다의 모양은 Lesson34/<X>Block 스토리에서, 코너별 화면은 Pages/Lesson34/Step 에서 본다.
 */
const one: Task34[] = [{ type: 'explain', kick: '안내', k: 'HOW TO', title: '마지막 문제 — [완료하기]를 누르면 축하 화면', go: '완료하기' }];

const meta = {
  title: 'Lesson34/TaskRunner',
  component: TaskRunner,
  beforeEach: freshDevice(),
  args: { ctx: ctxOf(3, 'kwl'), kick: 'KEYWORDS 익히기', build: () => tasksOf(3, 'kwl') },
} satisfies Meta<typeof TaskRunner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 첫 문제 (1/12) */
export const Default: Story = {};
/** 소리 끄기 + 말하기가 어려워요 — 위 줄 스피커 꺼짐 · 문제도 대체 흐름 */
export const PrefsOn: Story = {
  args: { ctx: ctxOf(4, 'key'), kick: 'KEY EXPRESSIONS', build: () => tasksOf(4, 'key').slice(2) },
  beforeEach: () => {
    setNoListen(true);
    setNoSpeak(true);
  },
};
/** 멈춘 곳이 있음 — '이어서 할까요? 4/12까지 했어요' */
export const ResumeAsk: Story = { beforeEach: () => savePos(stepKey(3, 101, 'kwl'), 4) };
/** 앞 화면에서 이미 '이어서 하기'를 골랐으면 묻지 않고 그 번호부터 */
export const Resumed: Story = { args: { ctx: ctxOf(3, 'kwl', 101, 'resume') }, beforeEach: () => savePos(stepKey(3, 101, 'kwl'), 4) };
/** X → '정말 그만할까요? n문제만 더 하면 끝나요' */
export const QuitConfirm: Story = {
  play: async () => {
    await userEvent.click(await within(document.body).findByRole('button', { name: '그만하기' }));
  },
};
/** 마지막 문제만 남았을 때의 그만하기 문구 */
export const QuitConfirmLast: Story = {
  args: { build: () => one },
  play: async () => {
    await userEvent.click(await within(document.body).findByRole('button', { name: '그만하기' }));
  },
};
/** 다 풀면 축하 화면 (처음 끝냄 · 포인트 · 오늘 목표) */
export const Finished: Story = {
  args: { build: () => one },
  play: async () => {
    await userEvent.click(await within(document.body).findByRole('button', { name: '완료하기' }));
  },
};
/** 이미 끝낸 단계를 다시 끝냄 — 포인트 0 */
export const FinishedAgain: Story = {
  args: { build: () => one },
  beforeEach: () => void markDone(stepKey(3, 101, 'kwl')),
  play: async () => {
    await userEvent.click(await within(document.body).findByRole('button', { name: '완료하기' }));
  },
};
