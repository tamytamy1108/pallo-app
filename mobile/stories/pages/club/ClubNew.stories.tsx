import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import NewClub from '@/app/(app)/club/new';

import { meetState } from '../../meet/_fixtures';

/**
 * 동아리 만들기 폼 (/club/new) — 이름 · 카테고리 · 언어 · 지역 · 요일 · 시간 · 최대 인원 · 가입 조건 · 채팅방 공지 · 포스터.
 * 폼 값은 화면 안 useState 라 처음 상태만 보인다. 이름이 비면 토스트로 막는데 Storybook 엔 ToastHost 가 없다.
 */
const meta = {
  title: 'Pages/Club/New',
  component: NewClub,
  parameters: { route: { pathname: '/club/new' } },
  beforeEach: meetState(),
} satisfies Meta<typeof NewClub>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const SmallPhone: Story = { globals: { viewport: { value: 'phone-sm', isRotated: false } } };
