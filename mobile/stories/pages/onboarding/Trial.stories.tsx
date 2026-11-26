import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, userEvent, within } from 'storybook/test';

import OnboardingTrial from '@/app/(onboarding)/onboarding/trial';

import { FILLED_TRIAL, openSlot, withOnboarding } from '../../onboarding/_onb';

/**
 * 가입 › 체험 예약 (/onboarding/trial · 4/4) — 고르는 대로 온보딩 값에 담아요 (뒤로 갔다 와도 그대로).
 * 이름 · 번호는 카카오 값으로 미리 채워져 있어요.
 */
const meta = {
  title: 'Pages/Onboarding/Trial',
  component: OnboardingTrial,
  parameters: { route: { pathname: '/onboarding/trial' } },
  beforeEach: withOnboarding({ path: 'trial' }),
} satisfies Meta<typeof OnboardingTrial>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 처음 — 지점 전 (시간 칸은 안내만) */
export const Default: Story = {};
/** 지점 고름 · 시간 아직 */
export const BranchChosen: Story = { beforeEach: withOnboarding({ path: 'trial', branchCode: '하남점', branch: '하남점' }) };
/** 시간까지 고름 */
export const SlotChosen: Story = { beforeEach: withOnboarding({ path: 'trial', branchCode: '하남점', branch: '하남점', ...openSlot('하남점') }) };
/** 이유 · 전달 사항까지 다 채움 */
export const AllFilled: Story = { beforeEach: withOnboarding({ path: 'trial', ...FILLED_TRIAL }) };
/** 이름 · 번호를 지운 채 */
export const NoContact: Story = { beforeEach: withOnboarding({ path: 'trial', realName: '', phone: '' }) };
/** 지점 없이 '체험 예약하기' → 지점 칸 빨간 안내 */
export const SubmitMissing: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(await c.findByRole('button', { name: '체험 예약하기' }));
    await expect(await c.findByText('지점을 골라 주세요')).toBeInTheDocument();
  },
};
/** 지점 칸 누름 → 지점 시트 */
export const BranchSheetOpen: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('button', { name: '지점 선택하기' }));
  },
};
