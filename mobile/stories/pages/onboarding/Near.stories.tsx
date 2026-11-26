import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, userEvent, within } from 'storybook/test';

import OnboardingNear from '@/app/(onboarding)/onboarding/near';
import { getOnboarding } from '@/state/onboarding';

import { LOADING_FOREVER } from '../../_support/api';
import { withOnboarding } from '../../onboarding/_onb';

/**
 * 가입 › 앱 구경 › 나에게 가장 가까운 지점 (/onboarding/near · 6/6) — 지점은 GET /branches (가짜 API 'branchOptions').
 * 지점을 누르면 그 지점을 온보딩 값에 담고 지점 안내(/onboarding/branch)로 가요 (이동은 Actions 패널에 router.push 로 남아요).
 */
const meta = {
  title: 'Pages/Onboarding/Near',
  component: OnboardingNear,
  parameters: { route: { pathname: '/onboarding/near' } },
  beforeEach: withOnboarding({ path: 'app' }),
} satisfies Meta<typeof OnboardingNear>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** 뒤로 와서 다시 볼 때 — 앞서 고른 지점이 표시돼요 */
export const Selected: Story = { beforeEach: withOnboarding({ path: 'app', branchCode: '하남점', branch: '하남점' }) };
export const Loading: Story = { parameters: { api: { delayMs: LOADING_FOREVER } } };
/** 지점 목록을 못 받음 */
export const LoadError: Story = { parameters: { api: { fail: ['branchOptions'] } } };
/** 지점 하나를 누름 → 온보딩 값에 담겨요 */
export const PickBranch: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('button', { name: '잠실점' }));
    await expect(getOnboarding()).toMatchObject({ branchCode: '잠실점', branch: '잠실점' });
  },
};
