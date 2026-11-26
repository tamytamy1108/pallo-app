import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import PaymentsScreen from '@/app/(app)/me/payments';

import { fresh } from '../../my/_state';

/**
 * 결제 내역 (/me/payments) — 회원이 이용권 화면에서 들어와요 (잠금 없음). 줄을 누르면 영수증 시트.
 * 결제 내역은 가짜 데이터(data/account PAYMENTS) 고정이라 '결제 내역 없음' 모양은 만들 수 없다.
 */
const meta = {
  title: 'Pages/Me/Payments',
  component: PaymentsScreen,
  parameters: { route: { pathname: '/me/payments' } },
  beforeEach: fresh(),
} satisfies Meta<typeof PaymentsScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** 첫 줄 영수증 시트 열림 */
export const Receipt: Story = {
  play: async ({ canvas, userEvent }) => {
    const rows = await canvas.findAllByRole('button', { name: /영수증/ });
    await userEvent.click(rows[0]);
  },
};
