import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { StyleSheet, View } from 'react-native';

import { MemberFace } from '@/components/common/member-face';
import { PText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';

import { freshDevice } from '../_support/fresh-device';
import { padded } from '../_support/padded';

const NAMES = ['하나', 'Jay', '민서', '라파', '서준', '예린', 'Kenji', '다온', '지우', '소라', 'Leo', '유키'];

/**
 * 멤버 얼굴 동그라미 (댓글 · 목록) — 이름으로 늘 같은 몸 색 · 배경 · 방향. me 면 내 꾸미기 캐릭터.
 * 지름은 댓글 38 · 답글 28 · 목록 36.
 */
const meta = {
  title: 'Common/MemberFace',
  component: MemberFace,
  args: { name: '하나' },
  decorators: [padded],
  // 꾸미기 캐릭터(기기에 남는 값)를 처음 모습으로
  beforeEach: freshDevice(),
} satisfies Meta<typeof MemberFace>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** 내 얼굴 (꾸미기 캐릭터) */
export const Me: Story = { args: { me: true } };
/** 답글 크기 28 */
export const Small: Story = { args: { size: 28 } };
export const Large: Story = { args: { size: 72, border: 3 } };
export const ThinBorder: Story = { args: { border: 1 } };

/** 이름마다 다른 모습 */
export const Names: Story = {
  render: () => (
    <View style={styles.grid}>
      <View style={styles.cell}>
        <MemberFace name="나" me />
        <PText variant="small">나</PText>
      </View>
      {NAMES.map((n) => (
        <View key={n} style={styles.cell}>
          <MemberFace name={n} />
          <PText variant="small">{n}</PText>
        </View>
      ))}
    </View>
  ),
};

/** 크기 비교 */
export const Sizes: Story = {
  render: () => (
    <View style={styles.row}>
      {[28, 36, 38, 56, 80].map((s) => (
        <MemberFace key={s} name="민서" size={s} />
      ))}
    </View>
  ),
};

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.stack },
  cell: { alignItems: 'center', gap: Spacing.tight / 2 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.stack },
});
