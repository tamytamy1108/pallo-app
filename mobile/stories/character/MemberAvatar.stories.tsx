import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { StyleSheet, View } from 'react-native';

import { MemberAvatar } from '@/components/character/member-avatar';
import { PText } from '@/components/ui/text';
import { Colors, Spacing } from '@/constants/theme';
import { getMe } from '@/state/me';

import { freshDevice } from '../_support/fresh-device';
import { padded } from '../_support/padded';

const NAMES = ['하나', 'Jay', '민서', '라파', '서준', '예린', 'Kenji', '다온', '지우', '소라', 'Leo', '유키'];

/**
 * 다른 멤버의 동그란 얼굴 (avatar.tsx MemberFace) — 이름으로 늘 같은 꾸밈. 내 이름이면 내가 꾸민 모습.
 * bg 를 주면 테두리 안 바탕색을 바꿔요.
 */
const meta = {
  title: 'Character/MemberAvatar',
  component: MemberAvatar,
  args: { name: '하나' },
  decorators: [padded],
  // 내 캐릭터(기기에 남는 값)를 처음 모습으로
  beforeEach: freshDevice(),
} satisfies Meta<typeof MemberAvatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** 내 이름 — 내가 꾸민 모습 */
export const Me: Story = { render: (args) => <MemberAvatar {...args} name={getMe().name} /> };
export const Large: Story = { args: { size: 96, border: 3 } };
export const NoBorder: Story = { args: { border: 0 } };
/** 바탕색 바꾸기 */
export const CustomBg: Story = { args: { bg: Colors.lavender } };

export const Names: Story = {
  render: () => (
    <View style={styles.grid}>
      {NAMES.map((n) => (
        <View key={n} style={styles.cell}>
          <MemberAvatar name={n} size={48} />
          <PText variant="small">{n}</PText>
        </View>
      ))}
    </View>
  ),
};

export const Sizes: Story = {
  render: () => (
    <View style={styles.row}>
      {[24, 36, 48, 72, 120].map((s) => (
        <MemberAvatar key={s} name="Leo" size={s} />
      ))}
    </View>
  ),
};

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.stack },
  cell: { alignItems: 'center', gap: Spacing.tight / 2 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.stack },
});
