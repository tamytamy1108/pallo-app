import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { userEvent, within } from 'storybook/test';

import ClubDetail from '@/app/(app)/club/[id]';
import { addMyClub, setClubState, setText, toggleIn } from '@/components/meet/meet-store';

import { CLUB_COND, CLUB_FREE, meetState, myClub } from '../../meet/_fixtures';

const route = (id: string) => ({ route: { params: { id }, pathname: `/club/${id}` } });
const FREE = CLUB_FREE.id;

/** 탭 하나를 눌러 연다 (탭은 화면 안 useState 라 play 로 고른다) */
const openTab = (name: string) => async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  await userEvent.click(await within(canvasElement).findByRole('tab', { name }));
};

/**
 * 동아리 상세 (/club/[id]) — 아래 버튼: 가입하기(누구나) · 가입 신청(조건 있음) · 신청 중 · 취소 · 모임 멤버(나가기) · 승인 대기(내가 만든 · 승인 전).
 * 탭: 홈 · 게시판 · 사진첩 · 채팅(가입 전엔 흐린 미리보기). 내 역할: 비멤버 · 신청 중 · 멤버 · 호스트(내가 만듦).
 * 서브 호스트(admin)는 예시 멤버 한 명에게만 붙어 내가 될 수 없다. 서버를 부르지 않아 불러오는 중 · 오류 상태가 없다.
 */
const meta = {
  title: 'Pages/Club/Detail',
  component: ClubDetail,
  parameters: route(FREE),
  beforeEach: meetState(),
} satisfies Meta<typeof ClubDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 비멤버 · 누구나 — [가입하기] */
export const Default: Story = {};
/** 비멤버 · 가입 조건 있음 (Lv.2 이상) — [가입 신청] */
export const Conditional: Story = { parameters: route(CLUB_COND.id) };
/** 가입 신청 중 — [신청 중 · 취소] */
export const Applied: Story = { parameters: route(CLUB_COND.id), beforeEach: meetState(() => setClubState(CLUB_COND.id, 'ask')) };
/** 멤버 — [모임 멤버] · 멤버 수 +1 · 채팅 탭은 아래에 입력 줄 */
export const Member: Story = { beforeEach: meetState(() => setClubState(FREE, 'in')) };
/** 멤버 · 가입 인사 남김 · 찜함 */
export const MemberGreetedSaved: Story = {
  beforeEach: meetState(() => {
    setClubState(FREE, 'in');
    setText('greet', FREE, '영화 대사로 영어 공부해 보고 싶어요. 잘 부탁드려요!');
    toggleIn('saved', FREE);
  }),
};
/** 내가 만든 동아리 (승인 뒤) — 호스트 · 나 · 최근 가입 줄 없음 */
export const Owner: Story = { parameters: route('u-own'), beforeEach: meetState(() => addMyClub(myClub('u-own'))) };
/** 내가 만든 동아리 · 매니저 승인 대기 — [승인 대기] */
export const OwnerWaiting: Story = { parameters: route('u-wait'), beforeEach: meetState(() => addMyClub(myClub('u-wait', true))) };
/** 없는 id */
export const NotFound: Story = { parameters: route('nope') };
/** 비회원 — 모양은 같고, 가입하기를 누르면 체험 안내로 막힌다 */
export const Guest: Story = { globals: { userKind: 'guest' } };

/** 탭별 — 비멤버(흐린 미리보기) */
export const BoardNotMember: Story = { play: openTab('게시판') };
export const AlbumNotMember: Story = { play: openTab('사진첩') };
export const ChatNotMember: Story = { play: openTab('채팅') };
/** 탭별 — 멤버 */
export const BoardMember: Story = { beforeEach: meetState(() => setClubState(FREE, 'in')), play: openTab('게시판') };
export const AlbumMember: Story = { beforeEach: meetState(() => setClubState(FREE, 'in')), play: openTab('사진첩') };
export const ChatMember: Story = { beforeEach: meetState(() => setClubState(FREE, 'in')), play: openTab('채팅') };
