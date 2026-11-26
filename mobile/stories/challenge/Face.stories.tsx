import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { Face } from '@/components/challenge/face';

import { padded } from '../_support/padded';

/** 챌린지 멤버 얼굴 — 그림자(카드 위 .chav) 있음 · 없음 · 크기. */
const meta = {
  title: 'Challenge/Face',
  component: Face,
  args: { name: '소라', size: 42 },
  decorators: [padded],
} satisfies Meta<typeof Face>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Shadow: Story = { args: { shadow: true } };
export const Sizes: Story = {
  render: (args) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {[22, 26, 38, 42].map((n) => (
        <Face key={n} {...args} size={n} />
      ))}
    </View>
  ),
};
