import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { StyleSheet, View } from 'react-native';
import { fn } from 'storybook/test';

import { BottomBar } from '@/components/bottom-bar';
import { Button } from '@/components/ui/button';

/** 화면 아래 고정 바 — 크림 바탕 · 위 잉크 선. 버튼이 여럿이면 칸을 똑같이 나눠요. */
const meta = {
  title: 'Shell/BottomBar',
  component: BottomBar,
  args: { children: <Button label="신청하기" wide onPress={fn()} /> },
  render: (args) => (
    <View style={styles.screen}>
      <BottomBar {...args} />
    </View>
  ),
} satisfies Meta<typeof BottomBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OneButton: Story = {};
export const TwoButtons: Story = {
  args: {
    children: [<Button key="a" label="닫기" variant="secondary" wide onPress={fn()} />, <Button key="b" label="신청하기" wide onPress={fn()} />],
  },
};
export const Disabled: Story = { args: { children: <Button label="마감됐어요" wide disabled onPress={fn()} /> } };

const styles = StyleSheet.create({ screen: { flex: 1, justifyContent: 'flex-end' } });
