import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { OrderTask } from '@/components/lesson/order-task';
import { storyTasks, type OrderTask as OrderTaskData } from '@/data/lessons';

import { DLG, freshLesson, tap, withTask } from './_support';

/** 대화문 앞 4줄만 — play 로 순서를 눌러 보기 쉽게 */
const SHORT: OrderTaskData = { ...DLG.order, lines: DLG.order.lines.slice(0, 4) };
const label = (l: { who: string; en: string }) => `${l.who ? `${l.who} ` : ''}${l.en}`;
const RIGHT = SHORT.lines.map(label);
const WRONG = [RIGHT[1], RIGHT[0], RIGHT[3], RIGHT[2]];
/** 맨 앞줄은 맞고 뒤가 바뀜 */
const HALF = [RIGHT[0], RIGHT[1], RIGHT[3], RIGHT[2]];

const STORY = storyTasks('I was at a cafe. I said, "I’d like to order a latte." It wasn’t hot. In the end, they made a new one.')[0] as OrderTaskData;

const put = async (root: HTMLElement, names: string[]) => {
  for (const n of names) await tap(n, root);
};
const check = async (root: HTMLElement, names: string[]) => {
  await put(root, names);
  await tap('확인', root);
};

/**
 * 줄 순서 맞추기 — 섞인 대사를 눌러 위에 쌓고 [확인]. 틀리면 빨간 줄 → [정답 확인하기] / [다시 도전하기].
 */
const meta = {
  title: 'Lesson/OrderTask',
  component: OrderTask,
  args: { task: SHORT },
  decorators: [withTask],
  beforeEach: freshLesson(),
} satisfies Meta<typeof OrderTask>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 아직 안 놓음 — [다 놓으면 확인] 막힘 */
export const Unanswered: Story = {};
/** 대화문 전체 8줄 */
export const FullDialogue: Story = { args: { task: DLG.order } };
/** My Story 문장 순서 (인물 없이 '문장') */
export const MyStorySentences: Story = { args: { task: STORY } };
/** 두 줄 놓음 */
export const Selected: Story = { play: async ({ canvasElement }) => put(canvasElement, RIGHT.slice(0, 2)) };
/** 다 놓음 — [확인] 열림 */
export const Full: Story = { play: async ({ canvasElement }) => put(canvasElement, WRONG) };
/** 맞힘 — 'Perfect order!' */
export const Correct: Story = { play: async ({ canvasElement }) => check(canvasElement, RIGHT) };
/** 틀림 — 빨간 줄 + [정답 확인하기] [다시 도전하기] */
export const Wrong: Story = { play: async ({ canvasElement }) => check(canvasElement, WRONG) };
/** 틀림 · 맞은 앞줄은 남겨 둔다는 안내 */
export const WrongKeepFront: Story = { play: async ({ canvasElement }) => check(canvasElement, HALF) };
/** 정답 보기 — 'Here's the order' */
export const Revealed: Story = {
  play: async ({ canvasElement }) => {
    await check(canvasElement, WRONG);
    await tap('정답 확인하기', canvasElement);
  },
};
/** 다시 도전하기 — 맞은 앞줄만 남고 나머지는 아래로 */
export const Retrying: Story = {
  play: async ({ canvasElement }) => {
    await check(canvasElement, HALF);
    await tap('다시 도전하기', canvasElement);
  },
};
