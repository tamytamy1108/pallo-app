import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { KeepToast, behindSheet } from './_overlay';

/**
 * 잠깐 뜨는 알림 (위쪽 · 잉크 바탕 · 노랑 그림자). 진짜는 2.4초(행동 버튼 3.8초) 뒤 사라지는데,
 * 스토리는 보는 동안 계속 다시 띄워요 (KeepToast).
 */
const meta = {
  title: 'UI/Toast',
  component: KeepToast,
  args: { message: '저장했어요' },
  decorators: [behindSheet],
} satisfies Meta<typeof KeepToast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Message: Story = {};
/** 행동 버튼 (되돌리기) */
export const WithAction: Story = { args: { message: '댓글을 지웠어요', action: { label: '되돌리기', onPress: fn() } } };
export const LongMessage: Story = { args: { message: '신고했어요. 매니저가 24시간 안에 확인하고, 처리 결과는 알림으로 알려 드려요' } };
export const LongWithAction: Story = {
  args: { message: '하남점 연동이 필요해요. 지점에 등록한 번호로 다시 요청해 주세요', action: { label: '다시 요청', onPress: fn() } },
};
