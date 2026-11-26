import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { StyleSheet, View } from 'react-native';

import { Logo } from '@/components/logo';
import { Colors, Radius, Spacing } from '@/constants/theme';

import { padded } from '../_support/padded';

/** PALLO! 워드마크 — 폭 · 색을 바꿀 수 있어요. */
const meta = {
  title: 'Shell/Logo',
  component: Logo,
  decorators: [padded],
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Large: Story = { args: { width: 260 } };
export const Purple: Story = { args: { color: Colors.purple } };
/** 어두운 바탕 위 흰 로고 (첫 화면) */
export const OnDark: Story = {
  args: { color: Colors.white, width: 160 },
  render: (args) => (
    <View style={styles.dark}>
      <Logo {...args} />
    </View>
  ),
};

const styles = StyleSheet.create({ dark: { alignSelf: 'flex-start', padding: Spacing.feed, borderRadius: Radius.card, backgroundColor: Colors.ink } });
