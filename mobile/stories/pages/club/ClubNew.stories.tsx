import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import NewClub from '@/app/(app)/club/new';

import { addMyClub } from '@/components/meet/meet-store';

import { meetState, myClub } from '../../meet/_fixtures';

/**
 * 동아리 만들기 폼 (/club/new) — 이름 · 카테고리 · 언어 · 지역 · 요일 · 시간 · 시작 날짜 · 최대 인원 · 가입 조건 · 채팅방 공지 · 포스터.
 * ?edit=<id> 면 검토 중인 내 신청을 적어 보낸 값으로 열어 고쳐요.
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
/** 검토 중인 신청 고치기 (?edit=) — 적어 보낸 값이 채워져 있어요 */
export const EditWaiting: Story = {
  parameters: { route: { pathname: '/club/new', params: { edit: 'u-edit' } } },
  beforeEach: meetState(() => addMyClub({ ...myClub('u-edit', true), intro: '퇴근하고 영어로 수다 떨어요.', langs: ['영어'], time: ['20:00', '22:00'], start: '2026-12-10' })),
};
