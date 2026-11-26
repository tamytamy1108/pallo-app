import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn, userEvent, within } from 'storybook/test';

import { FillBlock } from '@/components/lesson34/blocks/fill';

import { freshDevice } from '../_support/fresh-device';
import { taskOf, withRunner } from './_runner';

/**
 * 일기 빈칸 채우기 (JOURNAL) — 단어 칩을 누르면 다음 빈칸에 들어가요 · [확인].
 * 처음 틀린 칸은 분홍으로 흔들리고 칩이 돌아가요(한 번 더). 두 번째도 틀리면 정답으로 채워 보여 줘요.
 */
const task = { ...taskOf(3, 'journal', 0, 'fill'), date: '2026. 11. 25.', done: fn().mockName('fill.done') };
const answers = task.lines.map((l) => l[1]);
/** 한 칸씩 밀린 순서 (모두 틀려요) */
const shifted = [...answers.slice(1), answers[0]];

const chips = (list: string[]) => async (c: ReturnType<typeof within>) => {
  for (const w of list) await userEvent.click(await c.findByRole('button', { name: `${w} 넣기` }));
};
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const meta = {
  title: 'Lesson34/FillBlock',
  component: FillBlock,
  decorators: [withRunner],
  beforeEach: freshDevice(),
  args: { task },
  parameters: { runner: { soundOff: true } },
} satisfies Meta<typeof FillBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 빈칸 6개 · 단어 칩 · [확인] 꺼짐 */
export const Default: Story = {};
/** 두 칸 채움 */
export const Partial: Story = { play: async () => chips(answers.slice(0, 2))(within(document.body)) };
/** 다 채움 — [확인] 켜짐 */
export const Full: Story = { play: async () => chips(answers)(within(document.body)) };
/** 처음에 다 맞힘 — 별 3개 · 완성된 일기 · [다음] */
export const AllFirstTry: Story = {
  play: async () => {
    const c = within(document.body);
    await chips(answers)(c);
    await userEvent.click(c.getByRole('button', { name: '확인' }));
  },
};
/** 처음 틀림 — 틀린 칸이 비고 다시 채우기 */
export const Retry: Story = {
  play: async () => {
    const c = within(document.body);
    await chips(shifted)(c);
    await userEvent.click(c.getByRole('button', { name: '확인' }));
    await wait(900);
  },
};
/** 다시 해서 다 맞힘 — 별 2개 */
export const FixedOnRetry: Story = {
  play: async () => {
    const c = within(document.body);
    await chips(shifted)(c);
    await userEvent.click(c.getByRole('button', { name: '확인' }));
    await wait(900);
    await chips(answers)(c);
    await userEvent.click(c.getByRole('button', { name: '확인' }));
  },
};
/** 두 번 다 틀림 — 정답으로 채워 보여 줘요 · 별 1개 */
export const ShownAnswers: Story = {
  play: async () => {
    const c = within(document.body);
    await chips(shifted)(c);
    await userEvent.click(c.getByRole('button', { name: '확인' }));
    await wait(900);
    await chips(shifted)(c);
    await userEvent.click(c.getByRole('button', { name: '확인' }));
  },
};
