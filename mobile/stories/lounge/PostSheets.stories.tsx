import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { AskSheet, LikersSheet } from '@/components/lounge/post-card';
import { toggleLike } from '@/data/lounge-store';

import { setup } from './_fixtures';

/** 좋아요 누른 사람 시트 — 30명까지 · 내가 눌렀으면 맨 위 '나' · 넘치면 '외 N명'. */
const meta = {
  title: 'Lounge/LikersSheet',
  component: LikersSheet,
  args: { open: true, id: 'p5', who: '지우', likes: 24, onClose: fn() },
  beforeEach: setup(),
} satisfies Meta<typeof LikersSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** 내가 눌렀을 때 — 맨 위에 나 */
export const LikedByMe: Story = { beforeEach: setup(() => toggleLike('p5')) };
/** 많음 — 30명까지 보이고 '외 98명이 좋아해요' */
export const Many: Story = { args: { id: 'p1', who: '하나', likes: 128 } };
/** 아무도 안 누름 */
export const Zero: Story = { args: { id: 'sb-zero', likes: 0 } };
/** ○○에게 질문하기 시트 (해외살이 카드) */
export const Ask: Story = {
  render: (args) => <AskSheet open onClose={args.onClose} who="예린" sub="잠실점 출신 · 시드니 7개월째" />,
};
