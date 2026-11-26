import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { blockMember } from '@/components/common/report-sheet';
import { StoryRow } from '@/components/lounge/story-row';
import { LG_C, STORIES } from '@/data/lounge';
import { addStory, markSeen, setBranches } from '@/data/lounge-store';
import { getMe } from '@/state/me';

import { setup } from './_fixtures';

const myStory = () =>
  addStory({ id: 'sb-my1', who: getMe().name, av: LG_C.y, role: '', br: getMe().branch, cat: 'daily', time: '방금', h: 0, big: '오늘의 표현', ds: '24시간 동안 내 스토리로 보여요', art: [LG_C.y, 'MY'], mine: true });

/**
 * 스토리 줄 — 내 스토리 → 사람별(안 본 사람 먼저 · 칸 나뉜 노랑 테두리) → 구분선 → 카테고리 하이라이트(고정 핀 · 최근 얼굴).
 */
const meta = {
  title: 'Lounge/StoryRow',
  component: StoryRow,
  beforeEach: setup(),
} satisfies Meta<typeof StoryRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 처음 — 모두 안 봄, 내 스토리 없음 (+ 만) */
export const Default: Story = {};
/** 내 스토리 올림 — 내 얼굴에 테두리 */
export const WithMyStory: Story = { beforeEach: setup(myStory) };
/** 내 스토리 여러 개 (테두리가 칸으로 나뉨) */
export const MyStoryMany: Story = {
  beforeEach: setup(() => {
    myStory();
    addStory({ id: 'sb-my2', who: getMe().name, av: LG_C.y, role: '', br: getMe().branch, cat: 'chal', time: '방금', h: 0, big: '두 번째', ds: '', art: [LG_C.pk, '2'], mine: true });
  }),
};
/** 다 봄 — 얇은 회색 테두리 */
export const AllSeen: Story = { beforeEach: setup(() => STORIES.forEach((x) => markSeen(x.id))) };
/** 일부만 봄 — 본 사람은 뒤로 */
export const SomeSeen: Story = { beforeEach: setup(() => STORIES.filter((x) => x.who === '민준' || x.who === '하나').forEach((x) => markSeen(x.id))) };
/** 지점 거름 — 그 지점 스토리 + 전 지점 행사만 */
export const BranchFiltered: Story = { beforeEach: setup(() => setBranches(['대전 둔산점'])) };
/** 아무도 없는 지점 — 사람 줄 · 구분선 없이 내 스토리 + 전 지점 하이라이트만 */
export const EmptyBranch: Story = { beforeEach: setup(() => setBranches(['울산점'])) };
/** 차단한 사람은 안 보임 (민준 · Leo 차단) */
export const Blocked: Story = { beforeEach: setup(() => (blockMember('민준'), blockMember('Leo'))) };
