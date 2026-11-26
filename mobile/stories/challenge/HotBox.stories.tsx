import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { HotBox } from '@/components/challenge/cards';
import { CHALLENGES, isExpr } from '@/data/challenge';

import { padded } from '../_support/padded';
import { challenge, chView, setup } from '../lounge/_fixtures';

const daily = CHALLENGES.filter((p) => !isExpr(p));

/** 지금 핫한 챌린지 TOP 3 — 참여 · 좋아요 · 오늘 인증이 많은 순. 1위 분홍 · 2위 보라 · 3위 회색. 목록이 없으면 그리지 않는다. */
const meta = {
  title: 'Challenge/HotBox',
  component: HotBox,
  args: { list: daily, s: chView() },
  decorators: [padded],
  beforeEach: setup(),
} satisfies Meta<typeof HotBox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** 두 개뿐 */
export const TwoOnly: Story = { args: { list: [challenge('c4'), challenge('c6')] } };
/** 시작 전 챌린지 포함 (오늘 인증 대신 시작일) */
export const WithUpcoming: Story = { args: { list: [{ ...challenge('c4'), id: 'sb-pre', day: 0, start: '11.30 월 시작', members: 400 }, challenge('c6'), challenge('c7')] } };
