import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { SaveBtn } from '@/components/meet/detail/detail-parts';

import { padded } from '../_support/padded';

/** 찜 버튼 — 꺼짐(흰) · 켜짐(연보라 + 분홍 하트). */
const meta = {
  title: 'Meet/SaveBtn',
  component: SaveBtn,
  args: { on: false, onPress: fn() },
  decorators: [padded],
} satisfies Meta<typeof SaveBtn>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {};
export const On: Story = { args: { on: true } };
export const Compare: Story = {
  render: (args) => (
    <View style={{ flexDirection: 'row', gap: 16 }}>
      <SaveBtn {...args} on={false} />
      <SaveBtn {...args} on />
    </View>
  ),
};
