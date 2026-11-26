import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import VersionScreen from '@/app/(app)/me/settings/version';

/**
 * 앱 버전 (/me/settings/version) — 지금 · 최신 버전 · 바뀐 점 · 오픈소스 라이선스(펼침).
 * 버전 값은 가짜 데이터(APP_VERSION) 고정이라 '업데이트 있음' 모양은 만들 수 없다.
 */
const meta = {
  title: 'Pages/Me/Settings/Version',
  component: VersionScreen,
  parameters: { route: { pathname: '/me/settings/version' } },
} satisfies Meta<typeof VersionScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** 오픈소스 라이선스 펼침 */
export const Licenses: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByText(/오픈소스/));
  },
};
