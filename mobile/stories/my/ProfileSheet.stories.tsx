import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { ProfileSheet } from '@/components/my/profile-sheet';

import { followingOf, fresh } from './_state';

/**
 * 멤버 프로필 시트 — 팔로우 안 함 [팔로우] · 팔로우 중 [팔로잉] · 이번 주 포인트 달리기(내가 앞섬 · 뒤짐).
 * 이름마다 지점 · 학습 언어 · 레벨 · 배지 · 한 줄 소개가 정해진다 (가짜 서버 GET /members/{code}/profile — 가짜 서버는 code 자리에 이름). 소개를 안 남긴 멤버는 그 줄이 없다.
 */
const meta = {
  title: 'My/ProfileSheet',
  component: ProfileSheet,
  args: { id: '지우', open: true, onClose: fn(), onGo: fn(), onOpen: fn() },
  beforeEach: fresh(),
} satisfies Meta<typeof ProfileSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 팔로우 안 함 */
export const NotFollowing: Story = {};
/** 팔로우 중 */
export const Following: Story = { beforeEach: fresh({ following: followingOf('지우') }) };
/** 이번 주 포인트 내가 앞섬 */
export const IAmAhead: Story = { beforeEach: fresh({ weekPoints: 900 }) };
/** 다른 멤버 (영문 이름) */
export const OtherMember: Story = { args: { id: 'Leo' } };
/** 멤버 목록에 없는 이름 — 지점은 내 지점으로 */
export const UnknownMember: Story = { args: { id: '처음보는멤버' } };
/** 한 줄 소개를 안 남긴 멤버 — 소개 줄 없이 */
export const NoBio: Story = { args: { id: '소라' } };
/** 닫힘 */
export const Closed: Story = { args: { open: false } };
