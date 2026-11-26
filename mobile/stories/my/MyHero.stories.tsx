import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { MyHero } from '@/components/my/my-hero';

import { padded } from '../_support/padded';
import { followingOf, fresh } from './_state';

/**
 * 마이 맨 위 캐릭터 룸 카드 — 이름 옆 표시가 회원 유형에 따라 바뀐다:
 * 회원 '연동됨' · 연동 대기 '연동 승인 대기중' · 연동 안 됨 '연동 신청하기' 칩 · 체험 예약 · 비회원.
 * 지점 · 레벨은 지점 회원(요청 · 연동)만, 체험 예약이면 체험 지점만.
 * 스파크 · 팔로우 수는 마이 집계(GET /me/mypage) 값을 props 로 받는다 — 받기 전이면 '–'.
 */
const meta = {
  title: 'My/MyHero',
  component: MyHero,
  args: { width: 346, sparks: 1200, follow: { following: 3, followers: 4 }, onFollow: fn() },
  decorators: [padded],
  beforeEach: fresh(),
} satisfies Meta<typeof MyHero>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 회원 — '하남점 · 영어 Lv.1 · 회원' + 연동됨 */
export const Member: Story = { globals: { userKind: 'member' } };
/** 연동 대기 — 점 + '연동 승인 대기중' */
export const Pending: Story = { globals: { userKind: 'pending' } };
/** 연동 안 됨 — '연동 신청하기' 칩 */
export const Rejected: Story = { globals: { userKind: 'rejected' } };
/** 체험 예약 — 체험 지점 · '체험 예약' */
export const Trial: Story = { globals: { userKind: 'trial' } };
/** 비회원 */
export const Guest: Story = { globals: { userKind: 'guest' } };

/** 한 줄 소개 · 팔로잉 여럿 · 스파크 많음 */
export const WithBioAndFollowing: Story = {
  args: { sparks: 123456, follow: { following: 5, followers: 1280 } },
  beforeEach: fresh({ bio: '주말엔 번개, 평일엔 스터디! 영어로 수다 떨어요', following: followingOf('지우', '소라', 'Leo', '민준', '유키') }),
};
/** 긴 이름 · 긴 소개 · 일본어 */
export const LongText: Story = {
  beforeEach: fresh({ name: '아주아주긴닉네임을쓰는멤버입니다', lang: 'ja', level: 'Lv.3', bio: '한 줄 소개가 아주 길게 늘어나면 카드 안에서 몇 줄로 접히는지 확인해 보는 문장이에요. 끝까지 읽어 주세요!' }),
};
/** 스파크 0 */
export const NoSparks: Story = { args: { sparks: 0 } };
/** 마이 집계를 아직 못 받음 — '–' · 팔로우 칸 안 눌림 */
export const Loading: Story = { args: { sparks: undefined, follow: undefined } };
/** 좁은 화면 (카드 폭 300) */
export const Narrow: Story = { args: { width: 300 } };
