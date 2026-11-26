import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { CH_ICON, ChIcon, type ChIconKey, Sparkle } from '@/components/challenge/icons';
import { PText } from '@/components/ui/text';
import { Colors } from '@/constants/theme';

import { padded } from '../_support/padded';

/** 챌린지 아이콘 (CH_ICON) — 전체 · 채움 · 반짝이. */
const meta = {
  title: 'Challenge/Icons',
  component: ChIcon,
  args: { name: 'flame' },
  decorators: [padded],
} satisfies Meta<typeof ChIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** 핫한 챌린지 불꽃 (분홍 채움) */
export const Filled: Story = { args: { fill: Colors.rosePink, width: 1.8, size: 32 } };
export const All: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
      {(Object.keys(CH_ICON) as ChIconKey[]).map((n) => (
        <View key={n} style={{ width: 64, alignItems: 'center', gap: 4 }}>
          <ChIcon name={n} />
          <PText variant="small">{n}</PText>
        </View>
      ))}
    </View>
  ),
};
/** 응원 시트 반짝이 */
export const Sparkles: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Sparkle size={18} color={Colors.yellow} />
      <Sparkle size={12} color={Colors.rosePink} />
      <Sparkle size={24} color={Colors.sky} />
    </View>
  ),
};
