import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { BoltIcon, LG_IC, LgIcon, type LgIconName, SparkIcon } from '@/components/lounge/icons';
import { PText } from '@/components/ui/text';
import { Colors } from '@/constants/theme';
import { LG_C } from '@/data/lounge';

import { padded } from '../_support/padded';

/** 라운지 아이콘 (LG_IC) — 이름마다 하나씩 · 채움 · 색 · 굵기. 노랑 번개 · 스파크 심볼도. */
const meta = {
  title: 'Lounge/Icons',
  component: LgIcon,
  args: { name: 'heart' },
  decorators: [padded],
} satisfies Meta<typeof LgIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** 좋아요 누른 하트 (분홍 채움) */
export const Filled: Story = { args: { name: 'heart', fill: LG_C.pk, size: 32 } };
export const Colored: Story = { args: { name: 'pin', color: Colors.purple, size: 32, sw: 2.6 } };

/** 전체 목록 */
export const All: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
      {(Object.keys(LG_IC) as LgIconName[]).map((n) => (
        <View key={n} style={{ width: 64, alignItems: 'center', gap: 4 }}>
          <LgIcon name={n} />
          <PText variant="small">{n}</PText>
        </View>
      ))}
    </View>
  ),
};

/** 노랑 번개 · 스파크 심볼(색마다) */
export const BoltAndSpark: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <BoltIcon />
      <BoltIcon size={24} />
      <SparkIcon color={LG_C.pu} />
      <SparkIcon color={LG_C.pk} width={24} />
      <SparkIcon color={LG_C.y} width={32} />
    </View>
  ),
};
