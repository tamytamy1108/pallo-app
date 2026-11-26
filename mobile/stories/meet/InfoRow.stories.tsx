import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { CopyBtn, InfoRow, InfoRows } from '@/components/meet/detail/detail-parts';
import { CapBar } from '@/components/meet/parts';

import { padded } from '../_support/padded';

/** 상세 정보 줄 — 아이콘 칸 · 글 · 작은 글 · 오른쪽 버튼(주소 복사). InfoRows 흰 칸 안에 묶는다. */
const meta = {
  title: 'Meet/InfoRow',
  component: InfoRow,
  args: { icon: 'cal', main: '11월 28일 금 20:00', first: true },
  decorators: [
    (Story) => (
      <InfoRows>
        <Story />
      </InfoRows>
    ),
    padded,
  ],
} satisfies Meta<typeof InfoRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MainOnly: Story = {};
export const WithSub: Story = { args: { sub: 'D-3 남았어요' } };
export const WithCopy: Story = { args: { icon: 'pin', main: '영등포 근처 수제맥주집', sub: '서울 영등포구 영등포로 10', end: <CopyBtn text="서울 영등포구 영등포로 10" /> } };
export const LongText: Story = {
  args: {
    icon: 'pin',
    main: '영등포역 3번 출구 앞 골목 안쪽 두 번째 건물 2층 창가 긴 테이블 수제맥주집',
    sub: '입구에서 오른쪽으로 들어와 계단을 올라오면 바로 보여요. 찾기 어려우면 호스트에게 연락해 주세요.',
    end: <CopyBtn text="주소" />,
  },
};
/** 번개 상세 정보 줄 묶음 전체 */
export const Group: Story = {
  decorators: [],
  render: () => (
    <>
      <InfoRow first icon="cal" main="11월 28일 금 20:00" sub="D-3 남았어요" />
      <InfoRow icon="pin" main="영등포 근처 수제맥주집" sub="서울" end={<CopyBtn text="영등포 근처 수제맥주집" />} />
      <InfoRow icon="heart" main="참가비 없음 · 각자 계산" />
      <InfoRow icon="users" main="5 / 8명 · 남은 자리 3" sub={<CapBar cur={5} max={8} width={140} />} />
      <InfoRow icon="crown" main="호스트 하나 리더" />
    </>
  ),
};
