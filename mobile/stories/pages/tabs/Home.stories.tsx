import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { userEvent, within } from 'storybook/test';

import { popupsQuery } from '@/api/queries';
import HomeScreen from '@/app/(app)/(tabs)/index';
import { sendAttendance, sendRsvp } from '@/components/home/attendance';
import { applyDevMe } from '@/components/home/dev';
import { markAllNotiRead } from '@/components/home/noti-state';
import { LAUNCH_POPUPS, MY_LANG, MY_SLOT } from '@/data/home';
import { receiveLinkResult } from '@/state/link-events';
import { updateMe } from '@/state/me';
import { markDone } from '@/state/progress';
import { recordToday } from '@/state/today-goal';

import { trialSummaryIn } from '../../../.storybook/user-kinds';
import { LOADING_FOREVER } from '../../_support/api';
import { homeDevice, NO_POPUPS, unitStepKeys } from '../../home/_home';

/**
 * 홈 탭 (/) — 로고 · 알림 종 → 인사 → 공지 띠 → 오늘 스터디 카드 → 스터디 맵 → 라운지 미리보기.
 * 오늘 스터디 카드 자리는 회원 유형에 따라 다르고(회원 · 연동 대기 · 연동 안 됨 = 출석 카드, 체험 = 체험 카드, 비회원 = 둘러보기, 앱 구독 = 오늘의 목표),
 * 회원 출석 카드는 시각 · 출석 상태에 따라 다르다. 시작 팝업은 LaunchPopup 스토리에서만 띄운다.
 */
const meta = {
  title: 'Pages/Tabs/Home',
  component: HomeScreen,
  parameters: { route: { pathname: '/' }, queries: [NO_POPUPS] },
  globals: { userKind: 'member' },
  beforeEach: homeDevice(),
} satisfies Meta<typeof HomeScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 회원 · 12:00 · 아직 출석 전 (안 읽은 알림 있음 — 종에 분홍 점) */
export const Default: Story = {};
/** 알림 모두 읽음 — 종 점 없음 */
export const AllRead: Story = { beforeEach: homeDevice({}, () => markAllNotiRead()) };
/** 회원 · 사전 출석함 */
export const MemberRsvp: Story = { beforeEach: homeDevice({}, () => void sendRsvp(MY_SLOT, MY_LANG)) };
/** 회원 · 19:45 QR 창 열림 — ACTION! */
export const MemberAction: Story = { beforeEach: homeDevice({ time: '19:45' }) };
/** 회원 · 출석 완료 (시작 전) */
export const MemberEntered: Story = { beforeEach: homeDevice({ time: '19:45' }, () => void sendAttendance(MY_SLOT, MY_LANG, 'story')) };
/** 회원 · 스터디 진행 중 — ON AIR */
export const MemberOnAir: Story = { beforeEach: homeDevice({ time: '20:10' }, () => void sendAttendance(MY_SLOT, MY_LANG, 'story')) };
/** 회원 · 19:45 [출석체크 하기] 를 눌러 출석 시트가 열린 모습 */
export const CheckinSheet: Story = {
  beforeEach: homeDevice({ time: '19:45' }),
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('button', { name: '출석체크 하기' }));
  },
};
/** 회원 · 12:00 [사전 출석체크] 시트 */
export const RsvpSheet: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('button', { name: '사전 출석체크' }));
  },
};
/** 회원 · 진도 — 1과 3단계 끝냄 */
export const MemberWithProgress: Story = { beforeEach: homeDevice({}, () => unitStepKeys(1, 1).slice(0, 3).forEach((k) => markDone(k))) };
/** 긴 닉네임 — 인사말 이름이 줄어듦 */
export const LongName: Story = { beforeEach: homeDevice({}, () => updateMe({ name: '말많은망고말많은망고' })) };

/** 연동 대기 — 잠긴 라벤더 카드 + 왼쪽 아래 개발용 '지점 처리 흉내' 알약 */
export const Pending: Story = { globals: { userKind: 'pending' } };
/** 연동 대기 → 방금 연동됨 — 잠긴 출석 카드가 풀리며 뒤집히는 순간 */
export const JustLinked: Story = { globals: { userKind: 'pending' }, beforeEach: homeDevice({}, () => receiveLinkResult('linked')) };
/** 연동 안 됨 — RETAKE · [다시 요청하기] */
export const Rejected: Story = { globals: { userKind: 'rejected' } };
/** 체험 예약 · 사흘 뒤 */
export const TrialBefore: Story = { globals: { userKind: 'trial' }, parameters: { queries: [trialSummaryIn(3)] }, beforeEach: homeDevice({}, () => applyDevMe({ trial: '1' })) };
/** 체험 당일 */
export const TrialToday: Story = { globals: { userKind: 'trial' }, parameters: { queries: [trialSummaryIn(0)] }, beforeEach: homeDevice({}, () => applyDevMe({ trial: 'today' })) };
/** 체험이 지난 뒤 */
export const TrialAfter: Story = { globals: { userKind: 'trial' }, parameters: { queries: [trialSummaryIn(-2)] }, beforeEach: homeDevice({}, () => applyDevMe({ trial: 'past' })) };
/** 앱 구독만 — 출석 카드 대신 오늘의 목표 카드 (챕터는 비회원과 같이 첫 챕터만) */
export const AppOnly: Story = { globals: { userKind: 'app' } };
/** 앱 구독 · 오늘 목표 일부 */
export const AppOnlyInProgress: Story = { globals: { userKind: 'app' }, beforeEach: homeDevice({}, () => void recordToday('story:0')) };
/** 둘러보는 비회원 — 둘러보기 카드 · 맵 둘째 챕터부터 잠김 */
export const Guest: Story = { globals: { userKind: 'guest' } };

/** 앱을 켰을 때 시작 팝업 (0.9초 뒤 · 두 개) */
export const LaunchPopup: Story = {
  parameters: { queries: [[popupsQuery().queryKey, LAUNCH_POPUPS.map((p) => ({ ...p, publishUntil: '2099-12-31T00:00:00Z' }))]] },
};
/** 불러오는 중 — 공지 띠 · 라운지 칸은 아직 없음 (나머지는 그대로) */
export const Loading: Story = { parameters: { queries: [], api: { delayMs: LOADING_FOREVER } } };
/** 오류 — 공지 띠 · 라운지 칸 · 팝업이 빠짐 (나머지는 그대로) */
export const Error: Story = { parameters: { queries: [], api: { fail: ['all'] } } };
