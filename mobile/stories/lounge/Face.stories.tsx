import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { Face } from '@/components/lounge/face';
import { getMe } from '@/state/me';

import { padded } from '../_support/padded';

/** 라운지 프로필 동그라미 — 이름마다 늘 같은 모습 · 내 이름이면 내가 꾸민 모습. */
const meta = {
  title: 'Lounge/Face',
  component: Face,
  args: { name: '하나' },
  decorators: [padded],
} satisfies Meta<typeof Face>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Other: Story = {};
/** 나 (내가 꾸민 모습) */
export const Me: Story = { render: (args) => <Face {...args} name={getMe().name} /> };
/** 동행 자리 표시 ('M' · 'S') */
export const Placeholder: Story = { args: { name: 'M' } };
export const Sizes: Story = {
  render: (args) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Face {...args} size={24} />
      <Face {...args} size={36} />
      <Face {...args} size={62} border={3} />
    </View>
  ),
};
