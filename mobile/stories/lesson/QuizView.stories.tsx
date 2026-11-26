import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn, userEvent, within } from 'storybook/test';

import { QuizView } from '@/components/lesson/quiz-view';
import { speakItems } from '@/data/lessons';
import { saveSnapshot } from '@/state/progress';

import { D1, freshLesson, tap } from './_support';

const SKEY = 'story:quiz';
const ITEMS = speakItems(D1);
const ORDER = [0, 1, 2, 3, 4, 5, 6, 7];
/** 2번 문제(ITEMS[1])부터 — 문제가 늘 같게 멈춘 곳을 넣어 둬요 */
const at = (i: number, right = 0) => () => saveSnapshot(SKEY, { order: ORDER, i, right });
const Q = ITEMS[1];

const write = async (root: HTMLElement, text: string) => {
  const c = within(root);
  await userEvent.click(await c.findByRole('tab', { name: '쓰기' }));
  await userEvent.type(await c.findByLabelText('내 답'), text);
  await tap('답변하기', root);
};

/**
 * 스피킹 퀴즈 — 한국어 보고 영어로 (단어 카드 · 말하기 · 쓰기). 단어별 채점, 처음 틀리면 분홍 칸만 다시, 두 번째도 틀리면 정답.
 * 힌트: 카드 · 말하기 2단계, 쓰기 3단계. 말하기 채점은 마이크가 있어야 해서 쓰기로 봐요.
 */
const meta = {
  title: 'Lesson/QuizView',
  component: QuizView,
  args: { D: D1, skey: SKEY, source: 'Lv.1 1과 · 스피킹 퀴즈', onFinish: fn(), onLeave: fn() },
  beforeEach: freshLesson(),
} satisfies Meta<typeof QuizView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 처음 — 말하기 탭 (문제는 섞여 나와요) */
export const Start: Story = {};
/** 말하기가 어려워요 — 단어 카드 탭 */
export const Cards: Story = { beforeEach: freshLesson({ noSpeak: true }) };
/** 멈춘 곳부터 이어서 — 토스트 '2번 문제부터…' */
export const Resumed: Story = { beforeEach: freshLesson({ seed: at(1, 1) }) };
/** 힌트 1단계 */
export const Hint1: Story = { beforeEach: freshLesson({ seed: at(1) }), play: async ({ canvasElement }) => tap(/힌트 0/, canvasElement) };
/** 쓰기 힌트 3단계 다 씀 */
export const HintWriteMax: Story = {
  beforeEach: freshLesson({ seed: at(1) }),
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('tab', { name: '쓰기' }));
    for (let k = 0; k < 3; k++) await tap(new RegExp(`힌트 ${k}`), canvasElement);
  },
};
/** 맞힘 — 초록 칸 + [다음 문제] */
export const Correct: Story = { beforeEach: freshLesson({ seed: at(1) }), play: async ({ canvasElement }) => write(canvasElement, Q.en) };
/** 처음 틀림 — 분홍 칸 · [넘어가기] [답변하기] · 보라 팔로 */
export const WrongOnce: Story = { beforeEach: freshLesson({ seed: at(1) }), play: async ({ canvasElement }) => write(canvasElement, 'I want sit there.') };
/** 두 번 틀림 — 정답이 칸에 차례로 */
export const WrongTwice: Story = {
  beforeEach: freshLesson({ seed: at(1) }),
  play: async ({ canvasElement }) => {
    await write(canvasElement, 'I want sit there.');
    await userEvent.type(await within(canvasElement).findByLabelText('내 답'), 'Still wrong answer.');
    await tap('답변하기', canvasElement);
  },
};
/** 마지막 문제 — [결과 보기] */
export const LastCorrect: Story = { beforeEach: freshLesson({ seed: at(7) }), play: async ({ canvasElement }) => write(canvasElement, ITEMS[7].en) };
/** 끝 — 힌트 없이 한 번에 맞힌 문장 6/8 */
export const Finished: Story = { beforeEach: freshLesson({ seed: at(8, 6) }) };
/** X — '정말 그만할까요?' */
export const QuitConfirm: Story = { beforeEach: freshLesson({ seed: at(1) }), play: async () => tap('그만하고 과 화면으로') };
