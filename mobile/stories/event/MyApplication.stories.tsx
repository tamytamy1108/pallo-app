import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { surveyOf } from '@/components/event/event-model';
import { MyApplication } from '@/components/event/my-application';
import { surveyAnswerLines } from '@/components/event/survey';

import { padded } from '../_support/padded';
import { ev, PARTY_ANSWERS } from './_fixtures';

/** 신청 후 '내 신청' 카드 — 노쇼 안내 · 유료면 입금 계좌 · 보낸 설문 답. */
const meta = {
  title: 'Event/MyApplication',
  component: MyApplication,
  args: { e: ev('m2'), answers: surveyAnswerLines(surveyOf(ev('m2')), PARTY_ANSWERS) },
  decorators: [padded],
} satisfies Meta<typeof MyApplication>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 유료 + 설문 답 */
export const PaidWithAnswers: Story = {};
/** 유료 · 설문 없음 */
export const PaidNoSurvey: Story = { args: { e: ev('e2'), answers: [] } };
/** 무료 · 설문 없음 (계좌 없음) */
export const Free: Story = { args: { e: ev('e1'), answers: [] } };
/** 필수만 답함 (선택 질문 빈 답은 빠짐) */
export const RequiredOnly: Story = { args: { answers: surveyAnswerLines(surveyOf(ev('m2')), { 0: 2 }) } };
