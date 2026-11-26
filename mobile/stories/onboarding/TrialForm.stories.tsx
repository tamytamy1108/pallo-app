import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { TrialForm, type TrialFormMode } from '@/components/onboarding/trial-form';
import type { TrialDraft } from '@/state/trial-booking';

import { EMPTY_TRIAL, FILLED_TRIAL, openSlot } from './_onb';

/** 값을 스토리 안에 들고 있어 칸을 채워 볼 수 있게 (실제로는 바깥 화면이 들고 있어요) */
function Demo({ mode, initial, onSubmit }: { mode: TrialFormMode; initial: TrialDraft; onSubmit: (b: TrialDraft) => void }) {
  const [v, setV] = useState(initial);
  return <TrialForm mode={mode} value={v} onChange={(p) => setV((s) => ({ ...s, ...p }))} onSubmit={onSubmit} onBack={fn()} />;
}

/**
 * 체험 예약 한 장 — 지점 → 이름 → 번호 → 희망 언어 → 상담 시간 → 이유(선택) → 전달 사항(선택).
 * onboarding: 가입 4/4 (진행 바) · app: 앱 안 전체 화면 (진행 바 없음).
 * '체험 예약하기'는 늘 켜 두고, 빠진 칸이 있으면 그 칸으로 스크롤 · 빨간 안내.
 */
const meta = {
  title: 'Onboarding/TrialForm',
  component: TrialForm,
  args: { mode: 'onboarding', value: EMPTY_TRIAL, onChange: fn(), onSubmit: fn() },
  render: (args) => <Demo mode={args.mode} initial={args.value} onSubmit={args.onSubmit} />,
} satisfies Meta<typeof TrialForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 아무것도 안 채움 — 시간 칸은 '지점을 고르면…' 안내 */
export const Empty: Story = {};
/** 앱 안 체험 예약 — 진행 바 없음 */
export const AppMode: Story = { args: { mode: 'app' } };
/** 카카오 이름 · 번호만 미리 채움 */
export const Prefilled: Story = { args: { value: { ...EMPTY_TRIAL, realName: '김서현', phone: '010-1234-5678' } } };
/** 지점만 고름 — 날짜 · 시간표가 보이고 시간은 아직 */
export const BranchChosen: Story = { args: { value: { ...EMPTY_TRIAL, branchCode: '하남점', branch: '하남점', realName: '김서현', phone: '010-1234-5678' } } };
/** 시간까지 고름 (꼭 채울 칸 다 채움) */
export const TimeChosen: Story = { args: { value: { ...EMPTY_TRIAL, branchCode: '하남점', branch: '하남점', realName: '김서현', phone: '010-1234-5678', ...openSlot('하남점') } } };
/** 다른 언어 — 일본어 칩이 켜져요 (시간표는 지점 상담 시간이라 같아요) */
export const JapaneseSlots: Story = { args: { value: { ...EMPTY_TRIAL, branchCode: '하남점', branch: '하남점', realName: '김서현', phone: '010-1234-5678', langs: ['ja'], langLabel: '일본어', ...openSlot('하남점') } } };
/** 이유 · 전달 사항까지 다 채움 */
export const AllFilled: Story = { args: { value: FILLED_TRIAL } };
/** 빈 채 '체험 예약하기' → 첫 빠진 칸(지점)에 빨간 안내 */
export const SubmitMissingBranch: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(await c.findByRole('button', { name: '체험 예약하기' }));
    await expect(await c.findByText('지점을 골라 주세요')).toBeInTheDocument();
  },
};
/** 시간만 빠진 채 '체험 예약하기' → 시간 칸에 빨간 안내 */
export const SubmitMissingTime: Story = {
  args: { value: { ...EMPTY_TRIAL, branchCode: '하남점', branch: '하남점', realName: '김서현', phone: '010-1234-5678' } },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(await c.findByRole('button', { name: '체험 예약하기' }));
    await expect(await c.findByText('상담 시간을 골라 주세요')).toBeInTheDocument();
  },
};
/** 번호가 틀린 채 '체험 예약하기' → 번호 칸에 빨간 안내 */
export const SubmitInvalidPhone: Story = {
  args: { value: { ...EMPTY_TRIAL, branchCode: '하남점', branch: '하남점', realName: '김서현', phone: '010-12' } },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(await c.findByRole('button', { name: '체험 예약하기' }));
    await expect(await c.findByText('휴대폰 번호를 확인해 주세요')).toBeInTheDocument();
  },
};
/** 지점 칸 누름 → 지점 시트 */
export const BranchSheetOpen: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('button', { name: '지점 선택하기' }));
  },
};
