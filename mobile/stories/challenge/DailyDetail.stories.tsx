import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { DailyDetail } from '@/components/challenge/daily-detail';
import { type Challenge, toggleChecked, toggleJoin, toggleSaved } from '@/data/challenge';

import { challenge, setup, tap } from '../lounge/_fixtures';

const c4 = challenge('c4');
const c5 = challenge('c5');
const pre: Challenge = { ...c4, id: 'sb-pre', day: 0, start: '11.30 월 시작' };

/**
 * 일상 챌린지 상세 — 진행 카드 · 이름 · 멤버 · 홈 | 인증 | 순위 탭 · 아래 고정 [찜] [참여하기 / 오늘 인증하기 / …].
 * 아래 버튼 글자: 참여하기 · 오늘 인증하기 · 오늘 인증 완료 · 도전 신청하기 · 신청 완료 · 멤버 초대.
 */
const meta = {
  title: 'Challenge/DailyDetail',
  component: DailyDetail,
  args: { p: c4 },
  beforeEach: setup(),
} satisfies Meta<typeof DailyDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 참여 안 함 (사진 인증) */
export const NotJoined: Story = {};
/** 참여 중 · 오늘 아직 (댓글 인증) */
export const Joined: Story = { args: { p: c5 } };
/** 오늘 인증 완료 */
export const CheckedToday: Story = { args: { p: c5 }, beforeEach: setup(() => void toggleChecked(c5)) };
/** 찜함 */
export const Saved: Story = { beforeEach: setup(() => void toggleSaved('c4')) };
/** 시작 전 — 도전 신청하기 */
export const Upcoming: Story = { args: { p: pre } };
/** 시작 전 신청함 */
export const UpcomingJoined: Story = { args: { p: pre }, beforeEach: setup(() => void toggleJoin(pre)) };
/** 내가 연 시작 전 — 멤버 초대 */
export const MineUpcoming: Story = { args: { p: { ...pre, id: 'sb-mine-pre', mine: true, members: 1 } } };
/** 끝까지 감 */
export const Completed: Story = { args: { p: { ...challenge('c7'), day: 30 } } };
/** 대표 사진 */
export const WithCover: Story = { args: { p: challenge('c6') } };
/** 인증 탭 */
export const FeedTab: Story = { args: { p: c5 }, play: () => tap('인증', 'tab') };
/** 순위 탭 */
export const RankTab: Story = { args: { p: c5 }, play: () => tap('순위', 'tab') };
/** 비회원 */
export const AsGuest: Story = { globals: { userKind: 'guest' } };
