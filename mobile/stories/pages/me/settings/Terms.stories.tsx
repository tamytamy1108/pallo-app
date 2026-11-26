import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import TermsScreen from '@/app/(app)/me/settings/terms';

/** 이용약관 · 개인정보 처리방침 목록 (/me/settings/terms). 정적인 목록. */
const meta = {
  title: 'Pages/Me/Settings/Terms',
  component: TermsScreen,
  parameters: { route: { pathname: '/me/settings/terms' } },
} satisfies Meta<typeof TermsScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
