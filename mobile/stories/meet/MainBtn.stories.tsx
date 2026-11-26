import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { MainBtn, SaveBtn } from '@/components/meet/detail/detail-parts';

import { padded } from '../_support/padded';

/** 상세 아래 큰 행동 버튼 (54) — 상태마다 색이 다르다. 찜 버튼과 한 줄에 놓인다. */
const meta = {
  title: 'Meet/MainBtn',
  component: MainBtn,
  args: { label: '참여하기 · 남은 자리 3', onPress: fn() },
  decorators: [
    (Story) => (
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <SaveBtn on={false} onPress={() => {}} />
        <Story />
      </View>
    ),
    padded,
  ],
} satisfies Meta<typeof MainBtn>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Join: Story = {};
export const Joined: Story = { args: { label: '참여 완료', variant: 'done' } };
export const Waitlist: Story = { args: { label: '빈자리 알림 받기', variant: 'wh' } };
export const WaitlistOn: Story = { args: { label: '알림 받는 중', variant: 'on' } };
export const ClubJoin: Story = { args: { label: '가입하기', variant: 'pu' } };
export const Pending: Story = { args: { label: '승인 대기', variant: 'off', onPress: undefined } };
/** 늘어나지 않는 버튼 (후기 보기 · 신청 중 · 취소) */
export const NotGrow: Story = { args: { label: '후기 보기', variant: 'wh', grow: false } };
