import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { ExprRows } from '@/components/my/expr-rows';
import { SEED_EXPRESSIONS } from '@/data/my';

import { padded } from '../_support/padded';
import { fresh } from './_state';

/** 내 표현함 줄 목록 (랭킹 · 퀘스트 아래) — 비었음 · 하나 · 여럿 · 고친 문장 · 긴 문장. */
const meta = {
  title: 'My/ExprRows',
  component: ExprRows,
  args: { list: SEED_EXPRESSIONS.slice(0, 5) },
  decorators: [padded],
  beforeEach: fresh(),
} satisfies Meta<typeof ExprRows>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Few: Story = {};
export const Empty: Story = { args: { list: [] } };
export const One: Story = { args: { list: SEED_EXPRESSIONS.slice(0, 1) } };
export const All: Story = { args: { list: SEED_EXPRESSIONS } };
/** PRO'S NOTE 바로잡기 — 고친 문장(fixed)을 보여 줌 */
export const Corrected: Story = {
  args: { list: [{ id: 'c1', en: 'I very like it.', fixed: 'I really like it.', ko: '정말 좋아해요', source: "PRO'S NOTE · 11/10 5팀", savedAt: Date.now() }] },
};
/** 긴 문장 · 긴 뜻 */
export const LongText: Story = {
  args: {
    list: [
      {
        id: 'l1',
        en: 'If I had known you were coming to the session tonight, I would have saved you a seat next to the window.',
        ko: '오늘 밤 세션에 네가 올 줄 알았으면 창가 옆자리를 맡아 뒀을 텐데 말이야 — 아주 긴 뜻이 들어가면 어떻게 줄이 바뀌는지 봐요',
        source: '프리토킹 · 11.12 영등포 세션',
        from: 'free',
        savedAt: Date.now(),
      },
    ],
  },
};
