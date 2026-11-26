import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import ProfileScreen from '@/app/(app)/me/profile/[id]';

import { followingOf, fresh } from '../../my/_state';

/**
 * 멤버 프로필 (/me/profile/[이름]) — 시트로 뜬다. 팔로우 안 함 · 팔로우 중 · 목록에 없는 이름.
 * 내 이름이면 바로 /my 로 돌아가 아무것도 그리지 않아서 스토리를 두지 않는다.
 */
const meta = {
  title: 'Pages/Me/Profile',
  component: ProfileScreen,
  parameters: { route: { pathname: '/me/profile/지우', params: { id: '지우' } } },
  beforeEach: fresh(),
} satisfies Meta<typeof ProfileScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NotFollowing: Story = {};
export const Following: Story = { beforeEach: fresh({ following: followingOf('지우') }) };
/** 영문 이름 · 주소 인코딩 */
export const EncodedName: Story = { parameters: { route: { pathname: '/me/profile/Leo', params: { id: encodeURIComponent('Leo') } } } };
/** 멤버 목록에 없는 이름 */
export const UnknownMember: Story = { parameters: { route: { pathname: '/me/profile/x', params: { id: '없는멤버' } } } };
/** 비회원이 볼 때 */
export const AsGuest: Story = { globals: { userKind: 'guest' } };
