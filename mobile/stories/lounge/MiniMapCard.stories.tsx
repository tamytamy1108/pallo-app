import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { MiniMapCard } from '@/components/lounge/korea-map';
import { setBranches } from '@/data/lounge-store';

import { padded } from '../_support/padded';
import { setup } from './_fixtures';

/** 추천 탭의 작은 한국 지도 — 지역별 번개 · 동아리 수(지난 번개는 빼요). 지점을 고르면 그 지점 것만. */
const meta = {
  title: 'Lounge/MiniMapCard',
  component: MiniMapCard,
  decorators: [padded],
  beforeEach: setup(),
} satisfies Meta<typeof MiniMapCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** 서울 지점만 */
export const SeoulOnly: Story = { beforeEach: setup(() => setBranches(['가산', '연신내', '영등포', '잠실점'])) };
/** 모임이 없는 지점 — 핀이 모두 '준비 중' */
export const NoSpots: Story = { beforeEach: setup(() => setBranches(['울산점'])) };
