import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { fn } from 'storybook/test';

import { Chip, Pill } from '@/components/ui/pill';
import { Spacing } from '@/constants/theme';

import { padded } from '../_support/padded';

/** 작은 라벨 알약 (상태 · 분류 표시) — dark · yellow · soft. 누르는 칩은 Chip(아래 스토리). */
const meta = {
  title: 'UI/Pill',
  component: Pill,
  args: { label: '스터디 맵 · Lv.1' },
  argTypes: { variant: { control: 'inline-radio', options: ['dark', 'yellow', 'soft'] } },
  decorators: [padded],
} satisfies Meta<typeof Pill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Dark: Story = {};
export const Yellow: Story = { args: { variant: 'yellow', label: '전체 보기' } };
export const Soft: Story = { args: { variant: 'soft', label: '커밍순' } };
export const LongLabel: Story = { args: { label: '아주 긴 라벨이 들어간 알약은 한 줄로 길어져요' } };

export const AllPills: Story = {
  render: () => (
    <View style={styles.row}>
      <Pill label="dark" />
      <Pill label="yellow" variant="yellow" />
      <Pill label="soft" variant="soft" />
    </View>
  ),
};

/** 고르는 칩 — 안 고름 */
export const ChipOff: Story = { render: () => <Chip label="영어" onPress={fn()} /> };
/** 고르는 칩 — 고름 (잉크 바탕 · 흰 글자) */
export const ChipOn: Story = { render: () => <Chip label="영어" selected onPress={fn()} /> };
/** 칩 줄 — 눌러서 하나 고르기 */
export const ChipRow: Story = {
  render: function Render() {
    const [on, setOn] = useState('영어');
    return (
      <View style={styles.row}>
        {['영어', '일본어', '중국어', '스페인어'].map((l) => (
          <Chip key={l} label={l} selected={on === l} onPress={() => setOn(l)} />
        ))}
      </View>
    );
  },
};

const styles = StyleSheet.create({ row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.tight } });
