import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useEffect } from 'react';

import { memberGate, TrialGuideHost } from '@/components/common/trial-guide';
import { resetLockHits } from '@/state/lock-hits';

import { behindSheet } from '../ui/_overlay';

/** 호스트가 자리 잡은 뒤(같은 줄 뒤 형제라 호스트 effect 다음에 돌아요) 막힘을 한 번 일으켜요 */
function Gate({ why }: { why: string }) {
  useEffect(() => {
    memberGate(why);
  }, [why]);
  return null;
}

function Host({ why }: { why: string }) {
  return (
    <>
      <TrialGuideHost />
      <Gate why={why} />
    </>
  );
}

/**
 * 비회원 막힘 → 체험 안내 시트 (TrialGuideHost — 앱 맨 바깥에 하나). why 가 제목 첫 줄 '…하려면' 이 돼요.
 * 비회원에서 떠요 (연동 대기 · 연동 안 됨은 토스트, 체험 예약은 '예약한 체험' 시트 — Common/UpsellSheet).
 */
const meta = {
  title: 'Common/TrialGuide',
  component: Host,
  args: { why: '댓글을 달려면' },
  globals: { userKind: 'guest' },
  decorators: [behindSheet],
  beforeEach: () => {
    resetLockHits();
    return resetLockHits;
  },
} satisfies Meta<typeof Host>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comment: Story = {};
export const JoinMeet: Story = { args: { why: '번개에 참여하려면' } };
/** 잠긴 챕터 */
export const Chapter: Story = { args: { why: '2과를 하려면' } };
export const LongWhy: Story = { args: { why: '다른 지점 회원들과 함께 주말 정기 모임에 참여하려면' } };
