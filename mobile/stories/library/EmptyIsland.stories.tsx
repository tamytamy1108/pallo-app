import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { EmptyIsland } from '@/components/library/empty-island';

import { padded } from '../_support/padded';

/** 교재 · 상황 맵이 아직 없는 언어의 빈 섬 그림 — 이름표 글자만 바뀐다. */
const meta = {
  title: 'Library/EmptyIsland',
  component: EmptyIsland,
  args: { tag: '중국어 섬 · 커밍순' },
  decorators: [padded],
} satisfies Meta<typeof EmptyIsland>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 스터디 맵 (교재 없는 언어) */
export const StudyMap: Story = {};
/** 상황 맵 (맵 없는 언어) */
export const SituationMap: Story = { args: { tag: '커밍순' } };
