import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { applyDevMe } from '@/components/home/dev';
import { HomeCard } from '@/components/home/home-card';

import { trialSummaryIn } from '../../.storybook/user-kinds';
import { padded } from '../_support/padded';
import { homeDevice } from './_home';

/**
 * 홈 오늘 스터디 자리 — 회원인지 · 비회원이 무엇을 기다리는지(서버 요약)에 따라 카드가 다르다.
 * 회원 · 연동 대기 · 연동 안 됨 → 출석 카드(Home/SessionCard 에 상태별로) / 다가오는 체험 → 체험 카드 / 비회원 · 앱 구독 → 둘러보기 카드.
 * 지난 체험은 서버 요약에서 빠져 카드가 사라지지만, 받아 둔 요약이 새로 고쳐지기 전까지는 'THAT'S A WRAP' 으로 보여요 (TrialAfter).
 */
const meta = {
  title: 'Home/HomeCard',
  component: HomeCard,
  args: { onOpen: fn() },
  decorators: [padded],
} satisfies Meta<typeof HomeCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Member: Story = { globals: { userKind: 'member' }, beforeEach: homeDevice() };
export const Pending: Story = { globals: { userKind: 'pending' }, beforeEach: homeDevice() };
export const Rejected: Story = { globals: { userKind: 'rejected' }, beforeEach: homeDevice() };
/** 체험 예약 · 사흘 뒤 — TRIAL · D-3 · [예약 내용 보기] */
export const TrialBefore: Story = { globals: { userKind: 'trial' }, parameters: { queries: [trialSummaryIn(3)] }, beforeEach: homeDevice({}, () => applyDevMe({ trial: '1' })) };
/** 체험 당일 (12:00, 상담 19:30) — D-DAY · 분홍 점 */
export const TrialToday: Story = { globals: { userKind: 'trial' }, parameters: { queries: [trialSummaryIn(0)] }, beforeEach: homeDevice({}, () => applyDevMe({ trial: 'today' })) };
/** 체험이 지난 뒤 — THAT'S A WRAP · [회원 등록 안내] */
export const TrialAfter: Story = { globals: { userKind: 'trial' }, parameters: { queries: [trialSummaryIn(-2)] }, beforeEach: homeDevice({}, () => applyDevMe({ trial: 'past' })) };
/** 둘러보는 비회원 — BACKSTAGE · [1과 무료로 시작하기] · 체험 / 연동 칸 */
export const Guest: Story = { globals: { userKind: 'guest' }, beforeEach: homeDevice() };
/** 앱 구독만 — 둘러보기 카드와 같다 (홈 화면은 이 자리에 오늘의 목표 카드를 그림) */
export const AppOnly: Story = { globals: { userKind: 'app' }, beforeEach: homeDevice() };
