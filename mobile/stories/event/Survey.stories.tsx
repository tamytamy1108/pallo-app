import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';

import { surveyOf } from '@/components/event/event-model';
import { surveyDone, SurveyForm } from '@/components/event/survey';
import type { SurveyAnswers } from '@/components/meet/meet-store';
import { PText } from '@/components/ui/text';
import type { SurveyQuestion } from '@/data/events';

import { padded } from '../_support/padded';
import { ev, PARTY_ANSWERS } from './_fixtures';

/** 답을 바꿔 볼 수 있게 상태를 들고 그린다 — 아래 줄에 '필수 다 답함' 여부(surveyDone)를 같이 보여 준다. */
function Live({ questions, initial }: { questions: SurveyQuestion[]; initial: SurveyAnswers }) {
  const [a, setA] = useState(initial);
  return (
    <View style={{ gap: 12 }}>
      <SurveyForm questions={questions} answers={a} onChange={setA} />
      <PText variant="small">{surveyDone(questions, a) ? '필수 질문에 다 답했어요 → [신청] 열림' : '필수(*) 질문이 남았어요 → [신청] 막힘'}</PText>
    </View>
  );
}

const PARTY = surveyOf(ev('m2'));
const CLASS = surveyOf(ev('e3'));
const CAMP = surveyOf(ev('e4'));

/**
 * 신청 설문 — 질문 종류 셋: 하나 고르기(동그라미) · 여러 개(네모 체크) · 짧은 글. 필수는 빨간 *.
 * 파티(one · multi · text) · 클래스(one · text) · 캠프(one · one · text) 묶음.
 */
const meta = {
  title: 'Event/Survey',
  component: Live,
  args: { questions: PARTY, initial: {} },
  decorators: [padded],
} satisfies Meta<typeof Live>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 파티 · 아직 안 답함 */
export const PartyEmpty: Story = {};
/** 파티 · 다 답함 (고른 보기 굵게 · 체크 · 글) */
export const PartyAnswered: Story = { args: { initial: PARTY_ANSWERS } };
/** 파티 · 선택 질문만 답함 (필수 남음) */
export const PartyOptionalOnly: Story = { args: { initial: { 1: [2], 2: '없어요' } } };
/** 클래스 묶음 */
export const ClassSet: Story = { args: { questions: CLASS, initial: { 0: 1 } } };
/** 캠프 묶음 · 긴 글 답 */
export const CampLongText: Story = { args: { questions: CAMP, initial: { 0: 2, 1: 3, 2: '땅콩 · 우유 · 새우 알레르기가 있어요. 식사 때 따로 챙겨 주시면 감사하겠습니다!' } } };
