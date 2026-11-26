import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import LinkRejectedScreen from '@/app/(link)/link-rejected';
import { updateMe } from '@/state/me';
import { resetOnboarding, updateOnboarding, type Onboarding } from '@/state/onboarding';

import { freshDevice } from '../../_support/fresh-device';

/** 가입 때 보낸 값을 맞춰요 (앞 스토리 값이 남지 않게) */
const sent = (patch: Partial<Onboarding>, me: { branch?: string } = {}) =>
  freshDevice(() => {
    resetOnboarding();
    updateOnboarding(patch);
    if (me.branch) updateMe(me);
  });

/**
 * 지점 연동 안 됨 (/link-rejected) — '○○점에서 회원 정보를 찾지 못했어요' · 지점에서 남긴 말 · 보낸 정보
 * → [고쳐서 다시 요청하기] [○○점에 전화하기] · '지금은 둘러볼게요'.
 * 지점이 남긴 말은 지점 처리 결과가 도착할 때 들어와요 (state/link-events) — 스토리는 기본 문구.
 */
const meta = {
  title: 'Pages/Link/Rejected',
  component: LinkRejectedScreen,
  parameters: { route: { pathname: '/link-rejected' } },
  globals: { userKind: 'rejected' },
  beforeEach: sent({ branch: '하남점', realName: '김서현', phone: '010-1234-5678' }),
} satisfies Meta<typeof LinkRejectedScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** 가입에서 고른 지점이 없음 → 내 지점으로 */
export const NoBranchPicked: Story = { beforeEach: sent({ branch: '' }, { branch: '부산 수영점' }) };
/** 이름 · 번호 없이 지점만 보냄 */
export const BranchOnly: Story = { beforeEach: sent({ branch: '잠실점', realName: '', phone: '' }) };
/** 긴 지점 이름 */
export const LongBranch: Story = { beforeEach: sent({ branch: '대구 달서구 상인역 2번 출구점', realName: '김서현', phone: '010-1234-5678' }) };
