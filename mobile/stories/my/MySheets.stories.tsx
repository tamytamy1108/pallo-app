import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { BadgeSheet, FollowSheet, MeetsSheet, SparkSheet } from '@/components/my/my-sheets';
import { ME } from '@/data/mock';

import { followingOf, fresh } from './_state';

/**
 * 마이 시트 — 배지 모두 · 스파크 모으는 법 · 내 모임/찜한 모임 · 팔로워/팔로잉 목록 · 멤버 한 줄.
 * 시트는 열린 상태로 그린다.
 */
const meta = {
  title: 'My/Sheets',
  component: BadgeSheet,
  args: { open: true, onClose: fn() },
  beforeEach: fresh(),
} satisfies Meta<typeof BadgeSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Badges: Story = {};
export const Spark: Story = { render: (args) => <SparkSheet {...args} /> };

/** 내 모임 — 0개 (빈 문구) */
export const MeetsJoinedEmpty: Story = { render: () => <MeetsSheet kind="joined" onClose={fn()} /> };
/** 내 모임 — 개수 있음 (목록은 아직 빈 문구) */
export const MeetsJoinedCount: Story = { beforeEach: fresh({ joinedMeets: 3 }), render: () => <MeetsSheet kind="joined" onClose={fn()} /> };
/** 찜한 모임 */
export const MeetsSaved: Story = { beforeEach: fresh({ savedMeets: 2 }), render: () => <MeetsSheet kind="saved" onClose={fn()} /> };

/** 팔로워 탭 */
export const FollowersTab: Story = { render: () => <FollowSheet name={ME.name} tab="fer" onTab={fn()} onClose={fn()} /> };
/** 팔로잉 탭 — 아무도 안 함 (빈 문구) */
export const FollowingEmpty: Story = { render: () => <FollowSheet name={ME.name} tab="fing" onTab={fn()} onClose={fn()} /> };
/** 팔로잉 탭 — 여럿 */
export const FollowingMany: Story = {
  beforeEach: fresh({ following: followingOf('지우', '소라', 'Leo', '민준', '유키', '태오') }),
  render: () => <FollowSheet name={ME.name} tab="fing" onTab={fn()} onClose={fn()} />,
};
/** 다른 멤버의 목록 */
export const OtherMember: Story = { render: () => <FollowSheet name="지우" tab="fer" onTab={fn()} onClose={fn()} onOpen={fn()} /> };
