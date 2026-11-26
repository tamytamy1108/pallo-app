import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { ClubAlbum } from '@/components/meet/club/club-album';

import { padded } from '../_support/padded';
import { CLUB_COND, CLUB_FREE } from './_fixtures';

/** 동아리 사진첩 탭 — 멤버는 3칸 격자 + 좋아요 수(누르면 크게), 비멤버는 6장만 흐리게. */
const meta = {
  title: 'Meet/ClubAlbum',
  component: ClubAlbum,
  args: { c: CLUB_FREE, inC: true },
  decorators: [padded],
} satisfies Meta<typeof ClubAlbum>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Member: Story = {};
export const NotMember: Story = { args: { inC: false } };
/** 다른 카테고리(북클럽) 사진 */
export const BookClub: Story = { args: { c: CLUB_COND } };
