import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { PostCard } from '@/components/lounge/post-card';
import { LG_C } from '@/data/lounge';
import { addPostComment, toggleLike, toggleSave } from '@/data/lounge-store';
import { getMe } from '@/state/me';

import { padded } from '../_support/padded';
import { feedItem, LONG_TEXT, photoUri, postOf, setup } from './_fixtures';

const p1 = feedItem('p1', 'post');
const p5 = feedItem('p5', 'post');

/**
 * 커뮤니티 사진 글 카드 — 머리(이름 · 역할 · 학습 언어 · 지점) · 사진(여러 장 · 한 장 · 올린 사진) · 하트/댓글/저장 줄 · 글.
 * 좋아요 · 저장 · 댓글은 라운지 가게(기기 저장) 값이라 스토리마다 처음 값에서 맞춘다.
 */
const meta = {
  title: 'Lounge/PostCard',
  component: PostCard,
  args: { p: p1 },
  decorators: [padded],
  beforeEach: setup(),
} satisfies Meta<typeof PostCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 리더 글 · 사진 4장 (1/4 표시 · 점) · 댓글 예시 2개 */
export const Default: Story = {};
/** 사진 1장 (점 · 장 수 표시 없음) · 역할 없음 */
export const SinglePhoto: Story = { args: { p: p5 } };
/** 동아리 글 (지점 뒤에 동아리 이름) · 두 지점 회원 */
export const ClubPost: Story = { args: { p: feedItem('p3', 'post') } };
/** 매니저 글 */
export const ManagerPost: Story = { args: { p: feedItem('p8', 'post') } };
/** 좋아요 누름 (분홍 하트 · 수 +1) */
export const Liked: Story = { beforeEach: setup(() => toggleLike('p1')) };
/** 저장함 (노랑 책갈피) */
export const Saved: Story = { beforeEach: setup(() => void toggleSave('p1')) };
/** 좋아요 · 저장 둘 다 */
export const LikedAndSaved: Story = { beforeEach: setup(() => (toggleLike('p1'), void toggleSave('p1'))) };
/** 새 글 — 좋아요 0 · 댓글 0 (수 자리가 비어 있다) */
export const NoLikesNoComments: Story = { args: { p: postOf(p5, { id: 'sb-new', likes: 0, c0: 0, time: '방금' }) } };
/** 댓글 많음 (예시 2 + 내가 단 것 12) */
export const ManyComments: Story = {
  beforeEach: setup(() => {
    for (let i = 0; i < 12; i++) addPostComment(p1, getMe().name, `댓글 ${i + 1}번째 — 저도 다음 세션에 써 볼게요!`);
  }),
};
/** 내가 올린 글 (내 이름 · 내가 꾸민 얼굴 · 올린 사진 2장 · 세로 비율) */
export const OwnPost: Story = {
  render: (args) => (
    <PostCard
      {...args}
      p={postOf(p1, {
        id: 'sb-mine',
        who: getMe().name,
        av: LG_C.y,
        br: getMe().branch,
        role: '',
        time: '방금',
        pic: undefined,
        imgs: [photoUri('#C9B8F0', 'MY PHOTO 1', 1080, 1350), photoUri('#9FD8F5', 'MY PHOTO 2', 1080, 1350)],
        ratio: 0.8,
        n: 2,
        likes: 0,
        c0: 0,
        mine: true,
        text: '오늘 세션 끝나고 찍은 사진!',
      })}
    />
  ),
};
/** 올린 사진 1장 · 가로 비율 1.91 */
export const UploadedWide: Story = {
  args: { p: postOf(p5, { id: 'sb-wide', pic: undefined, imgs: [photoUri('#FFB3C7', 'WIDE', 1910, 1000)], ratio: 1.91 }) },
};
/** 긴 글 · 긴 이름 */
export const LongText: Story = { args: { p: postOf(p1, { id: 'sb-long', who: '아주아주긴이름을가진멤버님', text: LONG_TEXT }) } };
/** 비회원이 볼 때 (모양은 같고, 댓글을 달면 회원 안내) */
export const AsGuest: Story = { globals: { userKind: 'guest' } };
