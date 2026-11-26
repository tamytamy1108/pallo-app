import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { JoinSheet } from '@/components/meet/detail/sheets';
import { SURVEY_LIB } from '@/data/events';

import { ahead } from './_fixtures';

const d = ahead(3);
const MEET = { id: 'j1', title: '퇴근 후 영어 맥주 번개', mon: d.mon, day: d.day, wd: `${d.w} 20:00`, place: '영등포 근처 수제맥주집', cur: 5, max: 8, host: '하나 리더', party: false };

/**
 * 참여 확인 시트 (번개 · 이벤트) — 확인 체크(+필수 설문)를 해야 버튼이 켜진다.
 * 참가비: 없음(번개) · 무료(파티) · 금액(+할인 전 금액 · 입금 계좌). 설문이 있으면 '설문 보내고 …'.
 */
const meta = {
  title: 'Meet/JoinSheet',
  component: JoinSheet,
  args: { open: true, onClose: fn(), onJoin: fn(), it: MEET },
} satisfies Meta<typeof JoinSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 번개 — 참가비 없음 · 각자 계산 */
export const Meetup: Story = {};
/** 마지막 한 자리 */
export const LastSeat: Story = { args: { it: { ...MEET, cur: 7 } } };
/** 파티(무료) — '주최' */
export const FreeParty: Story = { args: { it: { ...MEET, party: true, host: 'PALLO 본사' } } };
/** 참가비 + 할인 전 금액 + 입금 계좌 */
export const Paid: Story = { args: { it: { ...MEET, party: true, fee: 15000, fee0: 20000 }, acct: ['국민은행', '123456-01-234567', '(주)팔로'] } };
/** 설문 있음 (필수 · 여럿 고르기 · 짧은 글) */
export const WithSurvey: Story = { args: { it: { ...MEET, party: true, fee: 15000 }, acct: ['국민은행', '123456-01-234567', '(주)팔로'], questions: [SURVEY_LIB.after, SURVEY_LIB.table, SURVEY_LIB.allergy] } };
/** 닫힘 */
export const Closed: Story = { args: { open: false } };
