import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { setMockInquiries } from '@/api/support';
import SupportScreen from '@/app/(app)/me/support';

import { fresh } from '../../my/_state';

const at = (params?: Record<string, string>) => ({ route: { pathname: '/me/support', params } });

/**
 * 고객센터 (/me/support) — 찾기 · 분류 칩 · 자주 묻는 질문 · 문의 방법. ?view=faq 면 질문만, ?view=ask 면 1:1 문의(새 문의 · 내 문의).
 * 데이터는 가짜 서버(api/support — GET /faq · GET · POST /me/inquiries). 불러오는 중 · 오류는 주소에 ?mockDelay= · ?mockFail=faq,inquiries.
 */
const meta = {
  title: 'Pages/Me/Support',
  component: SupportScreen,
  parameters: at(),
  beforeEach: fresh({}, () => setMockInquiries()),
} satisfies Meta<typeof SupportScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Help: Story = {};
/** 자주 묻는 질문만 (?view=faq) */
export const FaqOnly: Story = { parameters: at({ view: 'faq' }) };
/** 찾기 — 결과 없음 */
export const SearchNoResult: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(await canvas.findByLabelText('자주 묻는 질문 찾기'), 'zzzz');
  },
};
/** 1:1 문의 — 새 문의 */
export const Ask: Story = { parameters: at({ view: 'ask' }) };
/** 1:1 문의 — 분류 미리 고름 (?type=PAYMENT · 결제 내역에서 올 때) */
export const AskWithType: Story = { parameters: at({ view: 'ask', type: 'PAYMENT' }) };
/** 1:1 문의 — 내 문의 탭 (답변 대기 · 답변 완료) */
export const AskList: Story = {
  parameters: at({ view: 'ask' }),
  beforeEach: fresh({}, () =>
    setMockInquiries([
      {
        id: 'story-inquiry-pending',
        categoryCode: 'PAYMENT',
        categoryLabel: '이용권 · 결제',
        title: '이용권 연장하면 남은 횟수는 어떻게 되나요? 아주 긴 문의 내용이 들어가면 줄이…',
        content: '이용권 연장하면 남은 횟수는 어떻게 되나요? 아주 긴 문의 내용이 들어가면 줄이 어떻게 바뀌는지 확인해요.',
        status: 'PENDING',
        answer: null,
        createdAt: '2026-11-20T01:00:00Z',
        answeredAt: null,
      },
      {
        id: 'story-inquiry-etc',
        categoryCode: null,
        categoryLabel: null,
        title: '기타로 보낸 문의',
        content: '기타로 보낸 문의',
        status: 'ANSWERED',
        answer: '확인했어요. 지점에 전달해 둘게요.',
        createdAt: '2026-11-18T01:00:00Z',
        answeredAt: '2026-11-18T05:00:00Z',
      },
    ]),
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole('tab', { name: /내 문의/ }));
  },
};
/** 1:1 문의 — 내 문의 0건 */
export const AskListEmpty: Story = {
  parameters: at({ view: 'ask' }),
  beforeEach: fresh({}, () => setMockInquiries([])),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole('tab', { name: /내 문의/ }));
  },
};
