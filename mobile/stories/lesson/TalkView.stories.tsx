import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn, userEvent, within } from 'storybook/test';

import { TalkView } from '@/components/lesson/talk-view';
import { LV2_01 } from '@/data/lesson-lv2';

import { D1, freshLesson, tap, wait } from './_support';

const send = async (root: HTMLElement, text: string) => {
  await userEvent.type(await within(root).findByLabelText('내 대답'), text);
  await tap('보내기', root);
  await wait(1200);
};
const ACT = LV2_01.act;

/**
 * AI 프리토킹 — 상대와 3번 주고받아요. 위: 진행 칸 · 오늘 패턴 칩(쓰면 노랑 + 체크). 아래: 말하기 · 쓰기 + 전구(예시 2개).
 * 약한 답이면 한 번 다시 물어요. 끝나면 질문-대답 타임라인. 말하기는 마이크가 있어야 해서 대화는 쓰기로 이어요.
 */
const meta = {
  title: 'Lesson/TalkView',
  component: TalkView,
  args: { D: D1, C: D1.talk, title: 'AI 프리토킹', source: 'Lv.1 1과 · AI 프리토킹', onFinish: fn(), onLeave: fn() },
  beforeEach: freshLesson(),
} satisfies Meta<typeof TalkView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 처음 — 말하기 탭 */
export const Start: Story = {};
/** 쓰기 탭 (말하기가 어려워요) */
export const Write: Story = { beforeEach: freshLesson({ noSpeak: true }) };
/** 예시 보기 — 전구 켜짐 · 예시 2개 */
export const Examples: Story = { beforeEach: freshLesson({ noSpeak: true }), play: async ({ canvasElement }) => tap('예시 보기', canvasElement) };
/** 약한 답 — 칭찬 없이 다시 물어요 */
export const WeakRetry: Story = { beforeEach: freshLesson({ noSpeak: true }), play: async ({ canvasElement }) => send(canvasElement, 'yes') };
/** 한 번 주고받음 — 패턴 칩이 노랑 */
export const OneTurn: Story = {
  beforeEach: freshLesson({ noSpeak: true }),
  play: async ({ canvasElement }) => send(canvasElement, "I had an iced latte this morning. I'd like to have another one."),
};
/** 다 끝남 — 타임라인 + [완료하기] */
export const Done: Story = {
  beforeEach: freshLesson({ noSpeak: true }),
  play: async ({ canvasElement }) => {
    await send(canvasElement, "I had an iced latte this morning because I was so tired.");
    await send(canvasElement, "Yes. I ordered a hot latte, but it isn't hot. I'd like to get a new one.");
    await send(canvasElement, 'Do you have oat milk? I asked the staff and they made a new one for me.');
    await wait(800);
  },
};
/** Lv.2 상황 역할극 (교재 상황 대사 · 추천 답) */
export const Lv2Roleplay: Story = ACT
  ? { args: { D: LV2_01, C: { who: ACT.who, lines: ACT.lines, replies: ACT.replies }, title: LV2_01.actTitle } }
  : {};
/** 소리 끄기 */
export const SoundOff: Story = { beforeEach: freshLesson({ noListen: true, noSpeak: true }) };
