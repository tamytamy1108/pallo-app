import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { Field } from '@/components/onboarding/parts';
import { TrialSlots, TrialWait, trialDayTiles, type TrialSlot } from '@/components/onboarding/trial-slots';

import { padded } from '../_support/padded';

const DAYS = trialDayTiles();
const OPEN: TrialSlot[] = ['10:00', '11:00', '14:00', '15:00', '19:00', '20:00'].map((time) => ({ time, full: false }));
const SOME_FULL: TrialSlot[] = OPEN.map((s, i) => ({ ...s, full: i % 2 === 0 }));
const ALL_BUT_ONE_FULL: TrialSlot[] = OPEN.map((s, i) => ({ ...s, full: i !== OPEN.length - 1 }));

function Demo() {
  const [day, setDay] = useState(DAYS[0].key);
  const [time, setTime] = useState('');
  return (
    <TrialSlots
      days={DAYS}
      day={day}
      onDay={(k) => {
        setDay(k);
        setTime('');
      }}
      slots={SOME_FULL}
      time={time}
      onTime={setTime}
      note="하남점 영어 프로님이 상담할 수 있는 시간이에요"
    />
  );
}

/** 체험 상담 날짜(내일부터 5일) · 시간(6칸, 마감은 취소선) 고르기. 지점을 고르기 전에는 점선 안내(TrialWait) */
const meta = {
  title: 'Onboarding/TrialSlots',
  component: TrialSlots,
  args: { days: DAYS, day: DAYS[0].key, onDay: fn(), slots: OPEN, time: '', onTime: fn(), note: '하남점 영어 프로님이 상담할 수 있는 시간이에요' },
  decorators: [padded],
} satisfies Meta<typeof TrialSlots>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 시간 안 고름 */
export const NoTime: Story = {};
export const TimeChosen: Story = { args: { time: '14:00' } };
/** 다른 날짜 */
export const OtherDay: Story = { args: { day: DAYS[3].key, time: '19:00' } };
/** 몇 칸 마감 */
export const SomeFull: Story = { args: { slots: SOME_FULL, time: '11:00' } };
export const AlmostAllFull: Story = { args: { slots: ALL_BUT_ONE_FULL } };
/** 눌러서 골라 보기 */
export const Interactive: Story = { render: () => <Demo /> };

/** 지점 고르기 전 안내 */
export const Wait: Story = { render: () => <TrialWait /> };
/** 시간을 안 고른 채 예약하려 할 때 — 빨간 점선 */
export const WaitInvalid: Story = {
  render: () => (
    <Field error="상담 시간을 골라 주세요">
      <TrialWait />
    </Field>
  ),
};
