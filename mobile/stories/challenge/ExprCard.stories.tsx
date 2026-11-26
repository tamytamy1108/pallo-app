import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { ExprCard } from '@/components/challenge/cards';
import { blockMember } from '@/components/common/report-sheet';

import { padded } from '../_support/padded';
import { challenge, chView, setup } from '../lounge/_fixtures';

const c1 = challenge('c1');

/**
 * 표현 챌린지 카드 — 노랑 머리(연 사람 · 참여 중 · 남은 날 · 표현 · 뜻 · 출처) + 마지막 문장 + 프사 + [문장 쓰기].
 * 문장이 없으면 '첫 문장을 만들어 보세요'. carousel = 챌린지 탭의 옆으로 넘기는 줄(좁게 · 마지막 문장 없이).
 */
const meta = {
  title: 'Challenge/ExprCard',
  component: ExprCard,
  args: { p: c1, s: chView(), onOpen: fn() },
  decorators: [padded],
  beforeEach: setup(),
} satisfies Meta<typeof ExprCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** 참여 중 (문장을 단 적 있음) */
export const Joined: Story = { args: { s: chView({ xJoined: { c1: true } }) } };
/** 문장 없음 — 첫 문장을 만들어 보세요 */
export const NoEntries: Story = { args: { s: chView({ entries: { c1: [] } }) } };
/** 내가 연 표현 챌린지 */
export const Mine: Story = { args: { p: { ...c1, id: 'sb-mine', mine: true } } };
/** 끝남 — '끝났어요' */
export const Ended: Story = { args: { p: { ...c1, id: 'sb-end', day: 30 } } };
/** 전 지점 챌린지 · 시작 전 · 문장 많음 */
export const AllBranches: Story = { args: { p: challenge('c3') } };
/** 다른 출처 (프리토킹 세션) */
export const FreeSource: Story = { args: { p: challenge('c2') } };
/** 옆으로 넘기는 줄 안 카드 */
export const Carousel: Story = { args: { carousel: true, width: 330 } };
/** 차단한 사람 문장은 안 보임 */
export const WithBlocked: Story = { beforeEach: setup(() => ['지우', '소라', 'Leo', '하나', '유키'].forEach(blockMember)) };
/** 긴 표현 */
export const LongExpression: Story = { args: { p: { ...c1, id: 'sb-long', hl: 'I couldn’t agree with you more on that particular point', ko: '그 점에 대해서는 전적으로 동의해요 · 회의 표현' } } };
