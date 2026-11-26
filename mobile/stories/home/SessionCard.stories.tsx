import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { sendAttendance, sendRsvp } from '@/components/home/attendance';
import { SessionCard } from '@/components/home/session-card';
import { MY_LANG, MY_SLOT } from '@/data/home';
import { receiveLinkResult } from '@/state/link-events';
import { updateMe } from '@/state/me';

import { padded } from '../_support/padded';
import { homeDevice } from './_home';

/**
 * 홈 오늘 스터디 카드(클래퍼보드) — 회원 · 연동 대기 · 연동 안 됨일 때.
 * 회원 카드는 지금 시각과 내 출석 상태(components/home/attendance)로 배지 · 버튼이 바뀐다.
 * 오늘 수업: 18:00 · 20:00(내 수업) / QR 출석은 시작 30분 전 ~ 20분 후.
 */
const meta = {
  title: 'Home/SessionCard',
  component: SessionCard,
  args: { onOpen: fn() },
  decorators: [padded],
  globals: { userKind: 'member' },
} satisfies Meta<typeof SessionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** READY — 12:00, 아직 아무것도 안 함 → [사전 출석체크] */
export const Ready: Story = { beforeEach: homeDevice({ time: '12:00' }) };
/** READY · 참석 예정 — 사전 출석함 → '19:30부터 출석' (꺼짐) + [변경] */
export const Rsvp: Story = { beforeEach: homeDevice({ time: '12:00' }, () => void sendRsvp(MY_SLOT, MY_LANG)) };
/** ACTION! — 19:45, QR 창 열림 → [출석체크 하기] (빛 · 빨간 점) */
export const Action: Story = { beforeEach: homeDevice({ time: '19:45' }) };
/** ACTION! + 사전 출석한 상태 — 같은 버튼 */
export const ActionAfterRsvp: Story = { beforeEach: homeDevice({ time: '19:45' }, () => void sendRsvp(MY_SLOT, MY_LANG)) };
/** READY · 입장 완료 — 19:45 출석함 (시작 전) */
export const Entered: Story = { beforeEach: homeDevice({ time: '19:45' }, () => void sendAttendance(MY_SLOT, MY_LANG, 'story')) };
/** ON AIR — 20:05 출석 후 스터디 진행 중 → 'You're on stage.' · '진행 중 +05:00' */
export const OnAir: Story = { beforeEach: homeDevice({ time: '20:05' }, () => void sendAttendance(MY_SLOT, MY_LANG, 'story')) };
/** 오늘 수업이 모두 지난 뒤 (21:00 · 출석 안 함) — 위 칸 'NOW · ON' */
export const AfterAll: Story = { beforeEach: homeDevice({ time: '21:00' }) };

/** 연동 대기 — 라벤더 잠긴 카드 · STANDBY · 점선 버튼 */
export const Pending: Story = { globals: { userKind: 'pending' }, beforeEach: homeDevice() };
/** 연동 대기 · 긴 지점 이름 */
export const PendingLongBranch: Story = { globals: { userKind: 'pending' }, beforeEach: homeDevice({}, () => updateMe({ branch: '경기광주오포신현점' })) };
/** 연동 안 됨 — RETAKE · [다시 요청하기] */
export const Rejected: Story = { globals: { userKind: 'rejected' }, beforeEach: homeDevice() };
/** 방금 연동됨 — 잠긴 카드에 자물쇠 → 뒤집혀 원래 카드 + 말풍선 (UnlockStage, 한 번만) */
export const Unlocking: Story = { globals: { userKind: 'pending' }, beforeEach: homeDevice({}, () => receiveLinkResult('linked')) };
