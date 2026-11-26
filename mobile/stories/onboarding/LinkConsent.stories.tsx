import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { fn, userEvent, within } from 'storybook/test';

import { LinkConsent } from '@/components/onboarding/link-consent';
import { Field } from '@/components/onboarding/parts';

import { padded } from '../_support/padded';

function Demo({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  return <LinkConsent on={on} onChange={setOn} branch="하남점" />;
}

/** 연동 요청 동의 한 줄 — 작은 동그라미 체크 + '(필수) 지점에 정보 보내기 동의' + 밑줄 '보기'(동의 내용 시트) */
const meta = {
  title: 'Onboarding/LinkConsent',
  component: LinkConsent,
  args: { on: true, onChange: fn(), branch: '하남점' },
  decorators: [padded],
} satisfies Meta<typeof LinkConsent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const On: Story = {};
export const Off: Story = { args: { on: false } };
/** 끈 채로 보내려 할 때 — 동그라미 빨간 테두리 */
export const Invalid: Story = {
  args: { on: false },
  render: (args) => (
    <Field error="지점에 정보를 보내려면 동의가 필요해요">
      <LinkConsent {...args} />
    </Field>
  ),
};
/** 눌러서 켜고 꺼 보기 */
export const Interactive: Story = { render: () => <Demo initial={false} /> };
/** '보기' → 동의 내용 시트 (받는 곳 = 고른 지점) */
export const SheetOpen: Story = {
  render: () => <Demo initial={false} />,
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('button', { name: '지점에 정보 보내기 동의 내용 보기' }));
  },
};
/** 지점을 아직 안 골랐으면 받는 곳이 '고른 지점' */
export const SheetOpenNoBranch: Story = {
  args: { branch: '' },
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('button', { name: '지점에 정보 보내기 동의 내용 보기' }));
  },
};
