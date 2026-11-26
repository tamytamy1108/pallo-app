import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-view';

/** 목록마다 쓰는 빈 화면 · 불러오는 중 · 오류. */
const meta = {
  title: 'UI/StateView',
  component: EmptyState,
  args: { title: '이날은 번개가 없어요.' },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const EmptyWithLink: Story = { args: { link: { label: '이날 번개 열기 ›', onPress: fn() } } };
export const EmptyCompact: Story = { args: { compact: true } };
export const Loading: Story = { render: () => <LoadingState /> };
export const Error: Story = { render: () => <ErrorState onRetry={fn()} /> };
export const ErrorCustomMessage: Story = { render: () => <ErrorState message="인터넷 연결을 확인해 주세요" onRetry={fn()} /> };
export const ErrorNoRetry: Story = { render: () => <ErrorState /> };
