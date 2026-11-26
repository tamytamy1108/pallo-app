import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { StyleSheet, View } from 'react-native';

import { MemberFace } from '@/components/account/member-face';
import { MEMBERS } from '@/data/my';

import { padded } from '../_support/padded';
import { fresh } from '../my/_state';

/** 멤버 얼굴 동그라미 — 이름마다 같은 몸 색 · 좌우 뒤집힘 · 크기 · me 면 내 캐릭터. */
const meta = {
  title: 'Account/MemberFace',
  component: MemberFace,
  args: { name: '지우', color: '#8FA6DC', size: 34 },
  decorators: [padded],
  beforeEach: fresh(),
} satisfies Meta<typeof MemberFace>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Big: Story = { args: { size: 72 } };
/** 나 — 내 캐릭터 */
export const Me: Story = { args: { me: true, color: '#FFE200' } };
/** 이름별 비교 */
export const Comparison: Story = {
  render: (args) => (
    <View style={styles.row}>
      {MEMBERS.map((m) => (
        <MemberFace key={m.name} name={m.name} color={m.color} size={args.size} />
      ))}
      <MemberFace name="me" color="#FFE200" size={args.size} me />
    </View>
  ),
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
