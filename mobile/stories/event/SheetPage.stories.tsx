import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { SheetButton } from '@/components/common/sheet-parts';
import { SheetPage } from '@/components/event/sheet-page';
import { PText } from '@/components/ui/text';

/** 시트 모양 화면 (긴 폼) — 어두운 바탕 · 크림 시트 · 위 손잡이 · 아래 고정 버튼. 이벤트 제안 · 번개 열기가 쓴다. */
const meta = {
  title: 'Event/SheetPage',
  component: SheetPage,
  args: {
    title: '이벤트 제안하기',
    label: '이벤트 제안하기',
    children: <PText>폼 칸들이 여기에 들어가요.</PText>,
    footer: <SheetButton label="제안 보내기" size="foot" onPress={fn()} />,
  },
} satisfies Meta<typeof SheetPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** 내용이 길어 스크롤 */
export const LongContent: Story = {
  args: {
    children: (
      <>
        {Array.from({ length: 30 }, (_, i) => (
          <PText key={i}>{`${i + 1}번째 줄 — 긴 폼은 시트 안에서 스크롤돼요.`}</PText>
        ))}
      </>
    ),
  },
};
