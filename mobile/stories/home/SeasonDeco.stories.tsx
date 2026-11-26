import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { XmasBackLayer, XmasGarland } from '@/components/home/christmas';
import { SeasonLayer } from '@/components/home/season-deco';
import { Colors } from '@/constants/theme';
import { XMAS } from '@/constants/season';

import { padded } from '../_support/padded';

/** 맵 카드 크기의 칸 (장식은 카드에 꽉 차게 깔린다) */
function Card({ children, bg = Colors.white }: { children: ReactNode; bg?: string }) {
  return <View style={StyleSheet.flatten([styles.card, { backgroundColor: bg }])}>{children}</View>;
}

/** 스터디 맵 뒤에 까는 계절 장식 — 종이 컷아웃이 위 → 아래로 떨어지며 뒤집힌다. 크리스마스는 별 · 떨어지는 장식 · 숲 · 눈 언덕 + 전구 가랜드. */
const meta = {
  title: 'Home/SeasonDeco',
  component: SeasonLayer,
  args: { season: 'spring' },
  decorators: [padded],
  render: (args) => (
    <Card>
      <SeasonLayer {...args} />
    </Card>
  ),
} satisfies Meta<typeof SeasonLayer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Spring: Story = {};
export const Summer: Story = { args: { season: 'summer' } };
export const Autumn: Story = { args: { season: 'autumn' } };
export const Winter: Story = { args: { season: 'winter' } };
/** 크리스마스 (christmas.tsx — XmasBackLayer + XmasGarland) */
export const Christmas: Story = {
  render: () => (
    <Card bg={XMAS.bg}>
      <XmasBackLayer />
      <XmasGarland />
    </Card>
  ),
};

const styles = StyleSheet.create({
  card: { height: 520, borderRadius: 26, borderWidth: 2, borderColor: Colors.ink, overflow: 'hidden' },
});
