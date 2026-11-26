import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { userEvent, within } from 'storybook/test';

import OnboardingWhy from '@/app/(onboarding)/onboarding/why';
import { WHY_REASONS } from '@/components/onboarding/app-parts';

import { LOADING_FOREVER } from '../../_support/api';
import { withOnboarding, withToast } from '../../onboarding/_onb';

/**
 * 가입 › 앱 구경 › 배우고 싶은 이유 (/onboarding/why · 5/5) — 여러 개 · 안 골라도 돼요.
 * '앱 둘러보기'가 가입을 끝내요 (useCompleteOnboarding · 가짜 API 'completeOnboarding').
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
/** 가입 끝내는 중 — 서버가 늦어도 화면은 그대로 (버튼에 따로 '보내는 중' 표시가 없어요) */
export const Completing: Story = {
  parameters: { api: { delayMs: LOADING_FOREVER } },
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('button', { name: '앱 둘러보기' }));
  },
};
/** 가입 끝내기 실패 → 오류 토스트 */
export const CompleteError: Story = {
  decorators: [withToast],
  parameters: { api: { fail: ['completeOnboarding'] } },
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('button', { name: '앱 둘러보기' }));
  },
};
