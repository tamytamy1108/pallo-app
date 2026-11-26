import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { DailyCard } from '@/components/challenge/cards';
import type { Challenge } from '@/data/challenge';

import { padded } from '../_support/padded';
import { challenge, chView, setup } from '../lounge/_fixtures';

const c4 = challenge('c4');
const c5 = challenge('c5');
/** 아직 시작 전 (day 0 · live 아님) */
const pre: Challenge = { ...c4, id: 'sb-pre', day: 0, start: '11.30 월 시작', name: '14일 아침 건강하게 먹기 (다음 주)' };

/**
 * 일상 챌린지 가로 카드 — 버튼 하나가 상태마다:
 * 참여하기(안 함) · 오늘 인증(참여 중) · 인증 완료(오늘 함) · 도전 신청(시작 전) · 신청 완료(시작 전 참여) · 멤버 초대(내가 연 시작 전).
 * s(챌린지 상태)는 props 라 스토리에서 바로 만든다.
 */
const meta = {
  title: 'Challenge/DailyCard',
  component: DailyCard,
  args: { p: c4, s: chView(), onCheck: fn() },
  decorators: [padded],
  beforeEach: setup(),
} satisfies Meta<typeof DailyCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 참여 안 함 — 참여하기 */
export const NotJoined: Story = {};
/** 참여 중 · 오늘 아직 — 오늘 인증 */
export const Joined: Story = { args: { p: c5 } };
/** 오늘 인증함 — 인증 완료 · 날 수 +1 */
export const CheckedToday: Story = { args: { p: c5, s: chView({ checked: { c5: true } }) } };
/** 시작 전 — 도전 신청 · 'N명 신청' · 막대 0 */
export const Upcoming: Story = { args: { p: pre } };
/** 시작 전에 신청함 — 신청 완료 */
export const UpcomingJoined: Story = { args: { p: pre, s: chView({ joined: { [pre.id]: true }, joinedNew: { [pre.id]: true } }) } };
/** 내가 연 · 시작 전 — 멤버 초대 */
export const MineUpcoming: Story = { args: { p: { ...pre, id: 'sb-mine-pre', mine: true, members: 1 } } };
/** 내가 연 · 진행 중 (참여 중 표시 없음) */
export const MineRunning: Story = { args: { p: { ...c5, id: 'sb-mine', mine: true, members: 1 } } };
/** 오늘 시작 (live · day 0) */
export const StartsToday: Story = { args: { p: { ...c4, id: 'sb-live', day: 0, live: true }, s: chView({ joined: { 'sb-live': true } }) } };
/** 끝까지 감 — 막대 분홍 */
export const Completed: Story = { args: { p: { ...challenge('c7'), day: 30 } } };
/** 대표 사진이 있는 챌린지 */
export const WithCover: Story = { args: { p: challenge('c6') } };
/** 주 N회 (회 단위) */
export const Weekly: Story = { args: { p: challenge('c11') } };
/** 방금 연 챌린지 — 노란 빛이 한 번 퍼진다 */
export const Flash: Story = { args: { p: c4, s: chView({ flash: 'c4' }) } };
/** 긴 이름 · 긴 문구 */
export const LongName: Story = { args: { p: { ...c4, id: 'sb-long', name: '매일 아침 일어나자마자 물 한 잔 마시고 영어로 오늘 할 일 세 가지 적기', pw: 'GOOD\nMORNING' } } };
/** 비회원 (모양 같음 · 누르면 회원 안내) */
export const AsGuest: Story = { globals: { userKind: 'guest' }, args: { p: c5 } };

/** 카테고리마다 왼쪽 색 칸 */
export const Categories: Story = {
  render: (args) => (
    <View style={{ gap: 14 }}>
      {['c4', 'c6', 'c7', 'c9', 'c10'].map((id) => (
        <DailyCard key={id} {...args} p={challenge(id)} />
      ))}
    </View>
  ),
};
