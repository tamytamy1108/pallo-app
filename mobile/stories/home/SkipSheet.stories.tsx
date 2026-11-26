import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { SkipSheet } from '@/components/home/skip-sheet';

import { behindSheet } from './_home';

/** 구간 건너뛰기 시트 — 구역(예습 · 본학습 · 복습)마다 색 · 남은 퀘스트 수. [테스트 보고 건너뛰기] → '채점 중…' → 1.2초 뒤 onPass. */
const meta = {
  title: 'Home/SkipSheet',
  component: SkipSheet,
  args: { stage: 0, left: 3, onClose: fn(), onPass: fn() },
  decorators: [behindSheet],
} satisfies Meta<typeof SkipSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pre: Story = {};
export const Main: Story = { args: { stage: 1, left: 6 } };
export const Post: Story = { args: { stage: 2, left: 8 } };
/** 남은 퀘스트 1개 */
export const OneLeft: Story = { args: { stage: 0, left: 1 } };
