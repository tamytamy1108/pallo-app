import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { DateStrip } from '@/components/meet/date-strip';

import { padded } from '../_support/padded';
import { upcomingMeet } from './_fixtures';

const MEETS7 = [upcomingMeet('d0', 0), upcomingMeet('d1', 1), upcomingMeet('d1b', 1), upcomingMeet('d4', 4), upcomingMeet('d12', 12)];

/** 날짜 줄 — 전체 · 오늘 · 다음 6일(번개 없는 날은 흐리게) · 더보기(달력 시트). */
const meta = {
  title: 'Meet/DateStrip',
  component: DateStrip,
  args: { meets: MEETS7, day: null, onDay: fn(), region: null },
  decorators: [padded],
} satisfies Meta<typeof DateStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 전체 고름 */
export const All: Story = {};
/** 오늘 고름 */
export const TodaySelected: Story = { args: { day: 0 } };
/** 번개가 없는 날을 고름 (흐린 날도 고를 수 있다) */
export const EmptyDaySelected: Story = { args: { day: 2 } };
/** 지역을 고른 상태 (달력 제목에 쓰인다) */
export const WithRegion: Story = { args: { region: '서울' } };
/** 번개가 하나도 없음 — 오늘~6일이 모두 흐림 */
export const NoMeets: Story = { args: { meets: [] } };
