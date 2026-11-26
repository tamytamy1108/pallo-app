import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { AccountCard, NumberCard } from '@/components/event/account-card';

import { padded } from '../_support/padded';

/** 입금 계좌 카드 (은행 · 예금주 / 계좌번호 / 안내 + 복사) · 같은 모양의 번호 카드(문자 문의). */
const meta = {
  title: 'Event/AccountCard',
  component: AccountCard,
  args: { acct: ['카카오뱅크', '3333-12-0458127', 'PALLO 연신내'] },
  decorators: [padded],
} satisfies Meta<typeof AccountCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 기본 안내 문장 */
export const Default: Story = {};
/** 안내 없음 ('내 신청' 카드 안) */
export const NoNote: Story = { args: { note: '' } };
/** 긴 안내 · 긴 예금주 */
export const LongText: Story = {
  args: {
    acct: ['국민은행', '421301-01-552918', 'PALLO 대구일본어중국어점 이벤트팀'],
    note: '한국어 이름으로 신청해주세요. 입금이 확인되면 확정됩니다. 입금자명이 다르면 확인이 늦어질 수 있어요. 환불은 이벤트 3일 전까지 가능해요.',
  },
};
/** 번호 + 복사 (문자 문의 시트) */
export const PhoneNumber: Story = { render: () => <NumberCard top="PALLO 연신내 · 담당 매니저 Jay" no="0507-0000-4821" note="번호를 복사해 문자로 보내 주세요" /> };
