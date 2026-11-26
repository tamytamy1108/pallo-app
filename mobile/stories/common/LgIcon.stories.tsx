import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { StyleSheet, View } from 'react-native';

import { LgIcon, type LgIconName } from '@/components/common/icons';
import { PText } from '@/components/ui/text';
import { Colors, Spacing } from '@/constants/theme';

import { padded } from '../_support/padded';

const NAMES: LgIconName[] = ['heart', 'send', 'more', 'x', 'back', 'check', 'map', 'pin', 'phone', 'cal', 'clock', 'edit', 'shield', 'sms'];

/** 라운지 아이콘 (24 격자 · 둥근 선). 채움 · 색 · 굵기를 바꿀 수 있어요. */
const meta = {
  title: 'Common/LgIcon',
  component: LgIcon,
  args: { name: 'heart' },
  argTypes: { name: { control: 'select', options: NAMES } },
  decorators: [padded],
} satisfies Meta<typeof LgIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** 채운 하트 (좋아요 누름) */
export const Filled: Story = { args: { fill: '#E5484D', color: '#E5484D' } };
export const Large: Story = { args: { name: 'map', size: 40, strokeWidth: 2.6 } };
export const Colored: Story = { args: { name: 'shield', color: Colors.purple } };

/** 모든 아이콘 */
export const AllIcons: Story = {
  render: () => (
    <View style={styles.grid}>
      {NAMES.map((n) => (
        <View key={n} style={styles.cell}>
          <LgIcon name={n} />
          <PText variant="small">{n}</PText>
        </View>
      ))}
    </View>
  ),
};

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.stack },
  cell: { width: 64, alignItems: 'center', gap: Spacing.tight / 2 },
});
