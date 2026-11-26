import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { ChangeCalendar } from '@/components/account/change-calendar';
import { addDays, CHANGE_MIN, TODAY } from '@/data/account';

import { padded } from '../_support/padded';

const MAX = new Date(2027, 1, 28);
const START = addDays(CHANGE_MIN, 3);

/**
 * 변경 신청 새 일정 달력 — 오늘 + 2주 ~ 이용권 끝나는 날만 고를 수 있다.
 * 아무것도 안 고름 · 시작일 고름 · 쉬어가기 기간 칠함 · 첫 달(이전 달 막힘) · 마지막 달(다음 달 막힘).
 */
const meta = {
  title: 'Account/ChangeCalendar',
  component: ChangeCalendar,
  args: { mon: CHANGE_MIN.getMonth(), minMon: CHANGE_MIN.getMonth(), maxMon: TODAY.getMonth() + 3, min: CHANGE_MIN, max: MAX, start: null, end: null, onMonth: fn(), onPick: fn() },
  decorators: [padded],
} satisfies Meta<typeof ChangeCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 첫 달 · 안 고름 — '‹' 막힘 · 2주 전 날짜는 흐림 */
export const FirstMonth: Story = {};
/** 시작일 고름 */
export const StartPicked: Story = { args: { start: START.getTime() } };
/** 쉬어가기 — 시작 ~ 끝 칠함 */
export const RestRange: Story = { args: { start: START.getTime(), end: addDays(START, 13) } };
/** 가운데 달 — 앞뒤 모두 갈 수 있음 */
export const MiddleMonth: Story = { args: { mon: CHANGE_MIN.getMonth() + 1 } };
/** 마지막 달 — '›' 막힘 · 끝나는 날 뒤는 흐림 */
export const LastMonth: Story = { args: { mon: TODAY.getMonth() + 3 } };
