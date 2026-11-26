import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { noticesQuery } from '@/api/queries';
import NoticeListScreen from '@/app/(app)/notice/index';

import { LOADING_FOREVER } from '../../_support/api';

/** 공지사항 목록 화면 (/notice) — 목록 · 비었음 · 불러오는 중 · 오류. */
const meta = {
  title: 'Pages/Notice/List',
  component: NoticeListScreen,
  parameters: { route: { pathname: '/notice' } },
} satisfies Meta<typeof NoticeListScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 가짜 API 공지 목록 (고정 공지 · 새 글 점 포함) */
export const Default: Story = {};
export const Empty: Story = { parameters: { queries: [[noticesQuery().queryKey, { items: [], nextCursor: null }]] } };
export const Loading: Story = { parameters: { api: { delayMs: LOADING_FOREVER } } };
export const Error: Story = { parameters: { api: { fail: ['notices'] } } };
