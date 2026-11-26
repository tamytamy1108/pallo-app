import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { AbroadCard } from '@/components/lounge/post-card';
import { toggleLike, toggleSave } from '@/data/lounge-store';

import { padded } from '../_support/padded';
import { feedItem, LONG_TEXT, setup } from './_fixtures';

const a1 = feedItem('a1', 'abroad');

/** 해외살이 이야기 카드 — 하늘색 머리 · 나라 도장 · [○○에게 질문하기] · 하트/댓글/저장 줄. */
const meta = {
  title: 'Lounge/AbroadCard',
  component: AbroadCard,
  args: { p: a1 },
  decorators: [padded],
  beforeEach: setup(),
} satisfies Meta<typeof AbroadCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** 일본 · 다른 사람 */
export const Japan: Story = { args: { p: feedItem('a2', 'abroad') } };
export const LikedSaved: Story = { beforeEach: setup(() => (toggleLike('a1'), void toggleSave('a1'))) };
/** 긴 제목 · 본문 */
export const LongText: Story = { args: { p: { ...a1, id: 'sb-ab-long', title: '시드니에서 7개월 살면서 알게 된 쉐어하우스 구하는 방법과 조심할 점 총정리', body: LONG_TEXT } } };
/** 비회원 — 질문하기를 누르면 회원 안내 */
export const AsGuest: Story = { globals: { userKind: 'guest' } };
