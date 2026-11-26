import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import DeleteAccountScreen from '@/app/(app)/me/delete';

import { fresh } from '../../my/_state';

/** 회원 탈퇴 (/me/delete) — 이유 고르기 → [탈퇴하기] 확인 대화상자 → '탈퇴했어요'. */
const meta = {
  title: 'Pages/Me/Delete',
  component: DeleteAccountScreen,
  parameters: { route: { pathname: '/me/delete' } },
  beforeEach: fresh(),
} satisfies Meta<typeof DeleteAccountScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** 이유 두 개 고름 */
export const ReasonsPicked: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByText('앱을 잘 안 써요'));
    await userEvent.click(await canvas.findByText('알림이 너무 많아요'));
  },
};
/** 확인 대화상자 열림 */
export const Confirm: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole('button', { name: '탈퇴하기' }));
  },
};
