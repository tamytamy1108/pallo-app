import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { SumCard } from '@/components/meet/detail/sheets';

import { padded } from '../_support/padded';

/** 모임 내용 요약 칸 — 제목 있음/없음 · 줄 수 · 긴 글. */
const meta = {
  title: 'Meet/SumCard',
  component: SumCard,
  args: {
    title: '퇴근 후 영어 맥주 번개',
    rows: [
      ['cal', '11월 28일 금 20:00 · D-3'],
      ['pin', '영등포 근처 수제맥주집'],
      ['users', '6 / 8명 · 내가 들어가면 남은 자리 2'],
      ['crown', '호스트 하나 리더'],
      ['heart', '참가비 없음 · 각자 계산'],
    ],
  },
  decorators: [padded],
} satisfies Meta<typeof SumCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NoTitle: Story = { args: { title: undefined, rows: [['cal', '11.28(금) 20:00'], ['users', '4 / 8명 · 남은 자리 4']] } };
export const LongText: Story = { args: { rows: [['pin', '영등포역 3번 출구 앞 골목 안쪽 두 번째 건물 2층 창가 긴 테이블 수제맥주집 · 입구에서 오른쪽으로 들어와 계단을 올라오면 바로 보여요']] } };
