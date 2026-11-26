import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { ClubBoard } from '@/components/meet/club/club-board';
import { setBoard, setText, toggleIn } from '@/components/meet/meet-store';

import { padded } from '../_support/padded';
import { CLUB_FREE, meetState } from './_fixtures';

/** 동아리 게시판 탭 — 필터 칩 + 오른쪽 끝 글쓰기 · 필독 공지(누르면 글 전체) · 글(좋아요 · 댓글 · 내 글 삭제). 가입 전엔 글 2개 흐리게 + '글 n개 더'. */
const meta = {
  title: 'Meet/ClubBoard',
  component: ClubBoard,
  args: { c: CLUB_FREE, inC: true, myName: '태미', staff: ['민서'] },
  decorators: [padded],
  beforeEach: meetState(),
} satisfies Meta<typeof ClubBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 멤버 — 글쓰기 + 전체 글 */
export const Member: Story = {};
/** 호스트 — 글 아래 '필독으로' · 필독 글을 누르면 '필독 풀기' · 글쓰기에 '필독으로 올리기' */
export const Host: Story = { args: { isHost: true } };
/** 비멤버 — 흐린 미리보기 */
export const NotMember: Story = { args: { inC: false } };
/** 가입 인사를 남김 — '가입 인사' 글이 내 글로 올라감(삭제 가능) · 좋아요 누른 글 */
export const WithMyGreeting: Story = {
  beforeEach: meetState(() => {
    setText('greet', CLUB_FREE.id, '안녕하세요! 영화 대사로 영어 공부해 보고 싶어요.');
    toggleIn('bliked', CLUB_FREE.id + 'b0');
  }),
};
/** 글이 하나도 없음 — '아직 글이 없어요.' */
export const Empty: Story = { beforeEach: meetState(() => setBoard(CLUB_FREE.id, [])) };
/** 아주 긴 글 */
export const LongPost: Story = {
  beforeEach: meetState(() =>
    setBoard(CLUB_FREE.id, [
      { id: 'lp', k: 'rev', w: '민준', ti: '지난주 모임 후기 — 처음 와 봤는데 너무 좋았어요, 다음에도 꼭 올게요!', bd: '영화 한 장면을 골라 대사를 따라 하고 서로 발음을 봐 주는 방식이었어요. '.repeat(6), t: '어제', lk: 12, cm: [['소라', '반가웠어요!']] },
    ]),
  ),
};
