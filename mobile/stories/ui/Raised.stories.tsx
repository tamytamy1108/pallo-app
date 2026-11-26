import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { StyleSheet, View } from 'react-native';

import { Raised } from '@/components/ui/raised';
import { PText } from '@/components/ui/text';
import { Colors, Radius, Spacing } from '@/constants/theme';

import { padded } from '../_support/padded';

function Box({ label }: { label: string }) {
  return (
    <View style={styles.box}>
      <PText variant="bodyStrong">{label}</PText>
    </View>
  );
}

/** PALLO 하드 섀도 (4px 어긋난 잉크 판). pressed 면 내용이 그림자 자리로 내려앉고, flat 이면 그림자가 없어요. */
const meta = {
  title: 'UI/Raised',
  component: Raised,
  args: { radius: Radius.card, children: <Box label="기본" /> },
  decorators: [padded],
} satisfies Meta<typeof Raised>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Pressed: Story = { args: { pressed: true, children: <Box label="눌림" /> } };
export const Flat: Story = { args: { flat: true, children: <Box label="그림자 없음" /> } };

export const AllVariants: Story = {
  render: () => (
    <View style={styles.row}>
      <Raised radius={Radius.card}>
        <Box label="기본" />
      </Raised>
      <Raised radius={Radius.card} pressed>
        <Box label="눌림" />
      </Raised>
      <Raised radius={Radius.card} flat>
        <Box label="flat" />
      </Raised>
    </View>
  ),
};

const styles = StyleSheet.create({
  box: { padding: Spacing.gutter, borderRadius: Radius.card, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow },
  row: { flexDirection: 'row', gap: Spacing.stack },
});
