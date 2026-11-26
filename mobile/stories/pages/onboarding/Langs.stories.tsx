import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, userEvent, within } from 'storybook/test';

import OnboardingLangs from '@/app/(onboarding)/onboarding/langs';

import { withOnboarding } from '../../onboarding/_onb';

/** 가입 › 앱 구경 › 희망 언어 (/onboarding/langs · 4/5) — 여러 개 골라요. 하나도 안 고르고 '다음'이면 흔들림 · 안내 */
const meta = {
  title: 'Pages/Onboarding/Langs',
  component: OnboardingLangs,
  parameters: { route: { pathname: '/onboarding/langs' } },
  beforeEach: withOnboarding({ path: 'app' }),
} satisfies Meta<typeof OnboardingLangs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 기본 — 영어 하나 골라 둠 */
export const Default: Story = {};
export const NoneSelected: Story = { beforeEach: withOnboarding({ path: 'app', langs: [] }) };
export const SomeSelected: Story = { beforeEach: withOnboarding({ path: 'app', langs: ['ja', 'es'] }) };
export const AllSelected: Story = { beforeEach: withOnboarding({ path: 'app', langs: ['en', 'ja', 'zh', 'es'] }) };
/** 하나도 안 고르고 '다음' → 빨간 테두리 · 안내 한 줄 */
export const SubmitNone: Story = {
  beforeEach: withOnboarding({ path: 'app', langs: [] }),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(await c.findByRole('button', { name: '다음' }));
    await expect(await c.findByText('궁금한 언어를 하나 이상 골라 주세요')).toBeInTheDocument();
  },
};
/** 줄을 눌러 고름 */
export const TapChinese: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('checkbox', { name: /중국어/ }));
  },
};
