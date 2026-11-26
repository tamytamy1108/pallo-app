import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { StopPopup } from '@/components/home/stop-popup';
import { LESSON_STEPS } from '@/data/mock';
import { markDone, savePos, stepKey } from '@/state/progress';

import { behindSheet, homeDevice } from './_home';

const KEY = stepKey(1, 1, LESSON_STEPS[0].id);

/** 정류장을 누르면 뜨는 가운데 팝업 — 처음 [시작하기!] +포인트 / 하다 멈춤 [이어서 하기] · [처음부터 하기] / 끝냄 [다시 하기]. */
const meta = {
  title: 'Home/StopPopup',
  component: StopPopup,
  args: { step: LESSON_STEPS[0], kicker: '예습 · 1-1', stepKeyText: KEY, onClose: fn(), onGo: fn() },
  decorators: [behindSheet],
} satisfies Meta<typeof StopPopup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Start: Story = { beforeEach: homeDevice() };
export const Resume: Story = { beforeEach: homeDevice({}, () => savePos(KEY, 3, 9)) };
export const Done: Story = { beforeEach: homeDevice({}, () => void markDone(KEY)) };
/** 긴 단계 이름 (복습 · 30초 말하기 챌린지) */
export const LongTitle: Story = {
  args: { step: LESSON_STEPS[7], kicker: '복습 · 1-1', stepKeyText: stepKey(1, 1, LESSON_STEPS[7].id) },
  beforeEach: homeDevice(),
};
