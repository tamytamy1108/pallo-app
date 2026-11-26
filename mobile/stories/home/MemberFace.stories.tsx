import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { StyleSheet, View } from 'react-native';

import { MemberFace } from '@/components/home/member-face';
import { Colors } from '@/constants/theme';

import { padded } from '../_support/padded';

/** 다른 멤버 얼굴 — 동그라미 안에 꾸민 캐릭터 윗부분. 몸 색(pink · sky · purple) · 바탕색 · 크기 · 테두리 두께. */
const meta = {
  title: 'Home/MemberFace',
  component: MemberFace,
  args: { size: 48, bg: Colors.yellow, body: 'pink' },
  decorators: [padded],
} satisfies Meta<typeof MemberFace>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pink: Story = {};
export const Sky: Story = { args: { body: 'sky', bg: Colors.rosePink } };
export const Purple: Story = { args: { body: 'purple', bg: Colors.ink } };
export const LargeThickRing: Story = { args: { size: 96, ring: 3 } };
export const Small: Story = { args: { size: 24, ring: 1.5 } };

export const Compare: Story = {
  render: () => (
    <View style={styles.row}>
      <MemberFace size={48} bg={Colors.yellow} body="pink" />
      <MemberFace size={48} bg={Colors.rosePink} body="sky" />
      <MemberFace size={48} bg={Colors.ink} body="purple" />
      <MemberFace size={32} bg={Colors.sky} body="pink" />
      <MemberFace size={72} bg={Colors.lavender} body="purple" ring={3} />
    </View>
  ),
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
