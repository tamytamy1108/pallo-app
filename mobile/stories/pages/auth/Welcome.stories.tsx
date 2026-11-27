import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { userEvent, within } from 'storybook/test';

import WelcomeScreen from '@/app/(auth)/index';

import { LOADING_FOREVER } from '../../_support/api';

/**
 * 첫 화면 · YOUR FIRST STAGE (/welcome) — 불이 켜지고 무대가 펼쳐지고 팔로로가 떨어지는 움직임 뒤 [카카오로 시작하기].
 * 버튼을 누르면 '카카오로 들어가는 중…' (스토리는 가짜 카카오 로그인이라 실제로 넘어가지 않아요).
 */
const meta = {
  title: 'Pages/Auth/Welcome',
  component: WelcomeScreen,
  parameters: { route: { pathname: '/welcome' } },
} satisfies Meta<typeof WelcomeScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** [카카오로 시작하기] 누름 → 들어가는 중 (응답을 끝없이 늦춰 고정) */
export const Signing: Story = {
  parameters: { api: { delayMs: LOADING_FOREVER } },
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('button', { name: '카카오로 시작하기' }));
  },
};
