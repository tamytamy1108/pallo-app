import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import LinkWaitScreen from '@/app/(link)/onboarding/link-wait';

import { withOnboarding } from '../../onboarding/_onb';

/**
 * 지점에서 확인 중 (/onboarding/link-wait) — 내 팔로로 · '○○점에 연동을 요청했어요!' · 진행 3칸(요청 보냄 · 확인 중 · 연동 완료) · [시작하기].
 * 뒤로 버튼은 없어요 (요청은 이미 보냈어요).
 */
const meta = {
  title: 'Pages/Link/LinkWait',
  component: LinkWaitScreen,
  parameters: { route: { pathname: '/onboarding/link-wait' } },
  globals: { userKind: 'pending' },
  beforeEach: withOnboarding({ path: 'member', branch: '하남점', color: 'purple-lash' }),
} satisfies Meta<typeof LinkWaitScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** 지점이 비어 있으면 '지점' */
export const NoBranch: Story = { beforeEach: withOnboarding({ path: 'member', branch: '' }) };
/** 캐릭터 고르기에서 노랑을 골랐을 때 */
export const YellowPalloro: Story = { beforeEach: withOnboarding({ path: 'member', branch: '잠실점', color: 'yellow' }) };
export const LongBranch: Story = { beforeEach: withOnboarding({ path: 'member', branch: '대구 달서구 상인역 2번 출구점' }) };
