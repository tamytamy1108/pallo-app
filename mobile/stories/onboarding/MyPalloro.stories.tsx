import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { MyPalloro } from '@/components/onboarding/start-palloro';

import { padded } from '../_support/padded';
import { withOnboarding } from './_onb';

/** 내 팔로로 — 캐릭터 고르기에서 고른 몸 색(온보딩 값)이 연동 확인 중 · 예약 확정 무대에 같이 다녀요 */
const meta = {
  title: 'Onboarding/MyPalloro',
  component: MyPalloro,
  args: { width: 180 },
  decorators: [padded],
  beforeEach: withOnboarding(),
} satisfies Meta<typeof MyPalloro>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 기본 몸 색 (보라 속눈썹) */
export const Default: Story = {};
export const Yellow: Story = { beforeEach: withOnboarding({ color: 'yellow' }) };
export const Purple: Story = { beforeEach: withOnboarding({ color: 'purple' }) };
export const Pink: Story = { beforeEach: withOnboarding({ color: 'pink' }) };
export const Sky: Story = { beforeEach: withOnboarding({ color: 'sky' }) };
export const Green: Story = { beforeEach: withOnboarding({ color: 'green' }) };
export const Coral: Story = { beforeEach: withOnboarding({ color: 'coral' }) };
/** 둥실 떠 있기 (연동 확인 중 화면) */
export const Bobbing: Story = { args: { bob: true } };
/** 나타날 때 아래에서 통 */
export const Hop: Story = { args: { hop: true, delay: 200 } };
export const Small: Story = { args: { width: 90 } };
