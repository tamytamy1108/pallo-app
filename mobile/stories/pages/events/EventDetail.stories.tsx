import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import EventDetail from '@/app/(app)/events/[id]';
import { toggleIn } from '@/components/meet/meet-store';

import { applied, fillUp, PARTY_ANSWERS } from '../../event/_fixtures';
import { freshDevice } from '../../_support/fresh-device';

const at = (id: string) => ({ route: { params: { id }, pathname: `/events/${id}` } });

/**
 * 이벤트 상세 (/events/:id) — 정보 줄 · 소개 · 함께하는 멤버 · 아래 [찜][참가비][주 버튼].
 * 주 버튼: 참여하기 · 남은 자리 n / 참여 완료(누르면 취소 확인) / 빈자리 알림 받기 · 알림 받는 중(마감) / 후기 보기(지난 이벤트).
 * 신청하면 제목 아래 '내 신청' 카드. 이벤트는 가짜 데이터라 불러오는 중 · 오류 상태가 없다.
 */
const meta = {
  title: 'Pages/Events/Detail',
  component: EventDetail,
  parameters: at('m2'),
  beforeEach: freshDevice(),
} satisfies Meta<typeof EventDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 다가옴 · 유료(할인) · 신청 설문 3개 */
export const Default: Story = {};
/** 무료 · 설문 없음 */
export const Free: Story = { parameters: at('e1') };
/** 여행 · 1박 2일 · 캠프 설문 */
export const Trip: Story = { parameters: at('e4') };
/** 신청함 · 유료 — '내 신청'(계좌 + 설문 답) · 참여 완료 */
export const AppliedPaid: Story = { beforeEach: freshDevice(() => applied('m2', PARTY_ANSWERS)) };
/** 신청함 · 무료 */
export const AppliedFree: Story = { parameters: at('e1'), beforeEach: freshDevice(() => applied('e1')) };
/** 찜함 */
export const Saved: Story = { beforeEach: freshDevice(() => toggleIn('saved', 'm2')) };
/** 마감 — 빈자리 알림 받기 */
export const Full: Story = { parameters: at('e1'), beforeEach: freshDevice(() => fillUp('e1')) };
/** 마감 · 알림 받는 중 */
export const FullWatching: Story = {
  parameters: at('e1'),
  beforeEach: freshDevice(() => {
    toggleIn('vac', 'e1');
    return fillUp('e1');
  }),
};
/** 지난 이벤트 · 긴 소개(진행 기록) — 후기 보기 */
export const Past: Story = { parameters: at('e7') };
/** 지난 무료 이벤트 */
export const PastFree: Story = { parameters: at('e6') };
/** 비회원 (주 버튼은 누르면 체험 안내) */
export const Guest: Story = { globals: { userKind: 'guest' } };
/** 없는 이벤트 id */
export const NotFound: Story = { parameters: at('nope') };
