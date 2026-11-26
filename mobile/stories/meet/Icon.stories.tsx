import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { Bolt, Icon, SparkIcon, type IconName } from '@/components/meet/icons';
import { PText } from '@/components/ui/text';
import { C } from '@/data/meet';

import { padded } from '../_support/padded';

const NAMES: IconName[] = ['cal', 'pin', 'bolt', 'flag', 'plus', 'clock', 'users', 'crown', 'heart', 'check', 'copy', 'sms', 'back', 'send', 'shield', 'grid', 'run', 'book', 'film', 'cup', 'cmt', 'pen', 'tack', 'image', 'x', 'save', 'more', 'map'];

/** 라운지 선 아이콘 전부 + 노랑 번개 · 지도 스파크. */
const meta = {
  title: 'Meet/Icon',
  component: Icon,
  args: { name: 'heart' },
  decorators: [padded],
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {};
/** 채움 (찜 켜짐 · 호스트 왕관) */
export const Filled: Story = { args: { fill: C.pk } };
export const All: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {NAMES.map((n) => (
        <View key={n} style={{ width: 64, alignItems: 'center', gap: 4 }}>
          <Icon name={n} />
          <PText variant="small">{n}</PText>
        </View>
      ))}
    </View>
  ),
};
export const BoltAndSpark: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
      <Bolt />
      <Bolt size={24} />
      <SparkIcon color={C.pk} />
      <SparkIcon color={C.pu} width={28} />
    </View>
  ),
};
