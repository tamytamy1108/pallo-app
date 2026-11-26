import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import BookScreen from '@/app/(app)/book/[id]';

import { LOADING_FOREVER } from '../../_support/api';

/** 교재 소개 (/book/:id) — 잠긴 교재의 표지 · 소개 · 목차(1과만 미리 보기) · 아래 버튼 두 개. */
const meta = {
  title: 'Pages/Book',
  component: BookScreen,
  parameters: { route: { params: { id: 'en-0' }, pathname: '/book/en-0' } },
} satisfies Meta<typeof BookScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 영어 Lv.0 */
export const Default: Story = {};
/** 영어 교재 (과 목록이 있는 레벨) */
export const EnglishLevel: Story = { parameters: { route: { params: { id: 'en-2' }, pathname: '/book/en-2' } } };
/** 일본어 교재 — 일본어 목차 · 'レベル' → Lv. */
export const Japanese: Story = { parameters: { route: { params: { id: 'ja-05' }, pathname: '/book/ja-05' } } };
/** 없는 교재 id */
export const NotFound: Story = { parameters: { route: { params: { id: 'nope' }, pathname: '/book/nope' } } };
export const Loading: Story = { parameters: { api: { delayMs: LOADING_FOREVER } } };
export const Error: Story = { parameters: { api: { fail: ['books'] } } };
