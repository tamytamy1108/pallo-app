import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { fn } from 'storybook/test';

import { Switch } from '@/components/ui/field';
import { Spacing } from '@/constants/theme';

import { padded } from '../_support/padded';

/** 켜고 끄기 — 46×28 · 켜면 보라 · 동그라미가 옆으로. 이름이 없으면 스위치만 */
const meta = {
  title: 'UI/Switch',
  component: Switch,
  args: { value: false, label: '세션 알림', onValueChange: fn() },
  decorators: [padded],
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {};
export const On: Story = { args: { value: true } };
export const WithSub: Story = { args: { sub: '세션 1시간 전에 알려 드려요' } };
export const WithSubOn: Story = { args: { value: true, sub: '세션 1시간 전에 알려 드려요' } };
/** 이름 없이 스위치만 */
export const NoLabel: Story = { args: { label: undefined } };
export const NoLabelOn: Story = { args: { label: undefined, value: true } };
export const LongLabel: Story = { args: { label: '라운지에서 내 글에 댓글 · 좋아요가 달리면 바로 알려 주기', sub: '밤 10시부터 아침 8시까지는 조용히 모아 뒀다가 아침에 한 번에 알려 드려요.' } };

/** 눌러서 켜고 끄기 (동그라미가 미끄러지는 움직임) */
export const Interactive: Story = {
  render: function Render(args) {
    const [on, setOn] = useState(false);
    return <Switch {...args} value={on} onValueChange={setOn} />;
  },
};

export const AllVariants: Story = {
  render: (args) => (
    <View style={styles.col}>
      <Switch {...args} value={false} />
      <Switch {...args} value sub="켜진 상태" />
      <Switch {...args} label={undefined} value={false} />
      <Switch {...args} label={undefined} value />
    </View>
  ),
};

const styles = StyleSheet.create({ col: { gap: Spacing.tight } });
