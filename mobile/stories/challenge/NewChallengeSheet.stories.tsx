import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { NewChallengeSheet } from '@/components/challenge/new-challenge';
import { getSavedExpressions, removeExpression } from '@/state/expressions';

import { setup, tapText } from '../lounge/_fixtures';

/**
 * 챌린지 열기 시트 — 표현(내 표현함에서 고르기 · 같은 표현 챌린지가 있으면 안내) / 일상(이름 · 시작 · 기간 · 주기 · 인증 방법 · 카드 문구).
 * 일상 카테고리는 위 알약을 눌러야 나와서 play 로 누른다.
 */
const meta = {
  title: 'Challenge/NewChallengeSheet',
  component: NewChallengeSheet,
  args: { open: true, onClose: fn(), onGoChallenge: fn() },
  beforeEach: setup(),
} satisfies Meta<typeof NewChallengeSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 표현 챌린지 — 고른 표현 없음 */
export const Expression: Story = {};
/** 내 표현함에서 고른 표현이 있을 때 (?expr=m1) */
export const PresetPicked: Story = { args: { preset: ['m1'] } };
/** 이미 같은 표현 챌린지가 있음 (on the fence → c1) — [표현 챌린지 열기] 흐림 */
export const PresetDuplicate: Story = { args: { preset: ['m3'] } };
/** 내 표현함이 비었을 때 */
export const NoSavedExpressions: Story = { beforeEach: setup(() => getSavedExpressions().forEach((x) => removeExpression(x.en))) };
/** 일상 챌린지 — 운동 */
export const Daily: Story = { play: () => tapText('운동') };
/** 일상 챌린지 — 공부 습관 */
export const DailyHabit: Story = { play: () => tapText('공부 습관') };
/** 비회원 (열기를 누르면 회원 안내) */
export const AsGuest: Story = { globals: { userKind: 'guest' } };
