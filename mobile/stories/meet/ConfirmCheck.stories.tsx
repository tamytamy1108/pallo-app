import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { ConfirmCheck } from '@/components/meet/detail/sheets';

import { padded } from '../_support/padded';

/** 확인 체크 (줄 전체가 체크 칸) — 꺼짐 · 켜짐 · 긴 문구. */
const meta = {
  title: 'Meet/ConfirmCheck',
  component: ConfirmCheck,
  args: { checked: false, onChange: fn(), label: '모임 내용과 안내를 확인했어요' },
  decorators: [padded],
} satisfies Meta<typeof ConfirmCheck>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};
export const Checked: Story = { args: { checked: true } };
export const LongLabel: Story = { args: { checked: true, label: '모임 내용 · 안내 · 입금 계좌를 확인했어요. 입금 뒤 취소하면 환불 규정에 따라 돌려받아요.' } };
