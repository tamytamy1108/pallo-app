import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { ClubList } from '@/components/meet/club-list';
import { CLUBS } from '@/data/meet';

import { padded } from '../_support/padded';
import { meetState } from './_fixtures';

/** 동아리 목록 — 카테고리 아이콘 줄(없는 카테고리는 흐리게) · 정렬 · 5개 넘으면 더보기 · 비었을 때 안내. */
const meta = {
  title: 'Meet/ClubList',
  component: ClubList,
  args: { clubs: CLUBS },
  decorators: [padded],
  beforeEach: meetState(),
} satisfies Meta<typeof ClubList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 예시 동아리 전부 (11개 → 5개 + 더보기) */
export const Default: Story = {};
/** 5개 이하 — 더보기 없음 · 일부 카테고리 흐림 */
export const Few: Story = { args: { clubs: CLUBS.filter((c) => c.cc === 'drama' || c.cc === 'book') } };
export const Single: Story = { args: { clubs: CLUBS.slice(0, 1) } };
/** 동아리가 없음 — '첫 동아리를 만들어 보세요!' */
export const Empty: Story = { args: { clubs: [] } };
