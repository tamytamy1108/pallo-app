import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { CheckSheet } from '@/components/challenge/check-sheet';
import { CheerSheet } from '@/components/challenge/cheer-sheet';

import { challenge, setup } from '../lounge/_fixtures';

/**
 * 오늘 인증 시트 — 댓글 방식(한 줄 소감) · 사진 방식 1단계(앨범 · 촬영 고르기, 사진 없이는 다음 못 감) · 표현 챌린지(영어 예시 placeholder).
 * 사진을 고른 2단계는 기기 사진첩(네이티브 피커)이 있어야 해서 여기선 못 본다.
 */
const meta = {
  title: 'Challenge/CheckSheet',
  component: CheckSheet,
  args: { challenge: challenge('c5'), onClose: fn() },
  beforeEach: setup(),
} satisfies Meta<typeof CheckSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 댓글 인증 (아침 루틴) */
export const Comment: Story = {};
/** 사진 + 댓글 인증 — 1단계 사진 고르기 */
export const Photo: Story = { args: { challenge: challenge('c4') } };
/** 표현 챌린지 인증 */
export const Expression: Story = { args: { challenge: challenge('c1') } };

/** 참여하자마자 응원 시트 — [나중에 할게요] [바로 인증하러 가기] */
export const CheerRunning: Story = { render: () => <CheerSheet p={challenge('c4')} open onClose={fn()} onGo={fn()} /> };
/** 시작 전 챌린지에 신청 — '도전 신청 완료!' + [좋아요] */
export const CheerUpcoming: Story = { render: () => <CheerSheet p={{ ...challenge('c4'), id: 'sb-pre', day: 0, start: '11.30 월 시작' }} open onClose={fn()} onGo={fn()} /> };
