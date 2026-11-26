import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { AskSheet } from '@/components/meet/detail/sheets';

/** 확인 시트 하나 — 참여 취소 · 동아리 나가기 · 신청 취소. 설명은 있어도 없어도 된다. */
const meta = {
  title: 'Meet/AskSheet',
  component: AskSheet,
  args: { open: true, onClose: fn(), onConfirm: fn(), title: '참여를 취소할까요?', desc: '퇴근 후 영어 맥주 번개 · 11월 28일', button: '참여 취소' },
} satisfies Meta<typeof AskSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CancelJoin: Story = {};
export const LeaveClub: Story = { args: { title: '동아리에서 나갈까요?', desc: '나가면 게시판 · 사진첩 · 채팅을 볼 수 없고, 참석하기로 한 정기 모임도 함께 취소돼요.', button: '나가기' } };
export const NoDesc: Story = { args: { title: '가입 신청을 취소할까요?', desc: undefined, button: '신청 취소' } };
