import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, userEvent, within } from 'storybook/test';

import OnboardingWhy from '@/app/(onboarding)/onboarding/why';
import { WHY_REASONS } from '@/components/onboarding/app-parts';
import { getOnboarding } from '@/state/onboarding';

import { LOADING_FOREVER } from '../../_support/api';
import { withOnboarding } from '../../onboarding/_onb';

/**
 * 가입 › 앱 구경 › 배우고 싶은 이유 (/onboarding/why · 5/6) — 여러 개 · 안 골라도 돼요. 이유 목록은 GET /onboarding (가짜 API 'onboardingInfo').
 * '다음' → 가까운 지점(/onboarding/near). 가입을 끝내는 '앱 둘러보기'는 그 뒤 지점 안내(Pages/Onboarding/Branch)에 있어요.
 */
const meta = {
  title: 'Pages/Onboarding/Why',
  component: OnboardingWhy,
  parameters: { route: { pathname: '/onboarding/why' } },
  beforeEach: withOnboarding({ path: 'app' }),
} satisfies Meta<typeof OnboardingWhy>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 하나도 안 고름 — 그래도 버튼은 켜져 있어요 */
export const Default: Story = {};
export const SomeSelected: Story = { beforeEach: withOnboarding({ path: 'app', why: ['여행 가서 말하기', '외국인 친구'] }) };
export const AllSelected: Story = { beforeEach: withOnboarding({ path: 'app', why: [...WHY_REASONS] }) };
export const Loading: Story = { parameters: { api: { delayMs: LOADING_FOREVER } } };
/** 이유 목록을 못 받음 */
export const LoadError: Story = { parameters: { api: { fail: ['onboardingInfo'] } } };
/** '다음' → 앱 구경 길로 표시하고 가까운 지점으로 (이동은 Actions 패널의 router.push) */
export const GoNext: Story = {
  beforeEach: withOnboarding({ path: null }),
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('button', { name: '다음' }));
    await expect(getOnboarding().path).toBe('app');
  },
};
