import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { userEvent, within } from 'storybook/test';

import { ChooseBlock } from '@/components/lesson34/blocks/misc';

import { freshDevice } from '../_support/fresh-device';
import { taskOf, withRunner } from './_runner';

/** 질문 N개 중 몇 개 고르기 (FREE TALK 준비: 5개 중 2개) — 다 고르면 [이 2개로 시작] */
const free = taskOf(4, 'free', 0, 'choose');

const tap = (n: number) => async () => {
  const c = within(document.body);
  for (const q of free.items.slice(0, n)) await userEvent.click(await c.findByRole('checkbox', { name: q.en }));
};

const meta = {
  title: 'Lesson34/ChooseBlock',
  component: ChooseBlock,
  decorators: [withRunner],
  beforeEach: freshDevice(),
  args: { task: free },
} satisfies Meta<typeof ChooseBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 아무것도 안 고름 — 버튼 꺼짐 '2개를 골라요' */
export const Default: Story = {};
/** 하나 고름 · 1/2 */
export const OnePicked: Story = { play: tap(1) };
/** 다 고름 — [이 2개로 시작] 켜짐 */
export const Full: Story = { play: tap(2) };
