import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { ReportSheet } from '@/components/common/report-sheet';

import { behindSheet } from '../ui/_overlay';

/**
 * 신고 · 차단 시트 — 한 시트 안에서 메뉴 → 사유 고르기로 넘어가요. start 로 사유부터 열 수 있어요.
 * 사유를 고르기 전에는 [신고하기] · [차단하기] 가 꺼져 있어요.
 * 신고 사유는 가짜 서버(api/reports — GET /reports/reasons), [신고하기] 는 POST /reports.
 */
const meta = {
  title: 'Common/ReportSheet',
  component: ReportSheet,
  args: { open: true, onClose: fn(), onBlocked: fn(), onReported: fn(), onUnblocked: fn(), target: { kind: 'post', name: '하나' } },
  argTypes: { start: { control: 'inline-radio', options: ['menu', 'report', 'block'] } },
  decorators: [behindSheet],
} satisfies Meta<typeof ReportSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 글 ⋯ 메뉴 — '하나의 글' · 신고하기 · 차단하기 */
export const Menu: Story = {};
/** 멤버 메뉴 — 제목이 이름 */
export const MemberMenu: Story = { args: { target: { kind: 'member', name: 'Leo' } } };
/** 메뉴 제목 직접 */
export const CustomTitle: Story = { args: { target: { kind: 'comment', name: '민서', title: '민서의 댓글' } } };
/** 리더 · 매니저 도구 줄이 위에 더 붙어요 */
export const WithExtra: Story = {
  args: {
    extra: [
      { key: 'pin', label: '공지로 고정', sub: '라운지 맨 위에 보여요', onPress: fn() },
      { key: 'hide', label: '이 글 숨기기', onPress: fn() },
      { key: 'box', label: '신고함 보기', sub: '이 글 신고 2건', onPress: fn() },
    ],
  },
};
/** 신고 사유 고르기 (바로 열기) */
export const Report: Story = { args: { start: 'report' } };
/** 신고 사유를 받는 중 */
export const ReportLoading: Story = { args: { start: 'report' }, parameters: { api: { delayMs: 60_000 } } };
/** 신고 사유를 못 받았어요 — [다시 불러오기] */
export const ReportReasonsError: Story = { args: { start: 'report' }, parameters: { api: { fail: ['reportReasons'] } } };
/** 신고 보내기 실패 — 사유를 골라 [신고하기] 를 누르면 오류 토스트 */
export const ReportSendError: Story = { args: { start: 'report' }, parameters: { api: { fail: ['createReport'] } } };
/** 차단 사유 고르기 (바로 열기 · 빨간 버튼) */
export const Block: Story = { args: { start: 'block', target: { kind: 'member', name: 'Leo' } } };
/** 긴 이름 */
export const LongName: Story = { args: { start: 'block', target: { kind: 'member', name: '아주긴닉네임을가진멤버님' } } };
