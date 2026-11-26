import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { View } from 'react-native';

import { MemberRow } from '@/components/my/my-sheets';
import { MEMBERS } from '@/data/my';
import { ME } from '@/data/mock';

import { padded } from '../_support/padded';
import { followingOf, fresh } from './_state';

/** 멤버 한 줄 (팔로워 · 팔로잉 · 추천 목록) — [팔로우] · [팔로잉] · 나(버튼 없음 · '나' 표시). */
const meta = {
  title: 'My/MemberRow',
  component: MemberRow,
  args: { m: MEMBERS[0], onOpen: fn() },
  decorators: [padded],
  beforeEach: fresh(),
} satisfies Meta<typeof MemberRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 안 팔로우함 — 노랑 [팔로우] */
export const NotFollowing: Story = {};
/** 팔로우 중 — 흰 [팔로잉] */
export const Following: Story = { beforeEach: fresh({ following: followingOf(MEMBERS[0].name) }) };
/** 나 — 버튼 없음 */
export const Me: Story = { args: { m: { name: ME.name, color: '#FFE200', branch: '하남점' } } };
/** 긴 이름 · 긴 지점 */
export const LongText: Story = { args: { m: { name: '아주아주긴이름의멤버입니다', color: '#CDEBD0', branch: '대전 둔산점 · 영등포 · 연신내 · 잠실점 · 대구 달서점' } } };

/** 비교 — 줄 여럿 (반은 팔로우 중) */
export const List: Story = {
  beforeEach: fresh({ following: followingOf('소라', '민준', '태오') }),
  render: (args) => (
    <View>
      {MEMBERS.map((m) => (
        <MemberRow key={m.name} m={m} onOpen={args.onOpen} />
      ))}
    </View>
  ),
};
