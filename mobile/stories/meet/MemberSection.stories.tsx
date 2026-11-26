import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { MemberSection } from '@/components/meet/detail/detail-parts';

import { padded } from '../_support/padded';
import { CLUB_FREE, clubMembers } from './_fixtures';

/**
 * 함께하는 멤버 — 5명까지 + '모두 보기'. 참여 전엔 '참여하면 인사를 남길 수 있어요',
 * 참여했는데 인사가 없으면 입력 칸, 인사가 있으면 내 줄에 수정 · 삭제.
 */
const meta = {
  title: 'Meet/MemberSection',
  component: MemberSection,
  args: { title: '함께하는 멤버', members: clubMembers(CLUB_FREE, 4), onHi: fn(), onHiDel: fn() },
  decorators: [padded],
} satisfies Meta<typeof MemberSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 참여 전 (번개) */
export const NotJoined: Story = {};
/** 참여 전 (동아리 문구 '가입하면') */
export const NotJoinedClub: Story = { args: { title: '멤버', club: true } };
/** 참여함 · 인사 없음 — 입력 칸 */
export const JoinedNoGreeting: Story = { args: { members: clubMembers(CLUB_FREE, 5, true) } };
/** 참여함 · 인사 남김 — 수정 · 삭제 */
export const JoinedWithGreeting: Story = { args: { members: clubMembers(CLUB_FREE, 5, true, '잘 부탁드려요! 영어 대사 연습 같이 해요.') } };
/** 5명 넘음 — '멤버 n명 모두 보기' */
export const ManyMembers: Story = { args: { members: clubMembers(CLUB_FREE, 12) } };
/** 서브 호스트 표시 */
export const WithSubHost: Story = { args: { members: clubMembers(CLUB_FREE, 4, false, '', ['민서']) } };
/** 한 명 (호스트만) */
export const HostOnly: Story = { args: { members: clubMembers(CLUB_FREE, 1) } };
