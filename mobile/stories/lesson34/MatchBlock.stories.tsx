import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { userEvent, within } from 'storybook/test';

import { MatchBlock } from '@/components/lesson34/blocks/match';
import { setBest } from '@/components/lesson34/store';
import type { MatchTask } from '@/components/lesson34/types';

import { freshDevice } from '../_support/fresh-device';
import { taskOf, withRunner } from './_runner';

/**
 * 30초 짝 맞추기 (USEFUL EXPRESSIONS · KEY EXPRESSIONS) — 영어 칸을 고르고 뜻 칸을 눌러 짝을 지어요.
 * 다 맞히면(또는 시간이 끝나면) 결과: 캐릭터 무대 · 별 · 걸린 시간 · 최고 콤보 · 틀린 짝 · 지난 기록.
 */
const expr = taskOf(3, 'match', 0, 'match');
const key = taskOf(4, 'key', 0, 'match');
/** 3초짜리 — 시간이 끝난 결과를 빨리 보려고 */
const quick: MatchTask = { ...expr, time: 3 };

const pairUp = (pairs: [string, string][], wrongFirst = false) => async () => {
  const c = within(document.body);
  if (wrongFirst && pairs.length > 1) {
    await userEvent.click(await c.findByRole('button', { name: pairs[0][0] }));
    await userEvent.click(await c.findByRole('button', { name: pairs[1][1] }));
  }
  for (const [en, ko] of pairs) {
    await userEvent.click(await c.findByRole('button', { name: en }));
    await userEvent.click(await c.findByRole('button', { name: ko }));
  }
};

const meta = {
  title: 'Lesson34/MatchBlock',
  component: MatchBlock,
  decorators: [withRunner],
  beforeEach: freshDevice(),
  args: { task: expr },
  parameters: { runner: { soundOff: true } },
} satisfies Meta<typeof MatchBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 처음 — 30초 시계 · 섞인 칸 */
export const Default: Story = {};
/** KEY EXPRESSIONS 6짝 */
export const KeyExpressions: Story = { args: { task: key } };
/** 하나 고름 (영어 칸 선택) */
export const Selected: Story = { play: async () => void (await userEvent.click(await within(document.body).findByRole('button', { name: expr.pairs[0][0] }))) };
/** 두 짝 맞힘 · 진행 중 */
export const Partial: Story = { play: pairUp(expr.pairs.slice(0, 2)) };
/** 다 맞힘 — 노랑 무대 · 별 3개 (처음 기록) */
export const AllDone: Story = { play: pairUp(expr.pairs) };
/** 한 번 틀리고 다 맞힘 · 지난 최고 기록이 있을 때 */
export const AllDoneWithMiss: Story = {
  parameters: { runner: { soundOff: true, bestKey: 'story:match' } },
  beforeEach: () => setBest('story:match', 9),
  play: pairUp(expr.pairs, true),
};
/** 시간 끝 — 기운 캐릭터 · 별 적게 (3초 문제) */
export const TimeUp: Story = { args: { task: quick } };
/** 마지막 문제 — 결과 버튼 [완료하기] */
export const AllDoneLast: Story = { parameters: { runner: { soundOff: true, goLabel: '완료하기' } }, play: pairUp(expr.pairs) };
