import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { View } from 'react-native';

import { ToTop } from '@/components/library/to-top';

/** 맨 위로 버튼 — 스크롤을 내렸을 때만 뜬다 (화면 오른쪽 아래 고정). */
const meta = {
  title: 'Library/ToTop',
  component: ToTop,
  args: { show: true, onPress: fn() },
  decorators: [
    (Story) => (
      <View style={{ height: 300 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof ToTop>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Shown: Story = {};
/** 숨김 (투명) */
export const Hidden: Story = { args: { show: false } };
