import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { MOCK_BRANCH_GUIDES, type BranchGuide } from '@/api/branch-guide';
import { branchGuidesQuery } from '@/api/queries';
import { BranchBoard } from '@/components/my/branch-board';

import { padded } from '../_support/padded';
import { fresh } from './_state';

const KEY = branchGuidesQuery().queryKey;
const [HANAM] = MOCK_BRANCH_GUIDES;

/** 지점이 아무것도 적지 않은 지점 — 주소 칸만 남아요 */
const BARE: BranchGuide = {
  ...HANAM,
  branchCode: 'BARE',
  branchName: '판교점',
  addressDetail: null,
  phone: null,
  phoneHours: null,
  openHours: null,
  parking: null,
  bankAccount: null,
  wifi: null,
  managerNotice: null,
};

/**
 * 마이 › 지점 안내 보드 — GET /me/branch-guides (연동된 지점만). 지점 고르기 · 자주 찾는 4칸 + 전체 진도 · 매니저 고정 글.
 * 협업 업체는 아직 서버에 없어 앱 안 예시(data/my BR_PARTNERS)를 지점 이름으로 붙여요.
 */
const meta = {
  title: 'My/BranchBoard',
  component: BranchBoard,
  decorators: [padded],
  beforeEach: fresh(),
} satisfies Meta<typeof BranchBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 지점 둘(하남점 · 잠실점) */
export const Default: Story = { parameters: { queries: [[KEY, MOCK_BRANCH_GUIDES]] } };
/** 둘째 지점(잠실점)을 고른 상태 — 주의사항 없음 */
export const SecondBranch: Story = {
  parameters: { queries: [[KEY, MOCK_BRANCH_GUIDES]] },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole('tab', { name: '잠실점' }));
  },
};
/** 지점 하나 — 고르기 칸 없이 'OO점 안내' */
export const OneBranch: Story = { parameters: { queries: [[KEY, [HANAM]]] } };
/** 아무것도 적지 않은 지점 — 오시는 길 칸만 */
export const NothingFilled: Story = { parameters: { queries: [[KEY, [BARE]]] } };
/** 연동된 지점이 없으면 보드를 그리지 않아요 */
export const NoBranch: Story = { parameters: { queries: [[KEY, []]] } };
/** 불러오지 못함 */
export const Failed: Story = { parameters: { api: { fail: ['branchGuides'] } } };
