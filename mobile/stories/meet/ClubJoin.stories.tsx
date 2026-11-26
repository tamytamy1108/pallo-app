import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { ClubJoin } from '@/components/meet/club/club-join';

import { CLUB_COND, CLUB_FREE, meetState } from './_fixtures';

/**
 * 동아리 가입 시트 — 조건 '누구나'면 [가입하기], 아니면 [가입 신청하기](호스트 확인). 체크해야 버튼이 켜진다.
 * 가입 뒤 '가입 인사 남길래요?' 창은 버튼을 눌러야 열린다.
 */
const meta = {
  title: 'Meet/ClubJoin',
  component: ClubJoin,
  args: { c: CLUB_FREE, open: true, onClose: fn() },
  beforeEach: meetState(),
} satisfies Meta<typeof ClubJoin>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 누구나 — 바로 가입 */
export const Free: Story = {};
/** 가입 조건 있음 (Lv.2 이상) — 가입 신청 */
export const Conditional: Story = { args: { c: CLUB_COND } };
export const Closed: Story = { args: { open: false } };
