import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import ComposeScreen from '@/app/(app)/compose';

import { setup, tap } from '../../lounge/_fixtures';

/**
 * 글쓰기 (/compose) — ① 새 게시물(앨범 · 사진 찍기) → ② 글쓰기(글 칸 · 어떤 글인가요?).
 * 사진을 고른 뒤의 자르기 · 사진 줄은 기기 사진첩(네이티브 피커)이 있어야 해서 여기선 못 본다 — 2단계는 '사진 없이 다음'으로.
 */
const meta = {
  title: 'Pages/Compose',
  component: ComposeScreen,
  parameters: { route: { pathname: '/compose' } },
  beforeEach: setup(),
} satisfies Meta<typeof ComposeScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 1단계 — 사진 고르기 (사진 없음) */
export const Default: Story = {};
/** 2단계 — 글쓰기 (사진 없이 다음) */
export const WriteStep: Story = { play: () => tap('사진 없이 다음') };
