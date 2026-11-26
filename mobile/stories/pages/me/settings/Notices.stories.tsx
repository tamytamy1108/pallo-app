import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { markNoticeRead } from '@/components/account/store';
import NoticesScreen from '@/app/(app)/me/settings/notices';
import { NOTICES } from '@/data/mock';

import { fresh } from '../../../my/_state';

/** 설정 › 공지사항 (/me/settings/notices) — 안 읽은 공지는 제목 옆 분홍 점. */
const meta = {
  title: 'Pages/Me/Settings/Notices',
  component: NoticesScreen,
  parameters: { route: { pathname: '/me/settings/notices' } },
  beforeEach: fresh(),
} satisfies Meta<typeof NoticesScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 모두 안 읽음 */
export const Unread: Story = {};
/** 모두 읽음 */
export const AllRead: Story = { beforeEach: fresh({}, () => NOTICES.forEach((n) => markNoticeRead(n.id))) };
