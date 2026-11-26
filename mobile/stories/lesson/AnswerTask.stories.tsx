import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { userEvent, within } from 'storybook/test';

import { AnswerTask } from '@/components/lesson/answer-task';
import type { AnswerTask as AnswerTaskData } from '@/data/lessons';

import { D1, freshLesson, POOL, tap, withTask } from './_support';

const TASK: AnswerTaskData = { type: 'answer', q: D1.ice[0], qi: 0, key: 'story:answer', pool: POOL };
const LONG: AnswerTaskData = { ...TASK, qi: 1, q: D1.ice[1] };

/**
 * 질문에 답하기 — 질문 말풍선 + 예시 답 → 단어 카드 · 말하기(기본) · 쓰기. 답하면 '처음 답변'으로 저장.
 * 말하기 칸은 마이크(브라우저 음성 인식)가 있어야 해서, 말한 결과 상태는 쓰기 · 단어 카드로 봐요.
 */
const meta = {
  title: 'Lesson/AnswerTask',
  component: AnswerTask,
  args: { task: TASK },
  decorators: [withTask],
  beforeEach: freshLesson(),
} satisfies Meta<typeof AnswerTask>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 말하기 탭 (기본) */
export const Voice: Story = {};
/** 말하기가 어려워요 — 단어 카드 탭으로 시작 */
export const Cards: Story = { parameters: { task: { noSpeak: true } } };
/** 쓰기 탭 */
export const Write: Story = { play: async ({ canvasElement }) => userEvent.click(await within(canvasElement).findByRole('tab', { name: '쓰기' })) };
/** 쓰기 — 적는 중 ([확인] 열림) */
export const Writing: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(await c.findByRole('tab', { name: '쓰기' }));
    await userEvent.type(await c.findByLabelText('내 답'), 'I had an iced americano at work.');
  },
};
/** 저장됨 — 정답 띠 '처음 답변으로 저장했어요' */
export const Saved: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(await c.findByRole('tab', { name: '쓰기' }));
    await userEvent.type(await c.findByLabelText('내 답'), 'I had an iced americano at work.');
    await tap('확인', canvasElement);
  },
};
/** 소리 끄기 — 질문 듣기 · 결과 듣기 없음 */
export const SoundOff: Story = { parameters: { task: { soundOff: true, noSpeak: true } } };
/** 긴 예시 답 */
export const LongHint: Story = { args: { task: LONG } };
