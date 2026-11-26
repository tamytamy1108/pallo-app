import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import RankingScreen from '@/app/(app)/me/ranking';
import { getSavedExpressions, removeExpression } from '@/state/expressions';

import { fresh } from '../../my/_state';

const clearMarks = () => getSavedExpressions().forEach((x) => removeExpression(x.en));

/** 랭킹 · 퀘스트 (/me/ranking) — 내 순위(이번 주 포인트로 정해짐) · 지점 대항전 · 아래 내 표현함. */
const meta = {
  title: 'Pages/Me/Ranking',
  component: RankingScreen,
  parameters: { route: { pathname: '/me/ranking' } },
  beforeEach: fresh(),
} satisfies Meta<typeof RankingScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 이번 주 0P — 꼴찌 */
export const Last: Story = {};
/** 300P — 중간 (4위) */
export const Middle: Story = { beforeEach: fresh({ weekPoints: 300 }) };
/** 1등 */
export const First: Story = { beforeEach: fresh({ weekPoints: 999 }) };
/** 이번 달 탭 */
export const Month: Story = {
  beforeEach: fresh({ weekPoints: 300 }),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByText('이번 달'));
  },
};
/** 지점 대항전 */
export const Branches: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByText('지점 대항전'));
  },
};
/** 저장한 표현 없음 */
export const NoExpressions: Story = { beforeEach: fresh({}, clearMarks) };
/** 비회원 */
export const Guest: Story = { globals: { userKind: 'guest' } };
