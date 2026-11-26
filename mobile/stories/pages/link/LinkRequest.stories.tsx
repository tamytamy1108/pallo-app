import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { userEvent, within } from 'storybook/test';

import LinkScreen from '@/app/(link)/onboarding/link';
import { updateOnboarding, type Onboarding } from '@/state/onboarding';

import { withOnboarding, withToast } from '../../onboarding/_onb';

/**
 * 지점 연동 요청 (/onboarding/link · 가입 4/4 지점 회원) — 지점(시트) · 이름 · 휴대폰 번호 + 동의 한 줄 + [연동 요청 보내기].
 * 이름 · 번호는 카카오에서 받은 값으로 미리 채워져요. 빠진 칸은 누를 때 그 칸으로 데려가 알려 줘요.
 */
const meta = {
  title: 'Pages/Link/LinkRequest',
  component: LinkScreen,
  parameters: { route: { pathname: '/onboarding/link' } },
  decorators: [withToast],
  beforeEach: withOnboarding({ path: 'member' }),
} satisfies Meta<typeof LinkScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

const fill = (patch: Partial<Onboarding>) => withOnboarding({ path: 'member', ...patch });

/** 처음 — 지점만 비어 있음 (이름 · 번호는 미리 채움) */
export const Default: Story = {};
/** 다 채움 */
export const Filled: Story = { beforeEach: fill({ branchCode: '하남점', branch: '하남점' }) };
/** 다 비어 있음 */
export const Empty: Story = { beforeEach: fill({ realName: '', phone: '' }) };
/** 빈 칸으로 보내기 → 빠진 칸 알림 */
export const SubmitMissing: Story = {
  beforeEach: fill({ realName: '', phone: '' }),
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('button', { name: '연동 요청 보내기' }));
  },
};
/** 틀린 값을 적고 칸을 떠남 → 칸 아래 빨간 안내 */
export const InvalidTouched: Story = {
  beforeEach: fill({ branchCode: '하남점', branch: '하남점', realName: '김', phone: '0101' }),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const name = await c.findByLabelText('이름, 필수, 지점에 등록한 이름');
    const phone = c.getByLabelText('휴대폰 번호, 필수');
    await userEvent.click(name);
    await userEvent.click(phone);
    await userEvent.click(name);
  },
};
/** 지점 고르기 시트 열림 */
export const BranchSheetOpen: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByText('다니는 지점을 골라요'));
  },
};
/** 입력 중 값 바꾸기 (이름이 길어요) */
export const LongName: Story = { beforeEach: () => void updateOnboarding({ path: 'member', branch: '대구 달서점', realName: '김팔로팔로팔로팔로팔로팔로팔로팔로' }) };
