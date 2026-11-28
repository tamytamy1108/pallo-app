import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import type { LinkRequest } from '@/api/branch-link';
import MyBranchLinksScreen from '@/app/(app)/me/settings/branch';

import { LOADING_FOREVER } from '../../_support/api';
import { fresh } from '../../my/_state';
import { LINK_REQUESTS_KEY as KEY, LINK_SAMPLE as SAMPLE, linkRow as row, seedLinkRequests } from './_link-requests';

const GUEST = { role: 'guest', memberAccessLevel: 'UNREGISTERED' } as const;

const withRows = (rows: LinkRequest[]): Pick<Story, 'parameters' | 'beforeEach'> => ({
  parameters: { queries: [[KEY, rows]] },
  beforeEach: fresh(GUEST, seedLinkRequests(rows)),
});

/**
 * 설정 › 내 지점 (/me/settings/branch) — 내가 보낸 지점 연동 요청. 확인 중 / 지난 요청(연동됨 · 반려됨). 줄을 누르면 요청 내용 시트,
 * 그 지점의 가장 최근 반려면 [다시 요청하기]. 데이터는 GET /me/branch-link-requests.
 */
const meta = {
  title: 'Pages/Me/MyBranchLinks',
  component: MyBranchLinksScreen,
  parameters: { route: { pathname: '/me/settings/branch' } },
} satisfies Meta<typeof MyBranchLinksScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { ...withRows(SAMPLE) };
export const Empty: Story = { ...withRows([]) };
/** 확인 중 시트 — 보낸 이름 · 번호 · 요청한 때 */
export const PendingSheet: Story = {
  ...withRows(SAMPLE),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole('button', { name: /잠실점 확인 중/ }, { timeout: 15000 }));
  },
};
/** 연동됨 시트 — 연동된 때 */
export const ApprovedSheet: Story = {
  ...withRows(SAMPLE),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole('button', { name: /홍대점 연동됨/ }, { timeout: 15000 }));
  },
};
/** 반려 시트 — 지점이 남긴 말 · [다시 요청하기] */
export const RejectedSheet: Story = {
  ...withRows(SAMPLE),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole('button', { name: /강남점 반려됨/ }, { timeout: 15000 }));
  },
};
/** 옛 앱 요청 — 이름 · 번호 줄이 없고, 같은 지점에 뒤에 다시 보낸 요청(확인 중)이 있어 [다시 요청하기]도 없다 */
export const LegacySheet: Story = {
  ...withRows(SAMPLE),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole('button', { name: /하남점 반려됨/ }, { timeout: 15000 }));
  },
};
/** 긴 지점 이름 · 긴 남긴 말 */
export const LongCopy: Story = {
  ...withRows([
    row({
      branchName: '경기 남양주 다산신도시 현대프리미어캠퍼스점',
      status: 'REJECTED',
      rejectionReason: '지점에 등록된 휴대폰 번호와 달라요. 등록할 때 다른 번호를 쓰셨다면 그 번호로 다시 요청해 주시거나 지점에 전화 주세요.',
      decidedAt: new Date().toISOString(),
    }),
  ]),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole('button', { name: /연동 요청 내용/ }, { timeout: 15000 }));
  },
};
export const Loading: Story = { beforeEach: fresh(GUEST), parameters: { api: { delayMs: LOADING_FOREVER } } };
export const Error: Story = { beforeEach: fresh(GUEST), parameters: { api: { fail: ['linkRequests'] } } };
