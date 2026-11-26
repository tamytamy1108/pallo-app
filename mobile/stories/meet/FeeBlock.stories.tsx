import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { FeeBlock } from '@/components/meet/detail/detail-parts';

import { padded } from '../_support/padded';

/** 참가비 — 무료 · 금액 · 할인 전 금액(취소선). */
const meta = {
  title: 'Meet/FeeBlock',
  component: FeeBlock,
  args: {},
  decorators: [padded],
} satisfies Meta<typeof FeeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Free: Story = {};
export const Paid: Story = { args: { fee: 15000 } };
export const Discounted: Story = { args: { fee: 12000, fee0: '20,000원' } };
export const BigAmount: Story = { args: { fee: 1250000 } };
