import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { LgIcon } from '@/components/common/icons';
import { Pressable } from '@/components/ui/pressable';
import { TOP_ICON, TopBar } from '@/components/ui/top-bar';

/** 하위 화면 공통 위 줄 — ‹ · 제목 · 오른쪽 칸 · 아래 연한 선(기본: 제목 있을 때만). */
const meta = {
  title: 'UI/TopBar',
  component: TopBar,
  args: { onBack: fn() },
} satisfies Meta<typeof TopBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const More = () => (
  <Pressable onPress={fn()} accessibilityRole="button" accessibilityLabel="더 보기" style={TOP_ICON}>
    <LgIcon name="more" />
  </Pressable>
);

/** 뒤로만 (선 없음) */
export const BackOnly: Story = {};
export const WithTitle: Story = { args: { title: '공지' } };
export const WithRight: Story = { args: { title: '알림', right: <More /> } };
/** 오른쪽만 (제목 없이) */
export const RightOnly: Story = { args: { right: <More /> } };
/** 긴 제목은 한 줄로 잘려요 */
export const LongTitle: Story = { args: { title: '아주 긴 화면 제목이 들어가면 한 줄에서 말줄임으로 잘려요 확인용', right: <More /> } };
/** 제목 없이도 아래 선 */
export const ForcedLine: Story = { args: { line: true } };
/** 제목이 있어도 선 없이 */
export const NoLine: Story = { args: { title: '설정', line: false } };
/** SafeAreaView 밖에서 — 맨 위 안전 영역만큼 크림으로 채워요 (Storybook 은 안전 영역이 0) */
export const SafeTop: Story = { args: { title: '마이', safeTop: true } };
