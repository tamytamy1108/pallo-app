import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import MeetDetail from '@/app/(app)/meet/[id]';
import { addMyMeet, setText, toggleIn } from '@/components/meet/meet-store';

import { meetState, PHOTO, PHOTO2, upcomingMeet } from '../../meet/_fixtures';

const route = (id: string) => ({ route: { params: { id }, pathname: `/meet/${id}` } });

/** 다가오는 번개를 가게에 넣는다 (예시 번개 MEETS 는 날짜가 지나 모두 '후기 보기'라서) */
const withMeet = (over: Parameters<typeof upcomingMeet>[2] = {}, n = 3, extra?: () => void) =>
  meetState(() => {
    addMyMeet(upcomingMeet('p-meet', n, over));
    extra?.();
  });

/**
 * 번개 상세 (/meet/[id]) — 아래 고정 버튼이 상태마다 바뀐다:
 * 참여하기 · 남은 자리 n(모집 중) · 참여 완료(내가 참여 → 누르면 취소 확인) · 빈자리 알림 받기/받는 중(마감)
 * · 모집 닫기/닫음(내가 연 번개) · 후기 보기(지남). 찜 켜짐/꺼짐. 없는 id 면 '모임을 찾을 수 없어요'.
 * 이 화면은 서버를 부르지 않는다(가짜 가게 데이터) — 불러오는 중 · 오류 상태가 없다.
 */
const meta = {
  title: 'Pages/Meet/Detail',
  component: MeetDetail,
  parameters: route('p-meet'),
  beforeEach: withMeet(),
} satisfies Meta<typeof MeetDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 모집 중 · 8명 중 5명 · 참여 전 */
export const Default: Story = {};
/** 아무도 없음 · 오늘 (D-DAY) */
export const TodayNoOne: Story = { beforeEach: withMeet({ cur: 0 }, 0) };
/** 마지막 한 자리 */
export const LastSeat: Story = { beforeEach: withMeet({ cur: 7 }) };
/** 내가 참여함 — '참여 완료' · 멤버 맨 앞에 나 + 인사 입력 칸 */
export const Joined: Story = { beforeEach: withMeet({}, 3, () => toggleIn('joined', 'p-meet')) };
/** 참여 · 인사 남김 — 내 줄에 수정 · 삭제 */
export const JoinedWithGreeting: Story = {
  beforeEach: withMeet({}, 3, () => {
    toggleIn('joined', 'p-meet');
    setText('mhi', 'p-meet', '퇴근하고 바로 갈게요! 반가워요.');
  }),
};
/** 찜함 */
export const Saved: Story = { beforeEach: withMeet({}, 3, () => toggleIn('saved', 'p-meet')) };
/** 마감 — '빈자리 알림 받기' */
export const Full: Story = { beforeEach: withMeet({ cur: 8, max: 8 }) };
/** 마감 · 빈자리 알림 받는 중 */
export const FullWaitlist: Story = { beforeEach: withMeet({ cur: 8, max: 8 }, 3, () => toggleIn('vac', 'p-meet')) };
/** 내가 연 번개 — '모집 닫기' · 멤버에 '호스트 · 나' */
export const Host: Story = { beforeEach: withMeet({ mine: true, host: '태미', cur: 1, max: 6, addr: '서울 영등포구 영등포로 10', addr2: '3층 창가 긴 테이블' }) };
/** 내가 연 번개 · 모집 닫음 */
export const HostClosed: Story = { beforeEach: withMeet({ mine: true, closed: true, host: '태미', cur: 4, max: 6 }) };
/** 올린 포스터 사진 2장 */
export const UploadedPosters: Story = { beforeEach: withMeet({ posters: [PHOTO, PHOTO2] }) };
/** 멤버가 많음 — 5명 + '모두 보기' */
export const ManyMembers: Story = { beforeEach: withMeet({ cur: 9, max: 12 }) };
/** 지난 번개 (예시 m1) — '후기 보기' · '끝난 모임이에요' */
export const Past: Story = { parameters: route('m1'), beforeEach: meetState() };
/** 지난 번개 · 정원이 찼던 모임 (예시 m6) */
export const PastFull: Story = { parameters: route('m6'), beforeEach: meetState() };
/** 없는 id */
export const NotFound: Story = { parameters: route('nope'), beforeEach: meetState() };
/** 비회원 — 모양은 같고, 참여하기를 누르면 체험 안내로 막힌다 */
export const Guest: Story = { globals: { userKind: 'guest' } };
/** 연동 대기 회원 */
export const PendingMember: Story = { globals: { userKind: 'pending' } };
