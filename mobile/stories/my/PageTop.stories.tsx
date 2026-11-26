import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { PageTop } from '@/components/my/page-top';
import { PText } from '@/components/ui/text';

/** 마이에서 겹쳐 뜨는 화면의 위 줄 — 제목만 · 오른쪽 칸 · 긴 제목. */
const meta = {
  title: 'My/PageTop',
  component: PageTop,
  args: { title: '랭킹 · 퀘스트', onBack: fn() },
} satisfies Meta<typeof PageTop>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithRight: Story = { args: { right: <PText variant="label">편집</PText> } };
export const LongTitle: Story = { args: { title: '아주 긴 화면 제목이 위 줄에 들어가면 어떻게 줄여지는지 확인해요' } };
/** onBack 없음 — 기본 뒤로(/my) */
export const DefaultBack: Story = { args: { onBack: undefined } };
