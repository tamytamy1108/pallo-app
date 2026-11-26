import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn, userEvent, within } from 'storybook/test';

import { StoryView } from '@/components/lesson/story-view';
import { setStepData } from '@/state/progress';

import { D1, freshLesson, tap, wait } from './_support';

const SKEY = 'story:mystory';
const KW = ['a cafe in Hanam', 'order an iced latte', 'oat milk', 'taste like oat milk', 'asked the staff', 'they made a new one'];
const PARA = D1.story.template.replace(/___/g, (() => {
  let k = 0;
  return () => KW[k++] ?? '___';
})());
const seed = (v: { pick: number | null; a: string[]; para: string }) => () => setStepData(SKEY, v);

/**
 * My Story — 주제 고르기 → 질문마다 키워드 → [키워드로 문단 만들기] → 완성 문단 → [완료하기](문장 순서 · 따라 읽기로).
 * 쓴 내용은 기기에 남아서, 스토리는 단계 데이터(setStepData)를 넣어 각 상태를 보여요. 말하기 키워드는 마이크가 있어야 해요.
 */
const meta = {
  title: 'Lesson/StoryView',
  component: StoryView,
  args: { D: D1, skey: SKEY, onParagraph: fn(), onLeave: fn() },
  beforeEach: freshLesson(),
} satisfies Meta<typeof StoryView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 처음 — 주제 안 고름, 말하기 탭 */
export const Start: Story = {};
/** 쓰기 탭으로 시작 (말하기가 어려워요) */
export const Write: Story = { beforeEach: freshLesson({ noSpeak: true }) };
/** 주제 고름 · 키워드 두 개 */
export const Partial: Story = { beforeEach: freshLesson({ noSpeak: true, seed: seed({ pick: 0, a: KW.slice(0, 2), para: '' }) }) };
/** 다 채움 — [키워드로 문단 만들기] 열림 */
export const Ready: Story = { beforeEach: freshLesson({ noSpeak: true, seed: seed({ pick: 1, a: KW, para: '' }) }) };
/** 완성 문단 — [완료하기] */
export const Paragraph: Story = { beforeEach: freshLesson({ seed: seed({ pick: 0, a: KW, para: PARA }) }) };
/** 주제 없이 문단 만들기 → '먼저 이야기 주제를 골라요' 깜빡 */
export const NeedTopic: Story = { beforeEach: freshLesson({ noSpeak: true }), play: async ({ canvasElement }) => tap('키워드로 문단 만들기', canvasElement) };
/** 영어가 아닌 키워드 — 연보라 띠 + 고치기 */
export const KeywordProblem: Story = {
  beforeEach: freshLesson({ noSpeak: true, seed: seed({ pick: 0, a: [], para: '' }) }),
  play: async ({ canvasElement }) => {
    await userEvent.type(await within(canvasElement).findByLabelText('Q1 키워드'), '카페');
    await wait(1200);
  },
};
/** X — 그만하기 확인 */
export const QuitConfirm: Story = { play: async () => tap('그만하고 과 화면으로') };
