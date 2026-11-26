import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { ChestCelebrate } from '@/components/home/chest-celebrate';
import { chestReward } from '@/data/home';

import { behindSheet } from './_home';

/**
 * 챕터 완료 보상 상자 — 처음엔 닫힌 상자 '눌러서 열기'(4초 뒤 힌트), 누르면 열리며 +XP · 레벨 막대 · 배지 칸.
 * 이미 연 상자(opened)는 처음부터 열린 모습. onNext 가 없으면 마지막 과라 '홈으로'만.
 */
const meta = {
  title: 'Home/ChestCelebrate',
  component: ChestCelebrate,
  args: { unit: 1, title: 'Cafe Complaint', reward: chestReward(1), opened: false, onOpen: fn(), onHome: fn(), onNext: fn() },
  decorators: [behindSheet],
} satisfies Meta<typeof ChestCelebrate>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 닫힌 상자 — 누르면 열림 */
export const Closed: Story = {};
/** 다시 보기 — 열린 상자 · +120 XP 그대로 */
export const Opened: Story = { args: { opened: true } };
/** 마지막 과 — '다음 코너로' 없음 */
export const LastUnit: Story = { args: { opened: true, onNext: undefined } };
/** Lv.3 토픽 이름표 · 긴 제목 */
export const TopicLabel: Story = { args: { opened: true, unit: 101, unitLabel: '#101', title: 'Activities You Can Not Live Without Every Day' } };
