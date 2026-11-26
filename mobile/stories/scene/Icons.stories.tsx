import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Back, Bolt, Bulb, Check, Chev, ChevDown, Clock, Coin, Headphones, Kbd, Mark, Mic, Send, Sound, Spk, XMark } from '@/components/scene/icons';
import { PText } from '@/components/ui/text';
import { Colors } from '@/constants/theme';

import { padded } from '../_support/padded';

/** 상황 장면 아이콘 (scene/icons.tsx) — 한눈에 + 켜짐/꺼짐이 있는 것(저장 표시 · 소리) */
const Cell = ({ name, children }: { name: string; children: ReactNode }) => (
  <View style={{ width: 76, alignItems: 'center', gap: 4 }}>
    <View style={{ height: 32, justifyContent: 'center' }}>{children}</View>
    <PText style={{ fontSize: 11 }}>{name}</PText>
  </View>
);

const meta = {
  title: 'Scene/Icons',
  component: Mark,
  decorators: [padded],
  args: { on: false },
} satisfies Meta<typeof Mark>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 저장 표시 (꺼짐) — 툴바 Controls 로 on 을 켜 봐요 */
export const MarkOff: Story = {};
export const MarkOn: Story = { args: { on: true } };
export const Gallery: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      <Cell name="Spk"><Spk /></Cell>
      <Cell name="Mark"><Mark /></Cell>
      <Cell name="Mark on"><Mark on /></Cell>
      <Cell name="Check"><Check /></Cell>
      <Cell name="XMark"><XMark /></Cell>
      <Cell name="Chev"><Chev /></Cell>
      <Cell name="Back"><Back /></Cell>
      <Cell name="ChevDown"><ChevDown /></Cell>
      <Cell name="Headphones"><Headphones /></Cell>
      <Cell name="Mic"><Mic /></Cell>
      <Cell name="Kbd"><Kbd /></Cell>
      <Cell name="Bulb"><Bulb /></Cell>
      <Cell name="Send"><Send /></Cell>
      <Cell name="Clock"><Clock /></Cell>
      <Cell name="Bolt"><Bolt /></Cell>
      <Cell name="Coin"><Coin /></Cell>
      <Cell name="Sound"><Sound /></Cell>
      <Cell name="Sound off"><Sound off /></Cell>
      <Cell name="색 바꿈"><Mic color={Colors.purple} size={24} /></Cell>
    </View>
  ),
};
