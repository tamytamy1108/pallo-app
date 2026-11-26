import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { userEvent, within } from 'storybook/test';

import { ReadBlock } from '@/components/lesson34/blocks/misc';
import type { ReadTask } from '@/components/lesson34/types';

import { freshDevice } from '../_support/fresh-device';
import { withRunner } from './_runner';

/**
 * 다듬은 글 다시 읽기 — 단어 카드를 순서대로 이어요 (말하면 저절로 이어지고, 눌러도 돼요).
 * 세 번 틀리면 다음 카드를 반짝 힌트. 다 이으면 모범 문장 카드.
 */
const EN = 'These days I am hooked on running after work.';
const task: ReadTask = { type: 'read', kick: 'JOURNAL · 다시 읽기', en: EN, ko: '요즘 퇴근 후 달리기에 푹 빠져 있어요.', label: '다듬은 내 일기' };
const words = EN.split(' ');

const tap = (list: string[]) => async () => {
  const c = within(document.body);
  for (const w of list) await userEvent.click(await c.findByRole('button', { name: w }));
};

const meta = {
  title: 'Lesson34/ReadBlock',
  component: ReadBlock,
  decorators: [withRunner],
  beforeEach: freshDevice(),
  args: { task },
  parameters: { runner: { soundOff: true } },
} satisfies Meta<typeof ReadBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 처음 — 섞인 단어 카드 · [눌러서 말하기] */
export const Default: Story = {};
/** 세 단어 이음 */
export const Partial: Story = { play: tap(words.slice(0, 3)) };
/** 세 번 틀림 — 다음 카드가 힌트로 */
export const Hint: Story = { play: tap([words[4], words[4], words[4]]) };
/** 다 이음 — 모범 문장 카드 + [다음] */
export const Done: Story = { play: tap(words) };
