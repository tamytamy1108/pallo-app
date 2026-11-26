import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { BranchSelect } from '@/components/lounge/branch-select';

import { padded } from '../_support/padded';
import { setup, tap } from './_fixtures';

/**
 * 지점 선택 버튼 ('전체 지점 ▾') + 시트. 고르면 노랑 바탕 · 여러 곳이면 '가산 외 1'.
 * 시트는 버튼을 눌러야 열려서 Sheet 스토리는 play 로 누른다.
 */
const meta = {
  title: 'Lounge/BranchSelect',
  component: BranchSelect,
  args: { value: '전체', onChange: fn() },
  decorators: [padded],
  beforeEach: setup(),
} satisfies Meta<typeof BranchSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const All: Story = {};
export const OneBranch: Story = { args: { value: '영등포' } };
export const ManyBranches: Story = { args: { value: '가산,연신내,영등포' } };
/** 시트 — 전체 지점 고름 (내 지점 권역이 맨 위) */
export const SheetAll: Story = { play: () => tap(/지점 선택/) };
/** 시트 — 두 곳만 고른 채로 */
export const SheetSome: Story = { args: { value: '가산,하남점' }, play: () => tap(/지점 선택/) };
