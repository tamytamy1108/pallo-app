import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import PassScreen from '@/app/(app)/me/pass';

import { fresh } from '../../my/_state';

/**
 * 이용권 · 남은 세션 (/me/pass) — 회원만. 비회원은 '지점 회원이 되면 열려요' 잠김.
 * 이용권 · 사용 내역은 가짜 데이터(data/account getMembership · PASS_LOG) 고정이라 '이용권 없음' 모양은 만들 수 없다.
 */
const meta = {
  title: 'Pages/Me/Pass',
  component: PassScreen,
  parameters: { route: { pathname: '/me/pass' } },
  beforeEach: fresh(),
} satisfies Meta<typeof PassScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Member: Story = { globals: { userKind: 'member' } };
/** 사용 내역 [더 보기] 펼침 */
export const MoreLog: Story = {
  globals: { userKind: 'member' },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByText(/더 보기/));
  },
};
export const Guest: Story = { globals: { userKind: 'guest' } };
export const Pending: Story = { globals: { userKind: 'pending' } };
export const Rejected: Story = { globals: { userKind: 'rejected' } };
export const Trial: Story = { globals: { userKind: 'trial' } };
