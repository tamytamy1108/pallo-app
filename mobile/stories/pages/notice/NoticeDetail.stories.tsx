import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { noticeQuery } from '@/api/queries';
import NoticeDetailScreen from '@/app/(app)/notice/[id]';
import { NOTICE_DETAILS } from '@/data/mock';

import { LOADING_FOREVER } from '../../_support/api';

const route = (id: string) => ({ route: { params: { id }, pathname: `/notice/${id}` } });

/** 공지 상세 (/notice/[id]) — 고정한 공지 · 고정 안 한 공지 · 이미지 · 긴 본문 · 불러오는 중 · 없음 · 오류. */
const meta = {
  title: 'Pages/Notice/Detail',
  component: NoticeDetailScreen,
  parameters: route('n1'),
} satisfies Meta<typeof NoticeDetailScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 내가 고정한 공지 (위 오른쪽 '고정됨') */
export const Default: Story = {};
/** 고정 안 한 이벤트 공지 (위 오른쪽 '고정') */
export const Unpinned: Story = { parameters: route('n2') };
/** 첨부 이미지가 있는 공지 */
export const WithImage: Story = {
  parameters: {
    ...route('img'),
    queries: [[noticeQuery('img').queryKey, { ...NOTICE_DETAILS[2], id: 'img', images: [require('@/assets/characters/c-upright-yellow.png')] }]],
  },
};
/** 본문이 아주 긴 공지 */
export const LongBody: Story = {
  parameters: {
    ...route('long'),
    queries: [
      [
        noticeQuery('long').queryKey,
        {
          ...NOTICE_DETAILS[0],
          id: 'long',
          title: '아주 긴 공지 제목이 들어가면 두 줄 세 줄로 이어져도 위 줄과 겹치지 않아요 — 12월 정기 휴무 · 연말 일정 안내',
          content: Array.from({ length: 10 }, (_, i) => `${i + 1}번째 문단이에요. 연말에는 지점마다 운영 시간이 달라요. 자세한 시간은 지점 공지를 확인해 주세요.`).join('\n'),
        },
      ],
    ],
  },
};
/** 없는 공지 → '게시물을 찾을 수 없어요.' */
export const NotFound: Story = { parameters: route('nope') };
export const Loading: Story = { parameters: { api: { delayMs: LOADING_FOREVER } } };
export const Error: Story = { parameters: { api: { fail: ['notice'] } } };
