import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import type { StoryContext } from '@storybook/react-native-web-vite';

import ChangeScreen from '@/app/(app)/me/change';
import { CHANGE_KIND } from '@/data/account';

import { fresh } from '../../my/_state';

type Canvas = StoryContext['canvas'];
type User = StoryContext['userEvent'];

/** 종류 카드를 눌러 2단계로 */
async function pickKind(canvas: Canvas, userEvent: User, label: string) {
  await userEvent.click(await canvas.findByText(label));
}

/**
 * 연기 · 팀 · 지점 변경 신청 (/me/change) — 회원만. 1 무엇을 바꿀까요 → 2 종류별 질문 → 3 신청 확인 → 신청했어요.
 * 단계는 화면 안 상태라 play 로 눌러서 연다. 연기 · 변경 횟수는 가짜 데이터(MEMBERSHIP) 고정이라 '횟수 다 씀' 모양은 못 만든다.
 */
const meta = {
  title: 'Pages/Me/Change',
  component: ChangeScreen,
  parameters: { route: { pathname: '/me/change' } },
  beforeEach: fresh(),
} satisfies Meta<typeof ChangeScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 1. 무엇을 바꿀까요? */
export const Pick: Story = {};
/** 2. 쉬어가기 — 날짜 안 고름 ([다음] 막힘 · 안내 한 줄) */
export const RestForm: Story = { play: ({ canvas, userEvent }) => pickKind(canvas, userEvent, CHANGE_KIND.rest[0]) };
/** 2. 쉬어가기 — 가장 빠른 날 고름 */
export const RestFormReady: Story = {
  play: async ({ canvas, userEvent }) => {
    await pickKind(canvas, userEvent, CHANGE_KIND.rest[0]);
    await userEvent.click(await canvas.findByText(/가장 빠른 날/));
  },
};
/** 2. 쉬어가기 — 날짜 고르기 달력 펼침 */
export const RestCalendar: Story = {
  play: async ({ canvas, userEvent }) => {
    await pickKind(canvas, userEvent, CHANGE_KIND.rest[0]);
    await userEvent.click(await canvas.findByText('날짜 고르기'));
  },
};
/** 3. 신청 확인 */
export const RestConfirm: Story = {
  play: async ({ canvas, userEvent }) => {
    await pickKind(canvas, userEvent, CHANGE_KIND.rest[0]);
    await userEvent.click(await canvas.findByText(/가장 빠른 날/));
    await userEvent.click(await canvas.findByRole('button', { name: '다음' }));
  },
};
/** 2. 팀 바꾸기 */
export const TeamForm: Story = { play: ({ canvas, userEvent }) => pickKind(canvas, userEvent, CHANGE_KIND.team[0]) };
/** 2. 지점 옮기기 */
export const BranchForm: Story = { play: ({ canvas, userEvent }) => pickKind(canvas, userEvent, CHANGE_KIND.branch[0]) };

export const Guest: Story = { globals: { userKind: 'guest' } };
export const Pending: Story = { globals: { userKind: 'pending' } };
export const AppOnly: Story = { globals: { userKind: 'app' } };
