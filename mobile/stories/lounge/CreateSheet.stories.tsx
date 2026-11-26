import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { CreateSheet } from '@/components/lounge/create-sheet';

/** 오른쪽 아래 + → '무엇을 만들까요?' 시트. 지금 보는 탭에 맞는 칸이 앞에 온다. */
const meta = {
  title: 'Lounge/CreateSheet',
  component: CreateSheet,
  args: { open: true, tab: 'all', onClose: fn(), onPick: fn(), onClosed: fn() },
} satisfies Meta<typeof CreateSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 추천 · 커뮤니티 (기본 순서: 글쓰기 먼저) */
export const Default: Story = {};
/** 번개 · 동아리 탭 — 번개 · 동아리 먼저 */
export const MeetTab: Story = { args: { tab: 'meet' } };
/** 해외 동행 탭 — 동행 · 해외 카드 먼저 */
export const TripTab: Story = { args: { tab: 'trip' } };
/** 챌린지 탭 — 챌린지 열기 먼저 */
export const ChallengeTab: Story = { args: { tab: 'chal' } };
