import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import ReportsScreen from '@/app/(app)/me/settings/reports';

import { fresh } from '../../../my/_state';

/** 신고 내역 (/me/settings/reports) — 내가 한 신고 · 받은 경고(0 · 빈 문구). 신고 목록은 가짜 데이터(MY_REPORTS) 고정. */
const meta = {
  title: 'Pages/Me/Settings/Reports',
  component: ReportsScreen,
  parameters: { route: { pathname: '/me/settings/reports' } },
  beforeEach: fresh(),
} satisfies Meta<typeof ReportsScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Mine: Story = {};
/** 받은 경고 탭 */
export const Warnings: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole('tab', { name: /받은 경고/ }));
  },
};
