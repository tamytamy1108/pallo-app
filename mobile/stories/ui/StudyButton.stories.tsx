import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { StyleSheet, View } from 'react-native';
import { fn } from 'storybook/test';

import { LgIcon } from '@/components/common/icons';
import { StudyButton } from '@/components/ui/study-button';
import { Colors, Spacing } from '@/constants/theme';

import { padded } from '../_support/padded';

/** 학습 화면 아래 알약 버튼 — 높이 54 · 아래 잉크 그림자 5. 꺼지면 회색 · 그림자 없음. */
const meta = {
  title: 'UI/StudyButton',
  component: StudyButton,
  args: { label: '확인하기', onPress: fn() },
  decorators: [padded],
} satisfies Meta<typeof StudyButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
/** 흰 버튼 · 작은 글씨 (15) */
export const WhiteSmall: Story = { args: { label: '다시 듣기', bg: Colors.white, small: true } };
/** 보라 바탕 · 흰 글씨 */
export const Purple: Story = { args: { label: '다음', bg: Colors.purple, textColor: Colors.white } };
/** 좁은 줄 (옆 여백 14) */
export const Compact: Story = { args: { label: '건너뛰기', compact: true, bg: Colors.white } };
/** 왼쪽 · 오른쪽 아이콘 */
export const WithIcons: Story = { args: { label: '보내기', left: <LgIcon name="check" size={18} />, right: <LgIcon name="send" size={18} /> } };
export const LongLabel: Story = { args: { label: '아주 긴 버튼 글자가 들어가면 어떻게 보이는지 확인해요' } };

export const AllVariants: Story = {
  render: (args) => (
    <View style={styles.col}>
      <StudyButton {...args} />
      <StudyButton {...args} disabled />
      <StudyButton {...args} bg={Colors.white} small label="다시 듣기" />
      <StudyButton {...args} bg={Colors.purple} textColor={Colors.white} label="다음" />
      <View style={styles.row}>
        <StudyButton {...args} compact bg={Colors.white} label="건너뛰기" style={styles.flex} />
        <StudyButton {...args} compact label="확인" style={styles.flex} />
      </View>
    </View>
  ),
};

const styles = StyleSheet.create({
  col: { gap: Spacing.stack },
  row: { flexDirection: 'row', gap: Spacing.tight },
  flex: { flex: 1 },
});
