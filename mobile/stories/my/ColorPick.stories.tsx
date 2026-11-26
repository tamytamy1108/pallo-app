import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { ColorPick } from '@/components/my/color-pick';
import { AV_SW, BG_SW, HAIR_SW } from '@/data/my';

import { padded } from '../_support/padded';

/** 무료 자유 색 고르기 — 지금 색이 이름이면 막대 가운데 · 추천 칸이면 그 칸 표시 · 칸에 없는 hex 면 막대만 그 색. */
const meta = {
  title: 'My/ColorPick',
  component: ColorPick,
  args: { title: '몸 색', cur: 'yellow', swatches: AV_SW, onPick: fn() },
  decorators: [padded],
} satisfies Meta<typeof ColorPick>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 색 이름(기본 색) — 점은 흰색 · 막대 가운데 */
export const NamedColor: Story = {};
/** 추천 칸 하나를 고름 */
export const SwatchSelected: Story = { args: { cur: AV_SW[6] } };
/** 칸에 없는 자유 색 */
export const CustomHex: Story = { args: { cur: '#3C9D7A' } };
/** 머리 색 칸 */
export const Hair: Story = { args: { title: '머리 색', cur: HAIR_SW[2], swatches: HAIR_SW } };
/** 배경 색 칸 (어두운 색 고름) */
export const Background: Story = { args: { title: '배경 색', cur: BG_SW[8], swatches: BG_SW } };
