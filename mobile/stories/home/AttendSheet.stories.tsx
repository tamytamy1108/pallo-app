import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { AttendSheet } from '@/components/home/attend-sheet';
import { sendAttendance, sendRsvp } from '@/components/home/attendance';
import { MY_LANG, MY_SLOT } from '@/data/home';

import { behindSheet, homeDevice } from './_home';

/**
 * 출석 시트 — 사전 출석(rsvp) · 출석(checkin) · 출석 완료(done). 고를 수 있는 시간대는 지금 시각에 따라 바뀐다
 * (못 고르는 칸은 빗금). 언어는 처음엔 비어 있어 버튼이 꺼져 있다.
 */
const meta = {
  title: 'Home/AttendSheet',
  component: AttendSheet,
  args: { mode: 'rsvp', onClose: fn(), onConfirm: fn() },
  decorators: [behindSheet],
} satisfies Meta<typeof AttendSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 사전 출석 · 12:00 — 두 시간대 모두 '참석 알림 가능' */
export const Rsvp: Story = { beforeEach: homeDevice({ time: '12:00' }) };
/** 사전 출석 · 19:00 — 18:00 은 '출석 마감'(빗금), 20:00 만 */
export const RsvpLate: Story = { beforeEach: homeDevice({ time: '19:00' }) };
/** 출석 · 19:45 — 20:00 '지금 출석 가능', 언어 고르기 전 */
export const Checkin: Story = { args: { mode: 'checkin' }, beforeEach: homeDevice({ time: '19:45' }) };
/** 출석 · 사전 출석한 수업 — 언어가 미리 골라져 'QR 찍고 출석' 이 켜짐 */
export const CheckinAfterRsvp: Story = { args: { mode: 'checkin' }, beforeEach: homeDevice({ time: '19:45' }, () => void sendRsvp(MY_SLOT, MY_LANG)) };
/** 출석 · 12:00 — QR 창이 아직 안 열림 ('17:30부터 출석' · '19:30부터 출석') */
export const CheckinTooEarly: Story = { args: { mode: 'checkin' }, beforeEach: homeDevice({ time: '12:00' }) };
/** 출석 완료 — 도장 · 팔로 · +포인트 · 이번 주 n번째 */
export const Done: Story = { args: { mode: 'done' }, beforeEach: homeDevice({ time: '19:45' }, () => void sendAttendance(MY_SLOT, MY_LANG, 'story')) };
