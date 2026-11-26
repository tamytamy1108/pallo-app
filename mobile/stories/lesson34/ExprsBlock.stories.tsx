import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { userEvent, within } from 'storybook/test';

import { ExprsBlock } from '@/components/lesson34/blocks/exprs';

import { freshDevice } from '../_support/fresh-device';
import { taskOf, withRunner } from './_runner';

/** 표현마다 칸 하나 · 내 예문 쓰기 (TOPIC 이야기하기 마지막) — 표현이 들어간 4단어 이상이면 칸이 켜져요. 3개 넘으면 [예문 n개 완성] → AI 검수 */
const task = taskOf(3, 'ttalk', 3, 'exprs');

/** 칸마다 쓸 예문 — 맞춤법이 틀린 문장(교정) · 쉬운 말(업그레이드) 하나씩 섞음 */
const MINE = ['The word was on the tip of my tongue all day.', 'i play it cool when i am nervous', 'I think I sneak a peek at my phone too much.', 'I always dodge hard questions at work.'];

const fill = (n: number, review = false) => async () => {
  const c = within(document.body);
  for (let i = 0; i < n; i++) await userEvent.type(await c.findByLabelText(`${task.items[i][0]} 예문`), MINE[i]);
  if (review) await userEvent.click(c.getByRole('button', { name: /완성/ }));
};

const meta = {
  title: 'Lesson34/ExprsBlock',
  component: ExprsBlock,
  decorators: [withRunner],
  beforeEach: freshDevice(),
  args: { task },
  parameters: { runner: { soundOff: true } },
} satisfies Meta<typeof ExprsBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 빈 칸 6개 · 버튼 꺼짐 '예문 0/3' */
export const Default: Story = {};
/** 지문 예문 펼침 */
export const ExampleOpen: Story = { play: async () => void (await userEvent.click((await within(document.body).findAllByRole('button', { name: '지문 예문' }))[0])) };
/** 두 칸 켜짐 · 아직 모자라요 */
export const Partial: Story = { play: fill(2) };
/** 세 칸 이상 — [예문 4개 완성] */
export const Ready: Story = { play: fill(4) };
/** AI 검수 화면 — 칸마다 교정 · 더 자연스럽게 · 지문에서는 */
export const Review: Story = { play: fill(4, true) };
/** 고칠 곳 없는 검수 — '완벽해요!' */
export const ReviewPerfect: Story = {
  play: async () => {
    const c = within(document.body);
    const good = ['The word was on the tip of my tongue all day.', 'She tried to play it cool at the party.', 'He tried to sneak a peek at the answers.'];
    for (let i = 0; i < 3; i++) await userEvent.type(await c.findByLabelText(`${task.items[i][0]} 예문`), good[i]);
    await userEvent.click(c.getByRole('button', { name: /완성/ }));
  },
};
