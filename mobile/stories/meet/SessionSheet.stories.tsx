import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { SessionSheet } from '@/components/meet/club/session-sheet';
import { setText, toggleIn } from '@/components/meet/meet-store';

import { CLUB_FREE, clubMembers, ME_ARG, meetState, session } from './_fixtures';

const ALL = clubMembers(CLUB_FREE, 9, true);

/**
 * 정기 모임 회차 상세 시트 — 아래 버튼: 가입하고 참석하기(비멤버) · 참석하기 · 남은 자리 · 참석 완료(취소) · 빈자리 알림(마감).
 * q 가 없으면 아무것도 그리지 않는다.
 */
const meta = {
  title: 'Meet/SessionSheet',
  component: SessionSheet,
  args: { c: CLUB_FREE, q: session(), inC: true, all: ALL, me: ME_ARG, onClose: fn(), onJoinClub: fn() },
  beforeEach: meetState(),
} satisfies Meta<typeof SessionSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 멤버 · 모집 중 — '참석하기 · 남은 자리 4' */
export const MemberOpen: Story = {};
/** 비멤버 — '가입하고 참석하기' */
export const NotMember: Story = { args: { inC: false } };
/** 오늘 회차 */
export const Today: Story = { args: { q: session({ k: 0 }) } };
/** 내가 참석 — '참석 완료 · 취소' · 참석 멤버에 나 */
export const Attending: Story = { args: { q: session({ me: true, cur: 5 }) } };
/** 참석 · 한마디 남김 */
export const AttendingWithNote: Story = { args: { q: session({ me: true, cur: 5 }) }, beforeEach: meetState(() => setText('shi', 'cl5@s', '10분 늦을 것 같아요!')) };
/** 마감 — '빈자리 알림 받기' */
export const Full: Story = { args: { q: session({ cur: 8 }) } };
/** 마감 · 빈자리 알림 켬 */
export const FullWaitlist: Story = { args: { q: session({ cur: 8 }) }, beforeEach: meetState(() => toggleIn('vac', 'cl5@s')) };
/** 닫힘 (q 없음) */
export const NoSession: Story = { args: { q: null } };
