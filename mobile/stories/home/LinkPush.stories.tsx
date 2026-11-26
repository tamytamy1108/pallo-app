import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { LinkPushHost } from '@/components/home/link-push';
import { receiveLinkResult } from '@/state/link-events';
import { updateMe } from '@/state/me';

import { homeDevice, withNote } from './_home';

/**
 * 지점 연동 결과 푸시 배너 — 위에서 내려온다. 연동됨(→ 마이) · 못 찾음(→ 연동 안 됨 화면). 8초 뒤 저절로 올라간다(누르거나 위로 밀어도 닫힘).
 * 다시 보려면 스토리를 다시 연다.
 */
const meta = {
  title: 'Home/LinkPush',
  component: LinkPushHost,
  decorators: [withNote('8초 뒤 저절로 올라가요 — 다시 보려면 스토리를 다시 열어요')],
  globals: { userKind: 'pending' },
} satisfies Meta<typeof LinkPushHost>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Linked: Story = { beforeEach: homeDevice({}, () => receiveLinkResult('linked')) };
export const Rejected: Story = { beforeEach: homeDevice({}, () => receiveLinkResult('rejected')) };
/** 긴 지점 이름 */
export const LongBranch: Story = {
  beforeEach: homeDevice({}, () => {
    updateMe({ branch: '경기광주오포신현역사거리점' });
    receiveLinkResult('rejected');
  }),
};
