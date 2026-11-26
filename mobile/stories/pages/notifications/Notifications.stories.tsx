import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { userEvent, within } from 'storybook/test';

import NotificationsScreen from '@/app/(app)/notifications';
import { ToastHost } from '@/components/ui/toast';
import { markAllNotiRead } from '@/components/home/noti-state';

import { freshDevice } from '../../_support/fresh-device';

const tab = (label: string) => async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  await userEvent.click(await within(canvasElement).findByRole('tab', { name: label }));
};

/**
 * 알림함 (/notifications) — 탭(전체 · 공지 · 학습 · 라운지 · 이벤트) · 안 읽은 알림은 노랑 바탕 + 분홍 점 · [모두 읽음] · 알림 설정.
 * 읽음은 기기에 남는 값이라 스토리마다 처음 값으로 돌려요. 비회원은 알림 설정이 흐려요.
 */
const meta = {
  title: 'Pages/Notifications',
  component: NotificationsScreen,
  parameters: { route: { pathname: '/notifications' } },
  beforeEach: freshDevice(),
  render: () => (
    <>
      <NotificationsScreen />
      <ToastHost />
    </>
  ),
} satisfies Meta<typeof NotificationsScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 안 읽은 알림이 섞인 목록 */
export const Default: Story = {};
/** 다 읽음 — [모두 읽음] 흐림 */
export const AllRead: Story = { beforeEach: freshDevice(markAllNotiRead) };
/** 비회원 — 알림 설정 흐림 */
export const Guest: Story = { globals: { userKind: 'guest' } };
/** 앱 구독 — 비회원과 같아요 */
export const AppOnly: Story = { globals: { userKind: 'app' } };
export const NoticeTab: Story = { play: tab('공지') };
export const LearnTab: Story = { play: tab('학습') };
export const LoungeTab: Story = { play: tab('라운지') };
/** 이벤트 탭 */
export const EventTab: Story = { play: tab('이벤트') };
/** [모두 읽음] 누름 → 토스트 */
export const MarkAllRead: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByText('모두 읽음'));
  },
};
