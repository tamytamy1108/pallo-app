import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { setMockLinkRequests, type LinkRequest } from '@/api/branch-link';
import { mockBranchSummary } from '@/api/branch-summary';
import { branchSummaryQuery } from '@/api/queries';
import { LinkRejectedPopup } from '@/components/home/link-rejected-popup';

import { behindSheet, homeDevice, withNote } from './_home';

const KEY = branchSummaryQuery().queryKey;

const row = (over: Partial<LinkRequest>): LinkRequest => ({
  id: 'r1',
  branchCode: 'HANAM',
  branchName: '하남점',
  status: 'REJECTED',
  realName: '김서현',
  phone: '010-1234-5678',
  rejectionReason: '등록된 번호가 달라요. 등록할 때 쓴 번호로 다시 요청해 주세요.',
  createdAt: '2026-11-20T01:00:00Z',
  decidedAt: '2026-11-21T03:00:00Z',
  acknowledgedAt: null,
  ...over,
});

/**
 * 내 연동 요청을 가짜 서버에 넣고, 그걸로 만든 요약(GET /me/branch-summary)을 캐시에 채워요
 * — [확인]이 가짜 서버까지 가서 요약을 다시 받아도 같은 데이터에서 나오게.
 */
const withRequests = (rows: LinkRequest[]): Pick<Story, 'parameters' | 'beforeEach'> => ({
  parameters: { queries: [[KEY, mockBranchSummary(rows)]] },
  beforeEach: () => {
    setMockLinkRequests(rows);
    return () => setMockLinkRequests([]);
  },
});

/**
 * 지점 연동 반려 팝업 — 홈에 들어오고 0.5초 뒤 뜬다. 반려 사유 · [확인]. 바깥을 눌러도 안 닫힌다.
 * 데이터는 요약의 rejectedLinks (확인 안 한 · 다시 요청 안 한 반려를 서버가 골라 줌).
 * [확인]을 누르면 확인한 것으로 남아 다시 안 뜬다 (여러 건이면 다음 것). 다시 보려면 스토리를 다시 연다.
 */
const meta = {
  title: 'Home/LinkRejectedPopup',
  component: LinkRejectedPopup,
  decorators: [behindSheet],
  beforeEach: homeDevice(),
} satisfies Meta<typeof LinkRejectedPopup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 반려 한 건 — 지점에서 남긴 말 */
export const Single: Story = withRequests([row({})]);

/** 두 지점이 반려 — 1 / 2, 확인하면 다음 것 */
export const Many: Story = withRequests([
  row({ id: 'r2', branchCode: 'YDP', branchName: '영등포점', rejectionReason: '같은 이름의 회원이 여럿이라 확인이 어려워요. 지점으로 전화 주세요.', createdAt: '2026-11-21T01:00:00Z', decidedAt: '2026-11-22T03:00:00Z' }),
  row({}),
]);

/** 사유 없이 반려 — 지점에 물어보라는 한 줄 */
export const NoReason: Story = withRequests([row({ rejectionReason: null })]);

/** 긴 지점 이름 · 긴 사유 */
export const LongCopy: Story = withRequests([
  row({
    branchName: '판교테크노밸리 2호점',
    rejectionReason: '보내 주신 이름과 번호로 등록된 회원을 찾지 못했어요. 가족 명의로 등록하셨다면 등록한 분의 번호로 다시 요청해 주시고, 그래도 안 되면 지점으로 전화 주세요. 평일 10시부터 22시까지 받아요.',
  }),
]);

/** 띄울 반려가 없음 (확인했거나 · 다시 요청했거나 · 반려가 없음) — 뜨지 않아요 */
export const None: Story = {
  ...withRequests([row({ acknowledgedAt: '2026-11-21T05:00:00Z' })]),
  decorators: [withNote('띄울 반려가 없어요 — 뜨지 않아요')],
};

/** 요약을 못 받음 — 뜨지 않아요 */
export const Error: Story = { decorators: [withNote('실패 — 뜨지 않아요')], parameters: { api: { fail: ['branchSummary'] } } };
