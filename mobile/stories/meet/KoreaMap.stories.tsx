import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { KoreaMap } from '@/components/meet/korea-map';
import { regionCounts } from '@/components/meet/model';
import { CLUBS, REGIONS, type Region } from '@/data/meet';

import { padded } from '../_support/padded';
import { upcomingMeet } from './_fixtures';

const MEETS = [upcomingMeet('k1', 1), upcomingMeet('k2', 2, { reg: '부산' }), upcomingMeet('k3', 3, { reg: '부산' }), upcomingMeet('k4', 4, { reg: '대구' })];
const COUNTS = regionCounts(MEETS, CLUBS, '전체');
const ZERO = Object.fromEntries(REGIONS.map(([r]) => [r, [0, 0]])) as Record<Region, [number, number]>;

/** 번개 · 동아리 지도 — 지역마다 스파크(분홍 번개 · 보라 동아리). 보기(전체/번개/동아리)와 고른 지역(확대). */
const meta = {
  title: 'Meet/KoreaMap',
  component: KoreaMap,
  args: { counts: COUNTS, mode: 'all', region: null, onRegion: fn() },
  decorators: [padded],
} satisfies Meta<typeof KoreaMap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const All: Story = {};
export const MeetOnly: Story = { args: { mode: 'meet' } };
export const ClubOnly: Story = { args: { mode: 'club' } };
/** 지역을 고름 — 2.4배 확대 */
export const RegionSelected: Story = { args: { region: '부산' } };
/** 아무 지역에도 없음 */
export const Empty: Story = { args: { counts: ZERO } };
