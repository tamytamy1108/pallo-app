import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useEffect } from 'react';
import { fn } from 'storybook/test';

import { UpsellHost } from '@/components/common/upsell-sheet';
import { chapterUpsell, lockView, POPUP_EVERY, resetLockHits, trialReminder } from '@/state/lock-hits';

import { behindSheet } from '../ui/_overlay';

type Trigger = 'lock' | 'chapter' | 'reminder';

/** 권유 시트를 여는 실제 길로 열어요 — 잠김을 3번 보기 · 첫 챕터 끝 · 체험 예약자가 회원 전용 누르기 */
function open(trigger: Trigger) {
  resetLockHits();
  if (trigger === 'lock') for (let i = 0; i < POPUP_EVERY; i++) lockView();
  else if (trigger === 'chapter') chapterUpsell();
  else trialReminder('댓글을 달려면');
}

function Host({ trigger, onBook }: { trigger: Trigger; onBook: () => void }) {
  useEffect(() => {
    open(trigger);
    return resetLockHits;
  }, [trigger]);
  return <UpsellHost onBook={onBook} />;
}

/**
 * 체험 권유 시트 (UpsellHost) — 잠김을 3번 볼 때마다('체험해 보시겠어요?') · 무료 첫 챕터를 끝냈을 때('실제 대화').
 * 체험을 예약한 사람에게는 다시 예약하라고 하지 않고 '예약한 체험' + [예약 내용 보기].
 */
const meta = {
  title: 'Common/UpsellSheet',
  component: Host,
  args: { trigger: 'lock', onBook: fn() },
  argTypes: { trigger: { control: 'inline-radio', options: ['lock', 'chapter', 'reminder'] } },
  globals: { userKind: 'guest' },
  decorators: [behindSheet],
} satisfies Meta<typeof Host>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 잠김 3번 — MEMBERS ONLY · 체험해 보시겠어요? */
export const Lock: Story = {};
/** 첫 챕터 끝 — NEXT TAKE · [나중에] */
export const Chapter: Story = { args: { trigger: 'chapter' } };
/** 체험 예약자가 회원 전용을 누름 — 제목에 '…하려면' */
export const TrialReminder: Story = { globals: { userKind: 'trial' }, args: { trigger: 'reminder' } };
/** 체험 예약자 · 첫 챕터 끝 */
export const TrialChapter: Story = { globals: { userKind: 'trial' }, args: { trigger: 'chapter' } };
/** 체험 예약자 · 잠김 3번 — '예약한 체험이 기다리고 있어요' */
export const TrialLock: Story = { globals: { userKind: 'trial' } };
