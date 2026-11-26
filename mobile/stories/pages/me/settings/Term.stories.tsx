import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import TermScreen from '@/app/(app)/me/settings/term';

/** 약관 하나 (/me/settings/term?i=) — 0 이용약관 · 1 개인정보 · 2 위치정보 · 3 마케팅. 모르는 번호면 이용약관. */
const meta = {
  title: 'Pages/Me/Settings/Term',
  component: TermScreen,
  parameters: { route: { pathname: '/me/settings/term', params: { i: '0' } } },
} satisfies Meta<typeof TermScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

const at = (i: string) => ({ route: { pathname: '/me/settings/term', params: { i } } });

export const Service: Story = {};
export const Privacy: Story = { parameters: at('1') };
export const Location: Story = { parameters: at('2') };
export const Marketing: Story = { parameters: at('3') };
/** 없는 번호 — 이용약관으로 */
export const UnknownIndex: Story = { parameters: at('99') };
