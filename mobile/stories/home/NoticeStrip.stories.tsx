import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { noticeBoardQuery } from '@/api/queries';
import { NoticeStrip } from '@/components/home/notice-strip';
import { NOTICES } from '@/data/mock';

import { LOADING_FOREVER } from '../_support/api';
import { padded } from '../_support/padded';
import { withNote } from './_home';

const KEY = noticeBoardQuery().queryKey;
const page = (items: typeof NOTICES) => ({ items, nextCursor: null });

/** 홈 Notice board 띠 — 공지 3개가 3.2초마다 옆으로 넘어간다. 받기 전 · 실패 · 0개면 띠를 그리지 않는다. */
const meta = {
  title: 'Home/NoticeStrip',
  component: NoticeStrip,
  decorators: [padded],
} satisfies Meta<typeof NoticeStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 가짜 API 앞의 3개 (공지 · 이벤트 · 새 소식) */
export const Default: Story = {};
/** 1개 — 넘어가지 않음 · 1/1 */
export const Single: Story = { parameters: { queries: [[KEY, page(NOTICES.slice(0, 1))]] } };
/** 제목이 아주 긺 — 한 줄 말줄임 */
export const LongTitle: Story = {
  parameters: { queries: [[KEY, page([{ ...NOTICES[0], title: '12월 스터디 일정 · 연말 휴무 · 보충 세션 · 이용권 자동 연장 안내 (꼭 읽어 주세요)' }])]] },
};
export const Empty: Story = { decorators: [withNote('공지 0개 — 띠를 그리지 않아요')], parameters: { queries: [[KEY, page([])]] } };
export const Loading: Story = { decorators: [withNote('받기 전 — 띠를 그리지 않아요')], parameters: { api: { delayMs: LOADING_FOREVER } } };
export const Error: Story = { decorators: [withNote('실패 — 띠를 그리지 않아요 (홈의 다른 칸은 그대로)')], parameters: { api: { fail: ['notices'] } } };
