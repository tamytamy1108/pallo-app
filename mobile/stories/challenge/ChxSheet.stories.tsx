import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { ChxSheet } from '@/components/challenge/chx-sheet';
import { addEntry } from '@/data/challenge';

import { challenge, setup } from '../lounge/_fixtures';

const c1 = challenge('c1');

/**
 * 표현 챌린지 창 '나만의 문장 완성하기' — 표현 카드 · 나만의 문장 목록(좋아요 · 답글) · 아래 입력칸.
 * 문장을 처음 달면 자동 참여. 남은 날 3일 이하면 남은 날이 빨강.
 */
const meta = {
  title: 'Challenge/ChxSheet',
  component: ChxSheet,
  args: { p: c1, open: true, onClose: fn() },
  beforeEach: setup(),
} satisfies Meta<typeof ChxSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 예시 문장들 · 아직 참여 안 함 */
export const Default: Story = {};
/** 내가 문장을 달아 참여 중 (내 문장 · 참여 중 표시) */
export const Joined: Story = { beforeEach: setup(() => void addEntry(c1, 'I’m on the fence about moving to Busan.')) };
/** 내가 연 챌린지 · 문장 없음 (빈 목록) */
export const MineEmpty: Story = { args: { p: { ...c1, id: 'sb-mine', mine: true } } };
/** 끝나기 3일 전 — 남은 날 빨강 */
export const EndingSoon: Story = { args: { p: { ...c1, id: 'sb-soon', day: 28 } } };
/** 끝남 */
export const Ended: Story = { args: { p: { ...c1, id: 'sb-end', day: 30 } } };
/** [문장 쓰기]로 열기 — 입력칸에 바로 */
export const Write: Story = { args: { write: true } };
/** 전 지점 챌린지 — 문장 많음 */
export const ManyEntries: Story = { args: { p: challenge('c3') } };
/** 비회원 — 보내기를 누르면 회원 안내 */
export const AsGuest: Story = { globals: { userKind: 'guest' } };
