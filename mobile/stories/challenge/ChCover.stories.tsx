import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { ChCover } from '@/components/challenge/cover';
import { Colors } from '@/constants/theme';

import { padded } from '../_support/padded';
import { challenge } from '../lounge/_fixtures';

const box = { borderRadius: 14, borderWidth: 2, borderColor: Colors.ink };

/** 챌린지 네모 칸 — 대표 사진 · 없으면 배경색 + 카드 문구(칸 크기에 맞춰 글씨). words=false 는 색만. */
const meta = {
  title: 'Challenge/ChCover',
  component: ChCover,
  args: { p: challenge('c7'), size: 96, style: { width: 96, height: 96, ...box } },
  decorators: [padded],
} satisfies Meta<typeof ChCover>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 카드 문구 (10 WORDS) */
export const Words: Story = {};
/** 대표 사진 */
export const Photo: Story = { args: { p: challenge('c6') } };
/** 색만 */
export const NoWords: Story = { args: { words: false } };
/** 표현 챌린지 (표현을 두 줄로) */
export const Expression: Story = { args: { p: challenge('c1') } };
/** 긴 문구 · 작은 칸 */
export const LongWords: Story = { args: { p: { ...challenge('c7'), pw: 'SUPERLONG\nCHALLENGE' }, size: 42, style: { width: 42, height: 42, ...box } } };
/** 크기 비교 (순위 42 · 상세 58 · 카드 96) */
export const Sizes: Story = {
  render: (args) => (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
      {[42, 58, 96].map((n) => (
        <ChCover key={n} {...args} size={n} style={{ width: n, height: n, ...box }} />
      ))}
    </View>
  ),
};
/** 카테고리별 */
export const Categories: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {['c1', 'c2', 'c4', 'c7', 'c9', 'c10', 'c11', 'c12'].map((id) => (
        <ChCover key={id} p={challenge(id)} size={72} style={{ width: 72, height: 72, ...box }} />
      ))}
    </View>
  ),
};
