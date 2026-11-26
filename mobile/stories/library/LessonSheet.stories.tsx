import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { LessonSheet } from '@/components/library/lesson-sheet';

import { freshDevice } from '../_support/fresh-device';
import { doneLesson, level } from './_fixtures';

/** 과 고르기 시트 — 지금 과(노랑) · 끝낸 과 '완료' · 데이터 없는 과 '커밍순'(흐림). */
const meta = {
  title: 'Library/LessonSheet',
  component: LessonSheet,
  args: { open: true, onClose: fn(), L: level(1), current: 1 },
  beforeEach: freshDevice(),
} satisfies Meta<typeof LessonSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** 1과를 끝냈고 지금은 2과 화면 */
export const WithDone: Story = { args: { current: 2 }, beforeEach: freshDevice(() => doneLesson(level(1), 1)) };
/** 토픽 레벨 (#101 …) */
export const Topic: Story = { args: { L: level(3), current: 101 } };
/** 토론 레벨 */
export const Debate: Story = { args: { L: level(4), current: 102 } };
