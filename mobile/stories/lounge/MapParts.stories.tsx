import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import Svg from 'react-native-svg';

import { SparkPin } from '@/components/lounge/map-parts';
import { LG_C } from '@/data/lounge';

import { padded } from '../_support/padded';

/** 지도 표시 스파크 핀 — 개수 0(준비 중) · 1~5 · 작게(sm) · 확대(scale). SVG 안에서만 그려진다. */
const meta = {
  title: 'Lounge/SparkPin',
  component: SparkPin,
  args: { x: 40, y: 40, n: 3, color: LG_C.pk },
  decorators: [padded],
  render: (args) => (
    <Svg width={80} height={80}>
      <SparkPin {...args} />
    </Svg>
  ),
} satisfies Meta<typeof SparkPin>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** 0 = 준비 중 (하얀 스파크) */
export const Empty: Story = { args: { n: 0 } };
export const One: Story = { args: { n: 1, color: LG_C.pu } };
/** 많을수록 조금 커진다 (4개부터는 같은 크기) */
export const Many: Story = { args: { n: 9 } };
/** 번개 · 동아리가 같이 있을 때 작게 */
export const Small: Story = { args: { sm: true } };
export const Zoomed: Story = { args: { scale: 1.5 } };
/** 크기 비교 */
export const Compare: Story = {
  render: (args) => (
    <Svg width={320} height={80}>
      {[0, 1, 2, 3, 4, 8].map((n, i) => (
        <SparkPin key={n} {...args} n={n} x={30 + i * 50} />
      ))}
    </Svg>
  ),
};
