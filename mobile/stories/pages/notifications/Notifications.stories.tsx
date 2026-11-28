import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { userEvent, within } from 'storybook/test';

import NotificationsScreen from '@/app/(app)/notifications';
import { ToastHost } from '@/components/ui/toast';
import { markAllNotiRead } from '@/components/home/noti-state';
import { setMockOptions } from '@/api/mock';

import { freshDevice } from '../../_support/fresh-device';

const tab = (label: string) => async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  await userEvent.click(await within(canvasElement).findByRole('tab', { name: label }));
};

/**
 * 알림함 (/notifications) — 탭(전체 · 공지, 서버 category) · 안 읽은 알림은 노랑 바탕 + 분홍 점 · [모두 읽음] · 알림 설정.
 * 가짜 서버(api/notifications.ts)는 예시 알림의 읽음을 기기에 남겨서 스토리마다 처음 값으로 돌려요. 비회원은 알림 설정이 흐려요.
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
/** 공지 탭 — 공지 게시 알림 · 공지 성격 알림만 */
export const NoticeTab: Story = { play: tab('공지') };
/** 목록을 못 받음 — [다시 시도] */
export const LoadError: Story = {
  beforeEach: freshDevice(() => {
    setMockOptions({ fail: ['notifications'] });
    return () => setMockOptions({ fail: [] });
  }),
};
/** [모두 읽음] 누름 → 토스트 */
export const MarkAllRead: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByText('모두 읽음'));
  },
};
