import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { toggleLogin } from '@/components/account/store';
import LoginAccountScreen from '@/app/(app)/me/settings/login';

import { fresh } from '../../../my/_state';

/** 로그인 계정 (/me/settings/login) — 간편 로그인 연결 상태 (마지막 하나는 못 끊음). */
const meta = {
  title: 'Pages/Me/Settings/Login',
  component: LoginAccountScreen,
  parameters: { route: { pathname: '/me/settings/login' } },
  beforeEach: fresh(),
} satisfies Meta<typeof LoginAccountScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 카카오만 연결 */
export const KakaoOnly: Story = {};
/** 셋 다 연결 */
export const AllLinked: Story = {
  beforeEach: fresh({}, () => {
    toggleLogin('애플');
    toggleLogin('구글');
  }),
};
/** 구글만 연결 */
export const GoogleOnly: Story = {
  beforeEach: fresh({}, () => {
    toggleLogin('구글');
    toggleLogin('카카오');
  }),
};
