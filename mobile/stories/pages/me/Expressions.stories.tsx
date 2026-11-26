import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import ExpressionsScreen from '@/app/(app)/me/expressions';
import { getSavedExpressions, removeExpression } from '@/state/expressions';

import { fresh } from '../../my/_state';

const keepFirst = (n: number) => () => getSavedExpressions().slice(n).forEach((x) => removeExpression(x.en));

/** 내 표현함 (/me/expressions) — 예시 14개 · 몇 개 · 비었음 · 찾기 결과 없음. */
const meta = {
  title: 'Pages/Me/Expressions',
  component: ExpressionsScreen,
  parameters: { route: { pathname: '/me/expressions' } },
  beforeEach: fresh(),
} satisfies Meta<typeof ExpressionsScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Few: Story = { beforeEach: fresh({}, keepFirst(2)) };
export const Empty: Story = { beforeEach: fresh({}, keepFirst(0)) };
/** 찾기 — 맞는 문장 없음 */
export const SearchNoResult: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(await canvas.findByLabelText('내 표현함에서 찾기'), 'zzzz');
  },
};
/** 비회원도 볼 수 있음 */
export const Guest: Story = { globals: { userKind: 'guest' } };
