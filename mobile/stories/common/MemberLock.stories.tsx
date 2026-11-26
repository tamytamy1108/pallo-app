import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { MemberLock } from '@/components/common/member-lock';

import { padded } from '../_support/padded';

/**
 * '지점 회원이 되면 열려요' 칸 — 아래 행동이 회원 유형(state/access userKind)에 따라 바뀐다.
 * 툴바의 '회원 유형'으로도 바꿔 볼 수 있다.
 */
const meta = {
  title: 'Common/MemberLock',
  component: MemberLock,
  decorators: [padded],
} satisfies Meta<typeof MemberLock>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 비회원 — [체험 신청하기] + '이미 회원이에요 · 연동 요청' */
export const Guest: Story = { globals: { userKind: 'guest' } };
/** 앱 구독만 — 비회원과 같은 행동 */
export const AppOnly: Story = { globals: { userKind: 'app' } };
/** 연동 대기 — 버튼 없이 안내만 */
export const Pending: Story = { globals: { userKind: 'pending' } };
/** 연동 안 됨 — [다시 요청하기] */
export const Rejected: Story = { globals: { userKind: 'rejected' } };
/** 체험 예약 — [체험 예약 보기] */
export const Trial: Story = { globals: { userKind: 'trial' } };
/** 챕터 잠금 문구 (ChapterGate 가 쓰는 제목 · 설명) */
export const ChapterTitle: Story = {
  globals: { userKind: 'guest' },
  args: { title: '2챕터는 지점 회원이 되면 열려요', sub: '비회원은 맵마다 첫 챕터를 끝까지 해 볼 수 있어요.' },
};
