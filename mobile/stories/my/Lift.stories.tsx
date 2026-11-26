import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { StyleSheet, View } from 'react-native';

import { Lift } from '@/components/my/lift';
import { PText } from '@/components/ui/text';
import { Colors } from '@/constants/theme';

import { padded } from '../_support/padded';

const Chip = ({ label }: { label: string }) => (
  <View style={styles.chip}>
    <PText variant="label">{label}</PText>
  </View>
);

/** 작은 하드 섀도 — 기본 · 눌림 · 그림자 숨김 · 크기 · 색. */
const meta = {
  title: 'My/Lift',
  component: Lift,
  args: { radius: 20, children: <Chip label="팔로우" /> },
  decorators: [padded],
} satisfies Meta<typeof Lift>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** 눌림 — 그림자 쪽으로 내려앉음 */
export const Pressed: Story = { args: { pressed: true } };
/** 그림자만 숨김 (자리는 그대로) */
export const NoShadow: Story = { args: { shadow: false } };
/** 큰 그림자 (4 · 4) */
export const BigOffset: Story = { args: { x: 4, y: 4 } };
/** 아래로만 (0 · 4) */
export const DownOnly: Story = { args: { x: 0, y: 4 } };
/** 보라 그림자 */
export const PurpleShadow: Story = { args: { color: Colors.purple } };

/** 비교 */
export const Comparison: Story = {
  render: (args) => (
    <View style={styles.row}>
      <Lift {...args}>
        <Chip label="기본" />
      </Lift>
      <Lift {...args} pressed>
        <Chip label="눌림" />
      </Lift>
      <Lift {...args} shadow={false}>
        <Chip label="그림자 없음" />
      </Lift>
      <Lift {...args} x={4} y={4}>
        <Chip label="4 · 4" />
      </Lift>
      <Lift {...args} color={Colors.purple}>
        <Chip label="보라" />
      </Lift>
    </View>
  ),
};

const styles = StyleSheet.create({
  chip: { height: 40, paddingHorizontal: 16, borderRadius: 20, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
});
