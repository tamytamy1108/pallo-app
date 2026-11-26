import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { Poster, posterSlides } from '@/components/meet/poster';
import { C } from '@/data/meet';

import { padded } from '../_support/padded';
import { PHOTO } from './_fixtures';

/**
 * 브랜드 색 포스터 — 무늬 4가지(동그라미 · 사선 띠 · 방울 셋 · 큰 원+캐릭터)는 id+장 번호로 정해진다.
 * 어두운 바탕(보라 · 분홍)은 노랑 글자, 밝은 바탕은 잉크 글자. 올린 사진이면 사진 + 위쪽 그늘.
 */
const meta = {
  title: 'Meet/Poster',
  component: Poster,
  args: { id: 'm1', slide: posterSlides('m1')[0], height: 220, wordSize: 36 },
  decorators: [padded],
} satisfies Meta<typeof Poster>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 예시 번개 첫 장 (분홍 · AFTER WORK BEER) */
export const Default: Story = {};
/** 무늬 4가지 — 같은 id 에서 장 번호만 바꿔 본다 */
export const Patterns: Story = {
  render: (args) => (
    <View style={{ gap: 12 }}>
      {[0, 1, 2, 3].map((v) => (
        <Poster key={v} {...args} slide={{ words: ['PATTERN', String(v)], bg: C.sky, v }} height={160} />
      ))}
    </View>
  ),
};
/** 바탕색 5가지 — 보라 · 분홍은 노랑 글자 */
export const Backgrounds: Story = {
  render: (args) => (
    <View style={{ gap: 12 }}>
      {[C.pk, C.pu, C.y, C.sky, C.lpu].map((bg) => (
        <Poster key={bg} {...args} slide={{ words: ['COLOR', bg], bg, v: 0 }} height={140} wordSize={28} />
      ))}
    </View>
  ),
};
/** 이름표가 없는 새 번개 · 새 동아리 기본 포스터 */
export const NewMeetFallback: Story = { args: { id: 'zz-new', slide: posterSlides('zz-new')[0] } };
export const NewClubFallback: Story = { args: { id: 'zz-new', slide: posterSlides('zz-new', true)[0] } };
/** 올린 포스터 사진 */
export const Uploaded: Story = { args: { slide: posterSlides('u1', false, [PHOTO])[0] } };
/** 긴 글자 · 줄 많음 */
export const LongWords: Story = { args: { slide: { words: ['SUPER', 'LONG', 'WEEKEND', 'MEETUP'], bg: C.pu, v: 0 } } };
/** 4:5 비율 (상세 화면 맨 위) */
export const AspectRatio: Story = { args: { height: undefined, aspectRatio: 4 / 5, wordSize: 54 } };
