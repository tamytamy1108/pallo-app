import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { TermsCheck, TermsRow } from '@/components/onboarding/start-terms';

import { padded } from '../_support/padded';

function CheckDemo() {
  const [on, setOn] = useState(false);
  return <TermsRow label="눌러서 켜고 끄기 (켜질 때 스파크)" required on={on} onToggle={() => setOn((v) => !v)} />;
}

/** 약관 한 줄 — 체크 · [필수]/[선택] · 이름 · (전문이 있으면) › 보기 */
const meta = {
  title: 'Onboarding/TermsRow',
  component: TermsRow,
  args: { label: '서비스 이용약관', required: true, on: false, onToggle: fn(), onOpen: fn() },
  decorators: [padded],
} satisfies Meta<typeof TermsRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RequiredOff: Story = {};
export const RequiredOn: Story = { args: { on: true } };
export const OptionalOff: Story = { args: { label: '이벤트 · 번개 소식 받기', required: false } };
export const OptionalOn: Story = { args: { label: '이벤트 · 번개 소식 받기', required: false, on: true } };
/** 전문이 없는 줄 — › 없음 */
export const NoDocument: Story = { args: { label: '만 14세 이상이에요', onOpen: undefined } };
export const LongLabel: Story = { args: { label: '개인정보 제3자 제공 및 국외 이전에 관한 동의 (지점 · 결제 대행사)' } };
export const Interactive: Story = { render: () => <CheckDemo /> };

/** '전체 동의' 줄의 동그란 체크 — 꺼짐 · 켜짐 */
export const CheckCircle: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 24 }}>
      <TermsCheck on={false} />
      <TermsCheck on />
    </View>
  ),
};
