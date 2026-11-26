import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { TreasureChest } from '@/components/home/treasure-chest';
import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';

import { padded } from '../_support/padded';

/** 보상 상자 그림 — 잠김(회색) · 닫힘(보라) · 열림(뚜껑 들림 · 보물). animated 면 열릴 때 움직인다. */
const meta = {
  title: 'Home/TreasureChest',
  component: TreasureChest,
  args: { width: 120 },
  decorators: [padded],
} satisfies Meta<typeof TreasureChest>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Locked: Story = { args: { locked: true } };
export const Ready: Story = {};
export const Open: Story = { args: { open: true } };
export const Large: Story = { args: { width: 220, open: true } };

function Toggle() {
  const [open, setOpen] = useState(false);
  return (
    <Pressable onPress={() => setOpen((o) => !o)} accessibilityRole="button" accessibilityLabel="상자 열고 닫기">
      <TreasureChest width={180} open={open} animated />
      <PText variant="small">눌러서 {open ? '닫기' : '열기'}</PText>
    </Pressable>
  );
}
/** 눌러서 열고 닫기 (animated) */
export const Toggling: Story = { render: () => <Toggle /> };

/** 세 모양 나란히 */
export const Compare: Story = {
  render: () => (
    <View style={styles.row}>
      <TreasureChest width={100} locked />
      <TreasureChest width={100} />
      <TreasureChest width={100} open />
    </View>
  ),
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 16, alignItems: 'flex-end' },
});
