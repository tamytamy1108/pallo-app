import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { MeetCard } from '@/components/meet/meet-card';
import { toggleIn } from '@/components/meet/meet-store';
import { MEETS } from '@/data/meet';

import { padded } from '../_support/padded';
import { meetState, PHOTO, upcomingMeet } from './_fixtures';

/**
 * 번개 티켓 카드 — 아래 버튼이 상태에 따라 바뀐다:
 * 참여하기(모집 중) · 참여 완료(내가 참여) · 빈자리 알림 받기/받는 중(마감) · 모집 닫기/닫음(내가 연 번개) · 후기 보기(지남).
 * 닫은 번개는 흐리게(0.75), 지난 번개는 0.8.
 */
const meta = {
  title: 'Meet/MeetCard',
  component: MeetCard,
  args: { m: upcomingMeet('s-open', 3), width: 300 },
  decorators: [padded],
  beforeEach: meetState(),
} satisfies Meta<typeof MeetCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 모집 중 · 8명 중 5명 */
export const Open: Story = {};
/** 아무도 없음 (0명) */
export const NoOneYet: Story = { args: { m: upcomingMeet('s-zero', 2, { cur: 0 }) } };
/** 오늘 (D-DAY) */
export const Today: Story = { args: { m: upcomingMeet('s-today', 0) } };
/** 내가 참여함 — 인원 +1 · '참여 완료' */
export const Joined: Story = { beforeEach: meetState(() => toggleIn('joined', 's-open')) };
/** 정원이 다 참 — '빈자리 알림 받기' (분홍 막대) */
export const Full: Story = { args: { m: upcomingMeet('s-full', 4, { cur: 8, max: 8 }) } };
/** 마감 · 빈자리 알림을 켬 */
export const FullWaitlist: Story = { args: { m: upcomingMeet('s-full', 4, { cur: 8, max: 8 }) }, beforeEach: meetState(() => toggleIn('vac', 's-full')) };
/** 마감인데 내가 참여한 자리 — '참여 완료' */
export const FullJoined: Story = { args: { m: upcomingMeet('s-full', 4, { cur: 7, max: 8 }) }, beforeEach: meetState(() => toggleIn('joined', 's-full')) };
/** 내가 연 번개 — '모집 닫기' */
export const Host: Story = { args: { m: upcomingMeet('s-mine', 5, { mine: true, host: '태미', cur: 1, max: 6 }) } };
/** 내가 연 번개 · 모집을 닫음 — 흐리게 + '모집 닫음' */
export const HostClosed: Story = { args: { m: upcomingMeet('s-mine', 5, { mine: true, closed: true, host: '태미', cur: 3, max: 6 }) } };
/** 지난 번개 — '후기 보기' · '지남' (예시 번개 m1) */
export const Past: Story = { args: { m: MEETS[0] } };
/** 올린 포스터 사진 */
export const UploadedPoster: Story = { args: { m: upcomingMeet('s-photo', 3, { posters: [PHOTO] }) } };
/** 긴 제목 · 긴 장소 — 한 줄로 잘린다 */
export const LongText: Story = { args: { m: upcomingMeet('s-long', 6, { title: '퇴근 후 영어로 수다 떨면서 수제맥주 마시고 보드게임까지 하는 아주 긴 번개', place: '영등포역 3번 출구 앞 골목 안쪽 두 번째 건물 2층 수제맥주집' }) } };
/** 좁은 폭 */
export const Narrow: Story = { args: { width: 240 } };
