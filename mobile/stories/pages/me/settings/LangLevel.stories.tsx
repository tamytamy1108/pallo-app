import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { requestLevelChange, updateSettings } from '@/components/account/store';
import LangLevelScreen from '@/app/(app)/me/settings/langlv';

import { fresh } from '../../../my/_state';

/** 학습 언어 · 레벨 (/me/settings/langlv) — 요청 없음 · 레벨 변경 요청됨 · 레벨 테스트 결과 시트 · 변경 요청 시트. */
const meta = {
  title: 'Pages/Me/Settings/LangLevel',
  component: LangLevelScreen,
  parameters: { route: { pathname: '/me/settings/langlv' } },
  beforeEach: fresh(),
} satisfies Meta<typeof LangLevelScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** 레벨 변경 요청됨 — '프로님 확인 중' */
export const Requested: Story = { beforeEach: fresh({}, () => requestLevelChange('한 단계 위로 · 수업이 쉬워요')) };
/** 다른 언어 */
export const Japanese: Story = { beforeEach: fresh({}, () => updateSettings({ lang: '일본어' })) };
export const TestSheet: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole('button', { name: '레벨 테스트 결과' }));
  },
};
export const RequestSheet: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole('button', { name: '레벨 변경 요청' }));
  },
};
