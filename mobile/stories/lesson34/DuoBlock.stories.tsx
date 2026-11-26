import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { userEvent, within } from 'storybook/test';

import { DuoBlock } from '@/components/lesson34/blocks/misc';
import type { DuoTask } from '@/components/lesson34/types';

import { freshDevice } from '../_support/fresh-device';
import { withRunner } from './_runner';

/** 짧은 1:1 대화 (상대가 말하면 내가 답하기 · 마지막 줄이면 끝 + 결과) — 지금 코너엔 없지만 블록이 지원하는 모양 */
const task: DuoTask = {
  type: 'duo',
  kick: 'TOPIC · 짧은 대화',
  head: { k: 'ROLE PLAY', p: 'Logan 과 이름 이야기', m: '두 번 답하면 끝나요' },
  who: 'Logan',
  c: '#2F4E8C',
  lines: [
    ['Have you ever forgotten someone’s name?', '누군가의 이름을 잊은 적 있어요?'],
    ['What did you do then?', '그때 어떻게 했어요?'],
    ['Ha, I’ve done that too!', '하하, 저도 그런 적 있어요!', 1],
  ],
  result: { title: '오늘 대화에서 쓴 말', items: (mine) => mine.map((m) => `“${m}”`) },
};

const reply = (texts: string[]) => async () => {
  const c = within(document.body);
  for (const t of texts) {
    await userEvent.type(await c.findByLabelText('영어로 답하기'), t);
    await userEvent.click(c.getByRole('button', { name: '보내기' }));
  }
};

const meta = {
  title: 'Lesson34/DuoBlock',
  component: DuoBlock,
  decorators: [withRunner],
  beforeEach: freshDevice(),
  args: { task },
  parameters: { runner: { soundOff: true } },
} satisfies Meta<typeof DuoBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 상대 첫 말 · 답 입력 칸 · [보내기] */
export const Start: Story = {};
/** 한 번 답함 — 내 말풍선 + 상대 다음 말 */
export const OneReply: Story = { play: reply(['Yes, at a party last year.']) };
/** 대화 끝 — 결과 목록 + [다음] */
export const Finished: Story = { play: reply(['Yes, at a party last year.', 'I just smiled and asked a friend.']) };
