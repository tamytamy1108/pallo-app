import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { SitView } from '@/components/lesson/sit-view';
import { setStepData } from '@/state/progress';

import { D1, freshLesson, tap, wait } from './_support';

const SKEY = 'story:sit';
const found = (v: Record<number, true>) => () => setStepData(SKEY, v);
/** Logan 응대 첫 답 (단어 카드 순서) */
const LOGAN_1 = 'I’m sorry to hear that. Let me check it.'.split(' ');

/**
 * 상황 활동 Lv.1 — 교재 그림 위 인물 이름표 → 누르면 그 사람이 먼저 말해요 → [응대하기] → 단어 카드 응대 대화(카드마다 바로 채점).
 * 응대한 인물은 이름표가 회색. 한 칸에서 3번 틀리면 맞는 카드가 노랗게 반짝.
 */
const meta = {
  title: 'Lesson/SitView',
  component: SitView,
  args: { D: D1, skey: SKEY, source: 'Lv.1 1과 · 상황 활동', onFinish: fn(), onLeave: fn() },
  beforeEach: freshLesson(),
} satisfies Meta<typeof SitView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 그림 · 이름표 — 아무도 응대 안 함 */
export const Scene: Story = {};
/** 둘 응대함 — 회색 이름표 · 2/4 */
export const SomeFound: Story = { beforeEach: freshLesson({ seed: found({ 0: true, 2: true }) }) };
/** 다 응대함 */
export const AllFound: Story = { beforeEach: freshLesson({ seed: found({ 0: true, 1: true, 2: true, 3: true }) }) };
/** 이름표 누름 — 말풍선 · 단서 · [Logan 응대하기] */
export const Hearing: Story = { play: async ({ canvasElement }) => tap('Logan 목소리 듣기', canvasElement) };
/** 이미 응대한 사람 — '해결했어요' · [한 번 더 하기] */
export const HearingSolved: Story = { beforeEach: freshLesson({ seed: found({ 0: true }) }), play: async ({ canvasElement }) => tap('Logan 목소리 듣기', canvasElement) };
/** 응대 대화 시작 */
export const Talk: Story = {
  play: async ({ canvasElement }) => {
    await tap('Logan 목소리 듣기', canvasElement);
    await tap('Logan 응대하기', canvasElement);
  },
};
/** 응대 대화 — 틀린 카드 3번 → 맞는 카드 반짝 */
export const TalkHint: Story = {
  play: async ({ canvasElement }) => {
    await tap('Logan 목소리 듣기', canvasElement);
    await tap('Logan 응대하기', canvasElement);
    for (let k = 0; k < 3; k++) await tap('check', canvasElement);
  },
};
/** 응대 대화 — 첫 답을 맞춤 → 손님 다음 말 */
export const TalkFirstReply: Story = {
  play: async ({ canvasElement }) => {
    await tap('Logan 목소리 듣기', canvasElement);
    await tap('Logan 응대하기', canvasElement);
    for (const w of LOGAN_1) await tap(w, canvasElement);
    await wait(2000);
  },
};
/** 소리 끄기 */
export const SoundOff: Story = { beforeEach: freshLesson({ noListen: true }), play: async ({ canvasElement }) => tap('Logan 목소리 듣기', canvasElement) };
/** X — 그만하기 확인 */
export const QuitConfirm: Story = { play: async () => tap('그만하고 과 화면으로') };
