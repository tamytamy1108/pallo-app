import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { BuildTask } from '@/components/lesson/build-task';
import type { BuildTask as BuildTaskData } from '@/data/lessons';

import { DLG, freshLesson, POOL, tap, withTask } from './_support';

const SHORT: BuildTaskData = { type: 'build', en: "I'd like to return this.", ko: '이거 반품하고 싶어요.', pool: POOL };
const RIGHT = ["I'd", 'like', 'to', 'return', 'this.'];
const WRONG = ['this.', 'return', 'to', 'like', "I'd"];

const put = async (root: HTMLElement, words: string[]) => {
  for (const w of words) await tap(w, root);
};

/**
 * 단어 카드로 문장 만들기 — 정답 낱말 + 헷갈리는 낱말 2개(섞여 나와요).
 * 처음 틀리면 'Not quite!' + 맞은 앞부분만 남김, 두 번째도 틀리면 정답 카드 + 오답 띠.
 */
const meta = {
  title: 'Lesson/BuildTask',
  component: BuildTask,
  args: { task: SHORT },
  decorators: [withTask],
  beforeEach: freshLesson(),
} satisfies Meta<typeof BuildTask>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 아직 안 놓음 — [확인] 막힘 */
export const Unanswered: Story = {};
/** 대화문 마지막 대사 만들기 (긴 문장 · 제목 줄) */
export const DialogueLastLine: Story = { args: { task: DLG.build } };
/** 몇 장 놓음 */
export const Selected: Story = { play: async ({ canvasElement }) => put(canvasElement, RIGHT.slice(0, 3)) };
/** 맞힘 — 정답 띠 */
export const Correct: Story = {
  play: async ({ canvasElement }) => {
    await put(canvasElement, RIGHT);
    await tap('확인', canvasElement);
  },
};
/** 처음 틀림 — 한 번 더 (맞은 앞부분 없음) */
export const WrongOnce: Story = {
  play: async ({ canvasElement }) => {
    await put(canvasElement, WRONG);
    await tap('확인', canvasElement);
  },
};
/** 처음 틀림 — 맞은 앞 3단어는 남겨 둠 */
export const WrongOnceKeptPrefix: Story = {
  play: async ({ canvasElement }) => {
    await put(canvasElement, ["I'd", 'like', 'to', 'this.', 'return']);
    await tap('확인', canvasElement);
  },
};
/** 두 번 틀림 — 정답 카드 + 오답 띠 */
export const WrongTwice: Story = {
  play: async ({ canvasElement }) => {
    await put(canvasElement, WRONG);
    await tap('확인', canvasElement);
    await put(canvasElement, WRONG);
    await tap('확인', canvasElement);
  },
};
/** 소리 끄기에서 맞힘 — 듣기 버튼 없음 */
export const CorrectSoundOff: Story = {
  parameters: { task: { soundOff: true } },
  play: async ({ canvasElement }) => {
    await put(canvasElement, RIGHT);
    await tap('확인', canvasElement);
  },
};
