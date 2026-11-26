import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { CardGrid, ReasonCard, WHY_REASONS } from '@/components/onboarding/app-parts';

import { padded } from '../_support/padded';

function GridDemo({ initial }: { initial: string[] }) {
  const [on, setOn] = useState<string[]>(initial);
  return (
    <CardGrid label="배우고 싶은 이유">
      {WHY_REASONS.map((r) => (
        <ReasonCard key={r} label={r} on={on.includes(r)} onPress={() => setOn((p) => (p.includes(r) ? p.filter((x) => x !== r) : [...p, r]))} />
      ))}
    </CardGrid>
  );
}

/** 배우고 싶은 이유 카드 — 왼쪽 체크 동그라미 + 글, 고르면 라벤더 · 보라. 두 줄 격자(CardGrid)에 담겨요 */
const meta = {
  title: 'Onboarding/ReasonCard',
  component: ReasonCard,
  args: { label: '여행 가서 말하기', on: false, onPress: fn() },
  decorators: [padded],
} satisfies Meta<typeof ReasonCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {};
export const On: Story = { args: { on: true } };
export const LongLabel: Story = { args: { label: '유학 · 워홀 · 이민', on: true } };
/** 격자 — 하나도 안 고름 (눌러서 골라 보기) */
export const GridNone: Story = { render: () => <GridDemo initial={[]} /> };
export const GridSome: Story = { render: () => <GridDemo initial={['여행 가서 말하기', '새 취미']} /> };
export const GridAll: Story = { render: () => <GridDemo initial={[...WHY_REASONS]} /> };
