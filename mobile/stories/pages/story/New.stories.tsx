import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import StoryNewScreen from '@/app/(app)/story/new';

import { setup } from '../../lounge/_fixtures';

/**
 * 스토리 올리기 (/story/new) — 카테고리 · 한 줄 이야기 · 사진(선택) · 체크 옵션.
 * 이벤트 카테고리는 리더 · 매니저만, '매니저 고정' 체크는 매니저만. 사진 고르기는 기기 사진첩이라 여기선 고른 뒤 모습을 못 본다.
 */
const meta = {
  title: 'Pages/Story/New',
  component: StoryNewScreen,
  parameters: { route: { pathname: '/story/new' } },
  beforeEach: setup(),
} satisfies Meta<typeof StoryNewScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 일반 회원 (이벤트 카테고리 없음) */
export const Member: Story = {};
/** 리더 — 이벤트 카테고리 있음 */
export const Leader: Story = { beforeEach: setup(undefined, { role: 'leader' }) };
/** 매니저 — 이벤트 + 매니저 고정 체크 */
export const Manager: Story = { beforeEach: setup(undefined, { role: 'manager' }) };
