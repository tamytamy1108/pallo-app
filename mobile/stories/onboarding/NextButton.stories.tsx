import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { NextButton } from '@/components/onboarding/parts';

import { padded } from '../_support/padded';

/** 가입 단계 아래 노란 버튼 (폭 가득). 꺼졌다 켜지는 순간 톡 튀고 노란 고리가 퍼져요 */
const meta = {
  title: 'Onboarding/NextButton',
  component: NextButton,
  args: { onPress: fn() },
  decorators: [padded],
} satisfies Meta<typeof NextButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const CustomLabel: Story = { args: { label: '동의하고 시작하기' } };
/** 필수 약관을 안 골랐을 때처럼 꺼져 있음 */
export const Disabled: Story = { args: { disabled: true, label: '동의하고 시작하기' } };
/** 늘 켜 둔 양식 버튼 · 아직 다 안 채움 (모양은 같고 누르면 빠진 칸으로) */
export const NotReady: Story = { args: { ready: false } };
export const Ready: Story = { args: { ready: true } };

export const AllStates: Story = {
  render: (args) => (
    <View style={{ gap: 12 }}>
      <NextButton {...args} />
      <NextButton {...args} label="체험 예약하기" ready={false} />
      <NextButton {...args} label="앱 둘러보기" ready />
      <NextButton {...args} label="동의하고 시작하기" disabled />
    </View>
  ),
};
