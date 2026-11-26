import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { DoneStage } from '@/components/onboarding/done-stage';
import { BODY_SRC } from '@/components/onboarding/start-palloro';

import { padded } from '../_support/padded';
import { withOnboarding } from './_onb';

/**
 * 체험 예약 확정 › 위쪽 무대 판 — 조명이 켜지고 내 팔로로가 떨어져 착지, 'SEE YOU / ON STAGE.'.
 * 팔로로는 캐릭터 고르기에서 고른 몸 색 (온보딩 값) · 앱 안에서는 hero 로 넘겨요.
 */
const meta = {
  title: 'Onboarding/DoneStage',
  component: DoneStage,
  args: { width: 358 },
  decorators: [padded],
  beforeEach: withOnboarding(),
} satisfies Meta<typeof DoneStage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 기본 몸 색 (보라 속눈썹) */
export const Default: Story = {};
export const YellowBody: Story = { beforeEach: withOnboarding({ color: 'yellow' }) };
export const CoralBody: Story = { beforeEach: withOnboarding({ color: 'coral' }) };
/** 앱 안 — 꾸민 몸 색을 hero 로 */
export const CustomHero: Story = { args: { hero: BODY_SRC.sky } };
/** 작은 폰 폭 */
export const Narrow: Story = { args: { width: 300 } };
