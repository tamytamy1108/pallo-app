import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { ChallengeTab } from '@/components/challenge/challenge-tab';
import { CHALLENGES, getChallengeState, isExpr, toggleChecked, toggleJoin } from '@/data/challenge';

import { setup, tap } from '../lounge/_fixtures';

const daily = CHALLENGES.filter((p) => !isExpr(p));

/**
 * 라운지 '챌린지' 탭 본문 — 서브 칩(전체 · 참여 중 · 카테고리) · 핫한 TOP 3 · 표현 챌린지 줄 · 진행 중 | 참여 중 · 카드들.
 * 서브 칩은 컴포넌트 안 상태라 play 로 누른다.
 */
const meta = {
  title: 'Challenge/ChallengeTab',
  component: ChallengeTab,
  args: { branch: '전체' },
  beforeEach: setup(),
} satisfies Meta<typeof ChallengeTab>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** 지점 거름 (잠실점 + 전 지점) */
export const BranchFiltered: Story = { args: { branch: '잠실점' } };
/** 참여 중 칩 — 오늘 인증 남은 수 */
export const OnChip: Story = { play: () => tap('참여 중') };
/** 참여 중 칩 · 오늘 다 인증 */
export const OnChipAllChecked: Story = {
  beforeEach: setup(() => daily.filter((p) => getChallengeState().joined[p.id]).forEach((p) => toggleChecked(p))),
  play: () => tap('참여 중'),
};
/** 참여 중 칩 · 참여한 게 없음 — 빈 안내 */
export const OnChipEmpty: Story = {
  beforeEach: setup(() => daily.filter((p) => getChallengeState().joined[p.id]).forEach((p) => toggleJoin(p))),
  play: () => tap('참여 중'),
};
/** 표현 칩 — 표현 챌린지 찾기 */
export const ExpressionChip: Story = { play: () => tap('표현') };
/** 운동 칩 */
export const MoveChip: Story = { play: () => tap('운동') };
/** 비회원 */
export const AsGuest: Story = { globals: { userKind: 'guest' } };
