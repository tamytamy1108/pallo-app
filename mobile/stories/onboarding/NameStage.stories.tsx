import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { NameStage } from '@/components/onboarding/start-stage';
import { BODY_SRC } from '@/components/onboarding/start-palloro';

import { padded } from '../_support/padded';

const STICKER = require('@/assets/characters/c-purple-lash-sticker.png');

/**
 * 작은 무대 카드 (닉네임 · 캐릭터 화면 위) — 어두운 무대 · 노란 조명 · 팔로로 + 'HELLO,' + 흰 닉네임.
 * 닉네임은 폭 4칸까지 한 줄 크게, 길면 5자씩 두 줄 작게. cheer 가 켜지는 순간 톡 튀고 스파크.
 */
const meta = {
  title: 'Onboarding/NameStage',
  component: NameStage,
  args: { kind: 'nickname', name: '서현', hero: STICKER, label: '무대 위 팔로로: HELLO, 서현!' },
  decorators: [padded],
} satisfies Meta<typeof NameStage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 닉네임 화면 — 짧은 이름 (한 줄 크게) */
export const Nickname: Story = {};
/** 긴 이름 — 두 줄 작게 */
export const NicknameLong: Story = { args: { name: '가나다라마바사아자차' } };
/** 영문 — 폭이 좁아 6자도 한 줄 */
export const NicknameLatin: Story = { args: { name: 'Seohy' } };
export const NicknameLatinLong: Story = { args: { name: 'seohyun2026' } };
/** 비었음 */
export const NicknameEmpty: Story = { args: { name: '' } };
/** 쓸 수 있는 닉네임이 된 순간 */
export const NicknameCheer: Story = { args: { cheer: true } };

/** 캐릭터 화면 — 고른 몸 색 · 조명 색 */
export const Character: Story = { args: { kind: 'character', hero: BODY_SRC['purple-lash'], tint: '#A88BEA', swapKey: 'purple-lash' } };
export const CharacterYellow: Story = { args: { kind: 'character', hero: BODY_SRC.yellow, tint: '#E0D121', swapKey: 'yellow' } };
export const CharacterPink: Story = { args: { kind: 'character', hero: BODY_SRC.pink, tint: '#F49BBE', swapKey: 'pink' } };
export const CharacterSky: Story = { args: { kind: 'character', hero: BODY_SRC.sky, tint: '#8DB6F2', swapKey: 'sky' } };
export const CharacterGreen: Story = { args: { kind: 'character', hero: BODY_SRC.green, tint: '#93D67E', swapKey: 'green' } };
export const CharacterCoral: Story = { args: { kind: 'character', hero: BODY_SRC.coral, tint: '#FF9E80', swapKey: 'coral' } };
export const CharacterLongName: Story = { args: { kind: 'character', name: '가나다라마바사아자차', hero: BODY_SRC.purple, tint: '#A88BEA' } };
