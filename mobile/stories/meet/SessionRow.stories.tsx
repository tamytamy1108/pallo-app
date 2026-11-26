import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { SessionRow } from '@/components/meet/club/schedule';
import { clubContent } from '@/components/meet/model';

import { padded } from '../_support/padded';
import { CLUB_FREE, session } from './_fixtures';

const ALBUM = clubContent(CLUB_FREE).album;

/** 정기 모임 일정 한 줄 — 상태 글씨(모집 중 · 마감 · 참석 완료) · 오늘/요일 · 내 지점 n명 · 썸네일. */
const meta = {
  title: 'Meet/SessionRow',
  component: SessionRow,
  args: { c: CLUB_FREE, q: session(), i: 0, album: ALBUM, mine: 0, onPress: fn() },
  decorators: [padded],
} satisfies Meta<typeof SessionRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 모집 중 · 8명 중 4명 */
export const Open: Story = {};
/** 오늘 */
export const Today: Story = { args: { q: session({ k: 0 }) } };
/** 마감 */
export const Full: Story = { args: { q: session({ cur: 8 }) } };
/** 내가 참석 */
export const Attending: Story = { args: { q: session({ me: true, cur: 5 }) } };
/** 내 지점 멤버가 있음 */
export const MyBranchMembers: Story = { args: { mine: 2 } };
/** 긴 주제 — 한 줄로 잘림 */
export const LongTheme: Story = { args: { q: session({ th: '오늘의 장면: 첫 만남에서 어색하지 않게 자기소개하고 취미 묻기까지 길게' }) } };
export const List: Story = {
  render: (args) => (
    <View style={{ gap: 10 }}>
      <SessionRow {...args} q={session({ k: 0, id: 'a' })} i={0} />
      <SessionRow {...args} q={session({ k: 2, id: 'b', cur: 8 })} i={1} />
      <SessionRow {...args} q={session({ k: 5, id: 'c', me: true, cur: 3 })} i={2} mine={1} />
    </View>
  ),
};
