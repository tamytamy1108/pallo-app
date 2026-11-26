import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import DesignScreen from '@/app/(app)/design';

/** 개발용 디자인 부품 모음 (/design) — 글자 · 버튼 · 알약 · 칩 · 카드. 상태 갈림 없이 한 장. */
const meta = {
  title: 'Pages/Design',
  component: DesignScreen,
  parameters: { route: { pathname: '/design' } },
} satisfies Meta<typeof DesignScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
