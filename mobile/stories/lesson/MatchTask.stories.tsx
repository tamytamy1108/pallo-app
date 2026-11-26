import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { MatchTask } from '@/components/lesson/match-task';
import { bankTasks, type MatchTask as MatchTaskData } from '@/data/lessons';
import { setBest } from '@/state/progress';

import { D1, freshLesson, tap, wait, withTask } from './_support';

const BANK = bankTasks(D1)[0] as MatchTaskData;
/** 3짝만 — play 로 다 맞히기 쉽게 */
const SMALL: MatchTaskData = { ...BANK, id: 'story-small', pairs: BANK.pairs.slice(0, 3), time: 30 };
const KEY = 'story:match';

const matchAll = async (root: HTMLElement) => {
  for (const [en, ko] of SMALL.pairs) {
    await tap(en, root);
    await tap(ko, root);
  }
  await wait(900);
};

/**
 * 짝 맞추기 타임어택 — 왼쪽 영어 → 오른쪽 뜻. 연속으로 맞히면 콤보. 다 맞히거나 시간이 끝나면 결과(별 · 걸린 시간 · 최고 콤보 · 틀린 짝).
 */
const meta = {
  title: 'Lesson/MatchTask',
  component: MatchTask,
  args: { task: SMALL, recordKey: KEY },
  decorators: [withTask],
  beforeEach: freshLesson(),
} satisfies Meta<typeof MatchTask>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Word Bank 10짝 30초 */
export const Bank: Story = { args: { task: BANK } };
/** 3짝 — 시작 */
export const Unanswered: Story = {};
/** 왼쪽 하나 고름 */
export const Selected: Story = { play: async ({ canvasElement }) => tap(SMALL.pairs[0][0], canvasElement) };
/** 한 짝 맞힘 · 콤보 x1 */
export const OneMatched: Story = {
  play: async ({ canvasElement }) => {
    await tap(SMALL.pairs[0][0], canvasElement);
    await tap(SMALL.pairs[0][1], canvasElement);
  },
};
/** 틀린 짝 — 둘 다 빨갛게 */
export const WrongPair: Story = {
  play: async ({ canvasElement }) => {
    await tap(SMALL.pairs[0][0], canvasElement);
    await tap(SMALL.pairs[1][1], canvasElement);
  },
};
/** 다 맞힘 — 첫 기록 */
export const DoneFirstRecord: Story = { play: async ({ canvasElement }) => matchAll(canvasElement) };
/** 다 맞힘 · 마지막 문제 — [완료하기] */
export const DoneLast: Story = { parameters: { task: { isLast: true } }, play: async ({ canvasElement }) => matchAll(canvasElement) };
/** 다 맞힘 — 지난 기록(99초)을 깸 */
export const DoneNewBest: Story = {
  beforeEach: freshLesson({ seed: () => setBest(`${KEY}:${SMALL.id}`, 99) }),
  play: async ({ canvasElement }) => matchAll(canvasElement),
};
/** 시간 끝 (제한 2초) — 보라 팔로 · '시간 끝' */
export const TimeUp: Story = { args: { task: { ...SMALL, time: 2 } }, play: async () => wait(2600) };
