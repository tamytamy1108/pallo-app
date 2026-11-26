import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn, userEvent, within } from 'storybook/test';

import { LevelPick } from '@/components/scene/level-pick';

/**
 * '내 레벨을 골라요' (장면에 처음 들어올 때 · 레벨 바꾸기) / '어떤 난이도로 할까요?' (상황 퀴즈).
 * 내 레벨 표시 · 레벨마다 최고 기록(n/15) · 고른 레벨의 설명 · 예시 · [Lv.n 이름으로 시작하기].
 */
const meta = {
  title: 'Scene/LevelPick',
  component: LevelPick,
  args: { title: '공항 체크인', mode: 'scene', initial: 1, best: {}, onGo: fn() },
} satisfies Meta<typeof LevelPick>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 장면 처음 — 내 레벨 중 낮은 것(Lv.1)이 골라져 있어요 */
export const Scene: Story = {};
/** 상황 퀴즈 — 두 레벨 병행 안내 */
export const Quiz: Story = { args: { mode: 'quiz' } };
/** 최고 기록이 있는 레벨 */
export const WithBest: Story = { args: { mode: 'quiz', initial: 2, best: { 1: 15, 2: 9, 4: 3 } } };
/** 왕기초(Lv.0) 골라져 있음 */
export const Level0: Story = { args: { initial: 0 } };
/** 고급(Lv.4) 골라져 있음 */
export const Level4: Story = { args: { initial: 4 } };
/** 다른 레벨을 눌러 바꿈 (Lv.3) */
export const Changed: Story = {
  play: async () => {
    await userEvent.click(await within(document.body).findByRole('radio', { name: /^Lv\.3/ }));
  },
};
