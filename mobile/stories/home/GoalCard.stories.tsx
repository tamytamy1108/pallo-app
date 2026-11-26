import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { GoalCard } from '@/components/home/goal-card';
import { DAILY_GOAL, recordToday, resetTodayGoal } from '@/state/today-goal';

import { padded } from '../_support/padded';

/** 오늘 끝낸 단계 수를 n 개로 맞춘다 (오늘 목표 스토어 — 기기에 남는 값이라 스토리마다 새로 채운다). */
const doneToday = (n: number) => () => {
  resetTodayGoal();
  for (let i = 0; i < n; i++) recordToday(`story:${i}`);
};

/** 앱 구독자 홈 맨 위 '오늘의 목표' 카드 — 오늘 몇 단계를 끝냈는지에 따라 n/목표 · 연속 학습이 바뀐다. */
const meta = {
  title: 'Home/GoalCard',
  component: GoalCard,
  args: { onContinue: fn() },
  decorators: [padded],
} satisfies Meta<typeof GoalCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NotStarted: Story = { beforeEach: doneToday(0) };
export const InProgress: Story = { beforeEach: doneToday(1) };
export const Completed: Story = { beforeEach: doneToday(DAILY_GOAL) };
/** 목표보다 더 했을 때 — 화면엔 목표 수까지만 */
export const OverGoal: Story = { beforeEach: doneToday(DAILY_GOAL + 2) };
