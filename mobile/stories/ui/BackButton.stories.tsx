import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { StyleSheet, View } from 'react-native';

import { BackButton } from '@/components/ui/back-button';
import { Colors, Radius, Spacing } from '@/constants/theme';

import { padded } from '../_support/padded';

/** 모든 화면 공통 뒤로 버튼 (44×44 · ‹). onPress 가 없으면 앞 화면으로 (Storybook 에선 Actions 에 router.back 기록). */
const meta = {
  title: 'UI/BackButton',
  component: BackButton,
  args: { onPress: fn() },
  decorators: [padded],
} satisfies Meta<typeof BackButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** onPress 없이 — 앞 화면으로 가요 */
export const RouterBack: Story = { args: { onPress: undefined } };
/** 어두운 바탕 위 흰 화살표 */
export const OnDark: Story = {
  args: { color: Colors.white, label: '닫기' },
  render: (args) => (
    <View style={styles.dark}>
      <BackButton {...args} />
    </View>
  ),
};

const styles = StyleSheet.create({
  dark: { alignSelf: 'flex-start', padding: Spacing.tight, borderRadius: Radius.control, backgroundColor: Colors.ink },
});
