import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { ClubRow } from '@/components/meet/club-list';
import { setClubState } from '@/components/meet/meet-store';
import { CLUBS } from '@/data/meet';

import { padded } from '../_support/padded';
import { CLUB_FREE, meetState, myClub, PHOTO } from './_fixtures';

/** 동아리 한 줄 — 포스터 썸네일 · 이름(+NEW) · 소개 · 카테고리 · 지점 · 멤버 수 · 최근 대화. 가입하면 멤버 +1. */
const meta = {
  title: 'Meet/ClubRow',
  component: ClubRow,
  args: { c: CLUB_FREE, first: true },
  decorators: [padded],
  beforeEach: meetState(),
} satisfies Meta<typeof ClubRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** 내가 가입함 — 멤버 수 +1 */
export const Joined: Story = { beforeEach: meetState(() => setClubState(CLUB_FREE.id, 'in')) };
/** 내가 만든 동아리 — NEW · 활동 줄도 'NEW' */
export const Mine: Story = { args: { c: myClub('u-mine') } };
/** 승인 대기 — NEW */
export const Waiting: Story = { args: { c: myClub('u-wait', true) } };
/** 올린 포스터 사진 썸네일 */
export const UploadedPoster: Story = { args: { c: { ...CLUB_FREE, id: 'u-photo', posters: [PHOTO] } } };
/** 긴 이름 · 긴 소개 */
export const LongText: Story = { args: { c: { ...CLUB_FREE, id: 'u-long', name: '퇴근 후 영화 대사 따라 하며 발음 교정까지 하는 아주 긴 이름의 동아리', memo: '매주 금요일 저녁에 모여 영화 한 장면을 골라 대사를 따라 하고, 서로 발음을 봐 줘요. 끝나고는 근처에서 간단히 밥도 먹어요.' } } };
/** 여러 줄 (첫 줄만 위 선 없음) */
export const List: Story = {
  render: () => (
    <View>
      {CLUBS.slice(0, 4).map((c, i) => (
        <ClubRow key={c.id} c={c} first={i === 0} />
      ))}
    </View>
  ),
};
