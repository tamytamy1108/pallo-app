import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { SparkBurst, SparkMark } from '@/components/onboarding/fx-spark';
import { Colors } from '@/constants/theme';

import { padded } from '../_support/padded';

/** PALLO 스파크 심볼 — 진행 바 끝 · 도장 · 반짝 터지기에 써요 */
const meta = {
  title: 'Onboarding/Spark',
  component: SparkMark,
  args: { size: 40 },
  decorators: [padded],
} satisfies Meta<typeof SparkMark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** 잉크 테두리 (작게 그려도 테두리 굵기는 같아요) */
export const WithStroke: Story = { args: { stroke: Colors.ink, strokeWidth: 1.6 } };
export const Sizes: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      {[11, 20, 40, 80].map((s) => (
        <SparkMark key={s} size={s} stroke={Colors.ink} />
      ))}
    </View>
  ),
};
export const Colored: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      {[Colors.yellow, Colors.purple, Colors.white, Colors.lavender].map((c) => (
        <SparkMark key={c} size={40} color={c} stroke={Colors.ink} />
      ))}
    </View>
  ),
};
/** 반짝 터지기 — 처음 나타날 때 한 번 퍼지고 사라져요 (다시 보려면 스토리를 새로 고침) */
export const Burst: Story = {
  render: () => (
    <View style={{ height: 120 }}>
      <SparkBurst trigger={0} onMount delay={300} count={8} radius={44} size={14} style={{ left: 60, top: 60 }} />
    </View>
  ),
};
