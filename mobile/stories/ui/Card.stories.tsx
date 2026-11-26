import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { PText } from '@/components/ui/text';
import { Colors, Spacing } from '@/constants/theme';

import { padded } from '../_support/padded';

function Body({ title = '오늘의 스터디', sub = '20:00 · 하남점 · Lv.2' }: { title?: string; sub?: string }) {
  return (
    <>
      <PText variant="title">{title}</PText>
      <PText color={Colors.inkSub}>{sub}</PText>
    </>
  );
}

/** PALLO 카드 — 흰 바탕 · 잉크 테두리 · 하드 섀도. 색 카드 · 누르는 카드도 돼요. */
const meta = {
  title: 'UI/Card',
  component: Card,
  args: { children: <Body /> },
  decorators: [padded],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** 색 카드 (오늘 스터디 rosePink) */
export const Colored: Story = { args: { color: Colors.rosePink } };
export const Yellow: Story = { args: { color: Colors.yellow } };
/** 누르는 카드 — 누르면 그림자 자리로 쏙 내려앉아요 */
export const Pressable: Story = { args: { onPress: fn(), accessibilityLabel: '오늘의 스터디 열기' } };
export const LongText: Story = {
  args: {
    children: (
      <Body
        title="아주 긴 카드 제목이 들어가면 줄이 바뀌면서 카드가 길어져요 확인용 제목"
        sub="설명도 길게 들어가면 여러 줄로 이어져요. 카드 안 여백과 간격이 그대로인지 확인해요. 한 줄 더, 또 한 줄 더."
      />
    ),
  },
};

/** 흰 · 색 · 누르는 카드 비교 */
export const AllVariants: Story = {
  render: () => (
    <View style={styles.col}>
      <Card>
        <Body />
      </Card>
      <Card color={Colors.rosePink}>
        <Body />
      </Card>
      <Card color={Colors.lavender} onPress={fn()}>
        <Body title="누르는 카드" />
      </Card>
    </View>
  ),
};

const styles = StyleSheet.create({ col: { gap: Spacing.stack } });
