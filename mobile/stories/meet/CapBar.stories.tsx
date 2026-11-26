import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { CapBar } from '@/components/meet/parts';
import { PText } from '@/components/ui/text';

import { padded } from '../_support/padded';

/** 인원 막대 — 보라로 차다가 정원이 차면 분홍. 정원을 넘어도 100% 에서 멈춘다. */
const meta = {
  title: 'Meet/CapBar',
  component: CapBar,
  args: { cur: 5, max: 8 },
  decorators: [padded],
} satisfies Meta<typeof CapBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = { args: { cur: 0 } };
export const Partial: Story = {};
export const Full: Story = { args: { cur: 8 } };
export const Over: Story = { args: { cur: 10 } };
export const Wide: Story = { args: { width: 140 } };
export const Compare: Story = {
  render: () => (
    <View style={{ gap: 10 }}>
      {[0, 1, 4, 7, 8].map((n) => (
        <View key={n}>
          <PText>{n} / 8</PText>
          <CapBar cur={n} max={8} width={140} />
        </View>
      ))}
    </View>
  ),
};
