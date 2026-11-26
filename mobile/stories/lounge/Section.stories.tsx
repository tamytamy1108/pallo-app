import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { Section } from '@/components/lounge/section';

import { padded } from '../_support/padded';

/** 목록 위 제목 줄 — 제목만 · 작은 글씨 · 오른쪽 버튼 · 긴 제목. */
const meta = {
  title: 'Lounge/Section',
  component: Section,
  args: { title: '모집 중인 동행' },
  decorators: [padded],
} satisfies Meta<typeof Section>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TitleOnly: Story = {};
export const WithSub: Story = { args: { sub: '3개' } };
export const WithAction: Story = { args: { sub: '3개', action: { label: '동행 구하기', onPress: fn() } } };
export const LongTitle: Story = { args: { title: '해외에 있는 PALLO 사람들이 올린 이야기 모아 보기', sub: '128명', action: { label: '나도 올리기', onPress: fn() } } };
