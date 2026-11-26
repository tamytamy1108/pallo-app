import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn, userEvent, within } from 'storybook/test';

import { ChalView } from '@/components/lesson/chal-view';

import { D1, freshLesson, tap, wait } from './_support';

const answer = async (root: HTMLElement, text: string) => {
  await tap('시작', root);
  await userEvent.type(await within(root).findByLabelText('내 답'), text);
  await tap('다 적었어요', root);
};

/**
 * 30초 말하기 챌린지 — 처음 보는 상황 카드(매번 섞여요) → [시작] → 30초 동안 말하기 · 쓰기 → 채점(오늘의 패턴을 썼는지 · 낱말 수).
 * 말하기는 마이크가 있어야 해서 진행 · 채점 상태는 쓰기(말하기가 어려워요)로 봐요. 30초 시간 초과는 스토리 시간 한도를 넘어 빼요.
 */
const meta = {
  title: 'Lesson/ChalView',
  component: ChalView,
  args: { D: D1, title: '30초 말하기 챌린지', onShadow: fn(), onFinish: fn(), onLeave: fn() },
  beforeEach: freshLesson(),
} satisfies Meta<typeof ChalView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 처음 — 말하기 탭 · [시작] */
export const Start: Story = {};
/** 쓰기 탭으로 시작 */
export const Write: Story = { beforeEach: freshLesson({ noSpeak: true }) };
/** 힌트 · 오늘의 패턴 켬 */
export const Hint: Story = { play: async ({ canvasElement }) => tap('힌트 · 오늘의 패턴', canvasElement) };
/** 시작함 — 시계가 줄어요 */
export const Running: Story = { beforeEach: freshLesson({ noSpeak: true }), play: async ({ canvasElement }) => tap('시작', canvasElement) };
/** 적는 중 */
export const Typing: Story = {
  beforeEach: freshLesson({ noSpeak: true }),
  play: async ({ canvasElement }) => {
    await tap('시작', canvasElement);
    await userEvent.type(await within(canvasElement).findByLabelText('내 답'), "Excuse me. I'd like to");
  },
};
/** 채점 — 패턴을 씀 · [다시 하기] [다른 상황] [완료] */
export const GradedWithPattern: Story = {
  beforeEach: freshLesson({ noSpeak: true }),
  play: async ({ canvasElement }) => answer(canvasElement, "Excuse me. I'd like to change this. Do you have soy milk? It doesn't taste right."),
};
/** 채점 — 패턴을 안 씀 */
export const GradedNoPattern: Story = {
  beforeEach: freshLesson({ noSpeak: true }),
  play: async ({ canvasElement }) => answer(canvasElement, 'Hello. Soy milk please.'),
};
/** 채점 — 말하기 모드였다면 [모범 답 따라 말하고 완료] */
export const GradedVoiceMode: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('tab', { name: '쓰기' }));
    await answer(canvasElement, "I'd like to change the milk, please.");
  },
};
/** 다른 상황 카드 */
export const NextSituation: Story = { play: async ({ canvasElement }) => { await tap('다른 상황', canvasElement); await wait(300); } };
/** X — 그만하기 확인 */
export const QuitConfirm: Story = { play: async () => tap('그만하고 과 화면으로') };
