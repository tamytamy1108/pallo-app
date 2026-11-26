import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { ScrollView } from 'react-native';
import { fn } from 'storybook/test';

import { ClubHome } from '@/components/meet/club/club-home';
import { CLUBS } from '@/data/meet';

import { padded } from '../_support/padded';
import { CLUB_COND, CLUB_FREE, clubMembers, meetState, myClub } from './_fixtures';

const RECS = CLUBS.filter((c) => c.cc === CLUB_FREE.cc && c.id !== CLUB_FREE.id);

/** 동아리 홈 탭 — 소개 · 모임 정보 · 다가오는 정기 모임 · 호스트 소개 · 멤버 · 같은 카테고리 추천. */
const meta = {
  title: 'Meet/ClubHome',
  component: ClubHome,
  args: { c: CLUB_FREE, inC: false, members: clubMembers(CLUB_FREE, 8, false, '', ['민서']), staff: ['민서'], recs: RECS, myBranch: '잠실점', onSession: fn() },
  decorators: [
    padded,
    (Story) => (
      <ScrollView>
        <Story />
      </ScrollView>
    ),
  ],
  beforeEach: meetState(),
} satisfies Meta<typeof ClubHome>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 비멤버 — '가입하면 회차마다 참석할 수 있어요' */
export const NotMember: Story = {};
/** 멤버 · 인사 없음 */
export const Member: Story = { args: { inC: true, members: clubMembers(CLUB_FREE, 9, true, '', ['민서']) } };
/** 멤버 · 인사 남김 */
export const MemberWithGreeting: Story = { args: { inC: true, members: clubMembers(CLUB_FREE, 9, true, '대사 따라 하기 꾸준히 해 볼게요!', ['민서']) } };
/** 서브 호스트 없음 · 가입 조건 있음 */
export const NoSubHostConditional: Story = { args: { c: CLUB_COND, staff: [], members: clubMembers(CLUB_COND, 7), recs: [] } };
/** 내가 만든 동아리 — 호스트 소개글 없음 · 멤버 나 혼자 · 추천 없음 */
export const MyClub: Story = {
  render: (args) => {
    const c = myClub('u-mine');
    return <ClubHome {...args} c={c} inC={false} staff={[]} recs={[]} members={clubMembers(c, 1, true)} />;
  },
};
