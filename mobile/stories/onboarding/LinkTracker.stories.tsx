import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { LinkTracker, type LinkStep, type LinkStepState } from '@/components/onboarding/link-tracker';

import { padded } from '../_support/padded';

const steps = (a: LinkStepState, b: LinkStepState, c: LinkStepState): LinkStep[] => [
  { label: '요청 보냄', sub: '오늘 14:20', state: a },
  { label: '지점에서 확인 중', sub: '하남점', state: b },
  { label: '연동 완료', sub: '회원 기능이 열려요', state: c },
];

/** 연동 진행 표시 (세로 3칸) — 끝난 칸 보라 ✓ · 지금 칸 숨 쉬는 보라 점 · 아직 칸 회색 */
const meta = {
  title: 'Onboarding/LinkTracker',
  component: LinkTracker,
  args: { steps: steps('done', 'now', 'todo') },
  decorators: [padded],
} satisfies Meta<typeof LinkTracker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 연동 확인 중 화면 그대로 — 지점이 확인하는 중 */
export const Checking: Story = {};
/** 방금 보냄 */
export const JustSent: Story = { args: { steps: steps('now', 'todo', 'todo') } };
/** 마지막 칸 진행 중 */
export const AlmostDone: Story = { args: { steps: steps('done', 'done', 'now') } };
export const AllDone: Story = { args: { steps: steps('done', 'done', 'done') } };
export const AllTodo: Story = { args: { steps: steps('todo', 'todo', 'todo') } };
