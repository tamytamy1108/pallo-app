import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { DoneNotice } from '@/components/onboarding/done-notice';

import { padded } from '../_support/padded';

/** 체험 예약 확정 › 연락 안내 — 전화 아이콘 + '○○점에서 전화로 확정해 드려요'. 번호 끝 숫자에 따라 '으로' · '로' */
const meta = {
  title: 'Onboarding/DoneNotice',
  component: DoneNotice,
  args: { branch: '하남점', phone: '010-1234-5678' },
  decorators: [padded],
} satisfies Meta<typeof DoneNotice>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 끝 숫자 8 → '로' */
export const Default: Story = {};
/** 끝 숫자 0 · 3 · 6 → '으로' */
export const PhoneEndsWithEu: Story = { args: { phone: '010-1234-5670' } };
/** 번호가 없으면 '전화로' */
export const NoPhone: Story = { args: { phone: '' } };
/** 지점이 없으면 '지점에서' */
export const NoBranch: Story = { args: { branch: '' } };
