import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { loungeHighlightsQuery } from '@/api/queries';
import { LoungePreview } from '@/components/home/lounge-preview';
import { LOUNGE_HIGHLIGHTS } from '@/data/home';

import { LOADING_FOREVER } from '../_support/api';
import { withNote } from './_home';

const KEY = loungeHighlightsQuery().queryKey;

/** 홈 라운지 미리보기 — 인기 글이 2.5초마다 넘어가는 순환 슬라이드 (가운데 78% · 양옆 작고 흐리게). 받기 전 · 실패 · 0개면 칸을 그리지 않는다. */
const meta = {
  title: 'Home/LoungePreview',
  component: LoungePreview,
  decorators: [withNote('홈 라운지 미리보기')],
} satisfies Meta<typeof LoungePreview>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 가짜 API 5개 (커뮤니티 · 챌린지 · 번개 …) */
export const Default: Story = {};
/** 1개 — 옆 카드 · 넘김 없음 */
export const Single: Story = { parameters: { queries: [[KEY, LOUNGE_HIGHLIGHTS.slice(0, 1)]] } };
/** 긴 본문 · 좋아요 없음 · 사진 없음 */
export const LongText: Story = {
  parameters: {
    queries: [
      [KEY, [{ ...LOUNGE_HIGHLIGHTS[0], text: '이번 주 세션 주제는 주말 이야기! 다들 20분 동안 주말 얘기만 했어요. 다음 주에는 여행 이야기를 해 보기로 했는데 누가 사진 가져올래요? 저는 제주도 사진 잔뜩 있어요', likes: null, photos: 0 }, ...LOUNGE_HIGHLIGHTS.slice(1)]],
    ],
  },
};
export const Empty: Story = { decorators: [withNote('0개 — 칸을 그리지 않아요')], parameters: { queries: [[KEY, []]] } };
export const Loading: Story = { decorators: [withNote('받기 전 — 칸을 그리지 않아요')], parameters: { api: { delayMs: LOADING_FOREVER } } };
export const Error: Story = { decorators: [withNote('실패 — 칸을 그리지 않아요')], parameters: { api: { fail: ['loungeHighlights'] } } };
