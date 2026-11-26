import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { StepPopup } from '@/components/library/step-popup';

/** 단계 시작 창 — 처음(+P 동전) · 끝낸 단계(다시 하기 · 기울어진 캐릭터) · 멈춘 곳(이어서 / 처음부터). */
const meta = {
  title: 'Library/StepPopup',
  component: StepPopup,
  args: { info: { kick: '예습 · 1-1', title: '패턴 익히기', xp: 20, done: false }, onClose: fn(), onGo: fn() },
} satisfies Meta<typeof StepPopup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Start: Story = {};
export const Done: Story = { args: { info: { kick: '본학습 · 2-1', title: '대화문 따라 하기', xp: 30, done: true } } };
export const Resume: Story = { args: { info: { kick: '복습 · 3-2', title: '상황 표현 퀴즈', xp: 15, done: false, pos: 3 } } };
/** 끝냈지만 다시 하다 멈춘 곳 — 이어서가 이긴다 */
export const DoneButPaused: Story = { args: { info: { kick: '복습 · 3-2', title: '상황 표현 퀴즈', xp: 15, done: true, pos: 5 } } };
export const LongTitle: Story = { args: { info: { kick: '예습 · 1-3', title: '아주 긴 단계 이름이 두 줄로 넘어가면 어떻게 보이는지 확인해요', xp: 20, done: false } } };
