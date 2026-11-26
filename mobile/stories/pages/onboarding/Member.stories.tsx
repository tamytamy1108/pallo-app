import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import MemberScreen from '@/app/(onboarding)/onboarding/member';

import { withOnboarding } from '../../onboarding/_onb';

/**
 * 가입 3단계 · 지점 회원이에요? (/onboarding/member) — 세 갈래 길(지점 회원 · 체험 · 앱 구경).
 * 칸을 누르면 바로 그 길로 가요. 고른 길에 따라 진행 바 칸 수만 달라져요 (앱 구경 5칸 · 나머지 4칸).
 */
const meta = {
  title: 'Pages/Onboarding/Member',
  component: MemberScreen,
  parameters: { route: { pathname: '/onboarding/member' } },
  beforeEach: withOnboarding(),
} satisfies Meta<typeof MemberScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 처음 — 길을 아직 안 고름 (3/4) */
export const Default: Story = {};
/** 지점 회원 길에서 돌아옴 (3/4) */
export const BackFromMember: Story = { beforeEach: withOnboarding({ path: 'member' }) };
/** 체험 길에서 돌아옴 (3/4) */
export const BackFromTrial: Story = { beforeEach: withOnboarding({ path: 'trial' }) };
/** 앱 구경 길에서 돌아옴 (3/5) */
export const BackFromApp: Story = { beforeEach: withOnboarding({ path: 'app' }) };
