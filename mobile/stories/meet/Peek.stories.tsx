import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { Peek } from '@/components/meet/club/club-parts';
import { PText } from '@/components/ui/text';

import { padded } from '../_support/padded';

const SAMPLE = (
  <View style={{ gap: 8 }}>
    {['토요일 러닝 후기', '이번 주 장소 바뀌었어요', '가입 인사드려요!'].map((t) => (
      <PText key={t} variant="bodyStrong">
        {t}
      </PText>
    ))}
  </View>
);

/** 가입 전 흐린 미리보기 + 잠금 칸 — 게시판 · 사진첩 · 채팅 탭에서 쓴다. */
const meta = {
  title: 'Meet/Peek',
  component: Peek,
  args: { icon: 'shield', title: '글 6개 더 있어요', desc: '가입하면 공지 · 모임 후기 · 가입 인사를 모두 보고, 좋아요 · 댓글도 남길 수 있어요.', children: SAMPLE },
  decorators: [padded],
} satisfies Meta<typeof Peek>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Board: Story = {};
export const Album: Story = { args: { icon: 'image', title: '사진 9장 중 6장만 보여요', desc: '가입하면 정기 모임 사진을 모두 보고 크게 볼 수 있어요.' } };
export const Chat: Story = { args: { icon: 'cmt', title: '오늘도 대화 중이에요 · 메시지 14개', desc: '가입하면 정기 모임 공지 · 지각 연락 · 수다를 같이 나눠요.' } };
