import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { DoneMark, DoneSheet } from '@/components/meet/detail/sheets';
import { PText } from '@/components/ui/text';

/** 다 한 뒤 안내 시트 — 체크 동그라미 · 제목 · 설명 · (입력 칸) · [주 버튼] + 다음에 할게요. */
const meta = {
  title: 'Meet/DoneSheet',
  component: DoneSheet,
  args: {
    open: true,
    onClose: fn(),
    onMain: fn(),
    onSkip: fn(),
    label: '가입 인사',
    title: '영화 대사 따라 하기에 가입했어요!',
    desc: "가입 인사 남길래요? 게시판 '가입 인사'와 멤버 목록에 보여요.",
    button: '인사 남기기',
  },
} satisfies Meta<typeof DoneSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Joined: Story = {};
export const Applied: Story = { args: { title: '가입 신청을 보냈어요', desc: '호스트 소라가 확인하면 알려 드려요. 그동안 가입 인사를 미리 남길래요?' } };
export const WithChildren: Story = { args: { title: '참석 완료!', desc: '전날 알림을 보내 드려요.', button: '인사말 남기기', children: <PText variant="small">(여기에 입력 칸 같은 추가 내용이 들어가요)</PText> } };
/** 체크 동그라미만 */
export const Mark: Story = { render: () => <DoneMark /> };
