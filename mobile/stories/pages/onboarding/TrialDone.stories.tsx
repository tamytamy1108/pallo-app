import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { userEvent, within } from 'storybook/test';

import OnboardingTrialDone from '@/app/(onboarding)/onboarding/trial-done';

import { FILLED_TRIAL, withOnboarding, withToast } from '../../onboarding/_onb';

/**
 * 가입 › 체험 예약 확정 (/onboarding/trial-done) — '첫 무대 입장권'. 값은 온보딩 값에서 읽어요.
 * '앱 둘러보기'가 가입을 끝내요 (가짜 API 'completeOnboarding').
 */
const meta = {
  title: 'Pages/Onboarding/TrialDone',
  component: OnboardingTrialDone,
  parameters: { route: { pathname: '/onboarding/trial-done' } },
  beforeEach: withOnboarding({ path: 'trial', ...FILLED_TRIAL }),
} satisfies Meta<typeof OnboardingTrialDone>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** 전달 사항 없음 · 고른 몸 색 노랑 */
export const NoNoteYellowBody: Story = { beforeEach: withOnboarding({ path: 'trial', ...FILLED_TRIAL, note: '', color: 'yellow' }) };
/** 중국어 상담 */
export const Chinese: Story = { beforeEach: withOnboarding({ path: 'trial', ...FILLED_TRIAL, langs: ['zh'], langLabel: '중국어' }) };
/** 날짜 · 시간이 비어 있음 — '미정' */
export const Undecided: Story = { beforeEach: withOnboarding({ path: 'trial', ...FILLED_TRIAL, trialDay: '', trialTime: '' }) };
/** 가입 끝내기 실패 → 오류 토스트 */
export const CompleteError: Story = {
  decorators: [withToast],
  parameters: { api: { fail: ['completeOnboarding'] } },
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('button', { name: '앱 둘러보기' }));
  },
};
