import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { LinkAdminDev } from '@/components/home/link-admin-dev';
import { simulateBranchResult } from '@/state/link-events';

import { behindSheet, homeDevice, withNote } from './_home';

/**
 * 개발용 '지점 처리 흉내' 알약 (웹 개발 모드에서만) — 연동 대기일 때 홈 왼쪽 아래. 누르면 [연동해 주기] · [못 찾음으로 처리] 시트.
 * 처리 중이면 '지점에서 처리 중…'(2.5초 뒤 결과 도착).
 */
const meta = {
  title: 'Home/LinkAdminDev',
  component: LinkAdminDev,
  decorators: [behindSheet],
  globals: { userKind: 'pending' },
} satisfies Meta<typeof LinkAdminDev>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pending: Story = { beforeEach: homeDevice() };
/** 처리 중 (2.5초 동안) — 그 뒤엔 결과가 도착해 알약이 사라짐 */
export const Processing: Story = { beforeEach: homeDevice({}, () => simulateBranchResult('linked')) };
/** 회원 — 그리지 않음 */
export const Member: Story = { globals: { userKind: 'member' }, decorators: [withNote('연동 대기가 아니면 그리지 않아요')], beforeEach: homeDevice() };
