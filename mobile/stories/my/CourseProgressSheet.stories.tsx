import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { CourseProgressSheet } from '@/components/my/course-progress';

import { LOADING_FOREVER } from '../_support/api';
import { fresh } from './_state';

/**
 * 교재 전체 진도 시트 (지점 안내 › 전체 진도) — 내 언어 책장(가짜 API 'books')의 레벨 칸 · 달력.
 * 책장을 아직 못 받았거나 실패하면 레벨 칸 없이 빈 시트.
 */
const meta = {
  title: 'My/CourseProgressSheet',
  component: CourseProgressSheet,
  args: { open: true, onClose: fn() },
  beforeEach: fresh(),
} satisfies Meta<typeof CourseProgressSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 영어 (내 레벨 Lv.1 먼저) */
export const English: Story = {};
/** 일본어 책장 */
export const Japanese: Story = { beforeEach: fresh({ lang: 'ja' }) };
/** 중국어 책장 */
export const Chinese: Story = { beforeEach: fresh({ lang: 'zh' }) };
/** 스페인어 책장 */
export const Spanish: Story = { beforeEach: fresh({ lang: 'es' }) };
/** 책장 불러오는 중 */
export const Loading: Story = { parameters: { api: { delayMs: LOADING_FOREVER } } };
/** 책장 못 받음 */
export const Error: Story = { parameters: { api: { fail: ['books'] } } };
