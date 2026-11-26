import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { ConfirmDialog } from '@/components/ui/dialog';

import { behindSheet } from './_overlay';

/**
 * 되돌릴 수 없는 행동 전에 묻는 확인 창.
 * sheet(기본): 아래 시트 · cancelLabel 이 있으면 [취소][확인] 두 칸, 없으면 확인 하나. card: 학습 화면 흰 카드 + 캐릭터.
 */
const meta = {
  title: 'UI/ConfirmDialog',
  component: ConfirmDialog,
  args: {
    open: true,
    title: '참여를 취소할까요?',
    message: '취소하면 자리가 다른 멤버에게 넘어가요.',
    confirmLabel: '참여 취소',
    onConfirm: fn(),
    onCancel: fn(),
  },
  argTypes: { variant: { control: 'inline-radio', options: ['sheet', 'card'] } },
  decorators: [behindSheet],
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 시트 · 확인 버튼 하나 (노랑) */
export const SheetSingle: Story = {};
/** 시트 · 버튼 하나 · 되돌릴 수 없는 행동 (흰 버튼) */
export const SheetSingleDestructive: Story = { args: { title: '로그아웃할까요?', message: undefined, confirmLabel: '로그아웃', destructive: true } };
/** 시트 · [취소][확인] */
export const SheetTwoButtons: Story = { args: { cancelLabel: '그대로 둘게요' } };
/** 시트 · [취소][빨간 확인] */
export const SheetTwoButtonsDestructive: Story = { args: { title: '동아리에서 나갈까요?', confirmLabel: '나가기', cancelLabel: '취소', destructive: true } };
/** 설명 없이 제목만 */
export const SheetNoMessage: Story = { args: { message: undefined } };
export const SheetLongText: Story = {
  args: {
    title: '정말로 탈퇴할까요? 탈퇴하면 모든 기록이 사라지고 되돌릴 수 없어요',
    message: '출석 기록 · 스파크 · 꾸미기 아이템 · 라운지 글과 댓글이 모두 지워져요. 지점 회원 정보는 지점에 그대로 남아요. 다시 가입하면 처음부터 시작해요.',
    confirmLabel: '탈퇴하기',
    cancelLabel: '취소',
    destructive: true,
  },
};

/** 카드 · 머무는 쪽(확인)이 노란 버튼 */
export const Card: Story = { args: { variant: 'card', title: '잠깐 쉬어 갈까요?', message: '지금까지 한 건 저장돼요.', confirmLabel: '계속하기', cancelLabel: '나중에' } };
/** 카드 · 되돌릴 수 없는 행동 — 머무는 쪽(취소)이 노랑, 그만하기는 아래 테두리 버튼 */
export const CardDestructive: Story = {
  args: { variant: 'card', title: '학습을 그만할까요?', message: '이번 단계 진행은 저장되지 않아요.', confirmLabel: '그만하기', cancelLabel: '계속하기', destructive: true, confirmSfx: 'quit' },
};
/** 카드 · 기본 '취소' · 설명 없음 */
export const CardNoMessage: Story = { args: { variant: 'card', title: '다음 단계로 갈까요?', message: undefined, confirmLabel: '갈래요' } };
/** 카드 · 다른 캐릭터 그림 */
export const CardCustomImage: Story = {
  args: { variant: 'card', title: '오늘 목표를 다 했어요!', message: undefined, confirmLabel: '좋아요', image: require('@/assets/characters/c-upright-yellow.png') },
};
