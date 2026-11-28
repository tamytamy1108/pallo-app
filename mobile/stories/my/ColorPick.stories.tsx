import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { ColorPick } from '@/components/my/color-pick';
import { BG_SW, HAIR_SW } from '@/data/my';

import { padded } from '../_support/padded';

/** 무료 자유 색 고르기 (머리 색 · 배경 색) — 추천 칸이면 그 칸 표시 · 칸에 없는 hex 면 막대만 그 색. */
const meta = {
  title: 'My/ColorPick',
  component: ColorPick,
  args: { title: '머리 색', cur: HAIR_SW[2], swatches: HAIR_SW, onPick: fn() },
  decorators: [padded],
} satisfies Meta<typeof ColorPick>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 추천 칸 하나를 고름 */
export const SwatchSelected: Story = {};
/** 칸에 없는 자유 색 */
export const CustomHex: Story = { args: { cur: '#3C9D7A' } };
/** 배경 색 칸 (어두운 색 고름) */
export const Background: Story = { args: { title: '배경 색', cur: BG_SW[8], swatches: BG_SW } };
