import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import CustomizeScreen from '@/app/(app)/me/customize';

import { fresh } from '../../my/_state';

/**
 * 캐릭터 꾸미기 (/me/customize) — 누구나. 무대 · 탭(캐릭터 · 머리 · … · 배경 · 말풍선) · 아이템 칸 · 스파크 · [저장하기].
 * 탭 · 고른 아이템은 화면 안 상태라 기본은 '캐릭터' 탭.
 */
const meta = {
  title: 'Pages/Me/Customize',
  component: CustomizeScreen,
  parameters: { route: { pathname: '/me/customize' } },
  beforeEach: fresh(),
} satisfies Meta<typeof CustomizeScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** 스파크 0 */
export const NoSparks: Story = { beforeEach: fresh({ sparks: 0 }) };
/** 스파크 많음 */
export const RichSparks: Story = { beforeEach: fresh({ sparks: 99999 }) };
/** 비회원도 쓸 수 있음 */
export const Guest: Story = { globals: { userKind: 'guest' } };
