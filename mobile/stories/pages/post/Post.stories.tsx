import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import PostScreen from '@/app/(app)/post/[id]';
import { blockMember } from '@/components/common/report-sheet';
import { hideMember, toggleLike } from '@/data/lounge-store';

import { setup } from '../../lounge/_fixtures';

const at = (id: string) => ({ route: { params: { id }, pathname: `/post/${id}` } });

/** 글 하나 보기 (/post/[id]) — 사진 글 · 해외살이 글 · 없는 글 · 차단 · 숨김 · 글이 아닌 것(동행 등)은 '글을 볼 수 없어요'. */
const meta = {
  title: 'Pages/Post',
  component: PostScreen,
  parameters: at('p1'),
  beforeEach: setup(),
} satisfies Meta<typeof PostScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 리더 사진 글 (4장) */
export const Default: Story = {};
/** 좋아요 누른 글 */
export const Liked: Story = { beforeEach: setup(() => toggleLike('p1')) };
/** 동아리 글 */
export const ClubPost: Story = { parameters: at('p3') };
/** 해외살이 이야기 */
export const Abroad: Story = { parameters: at('a1') };
/** 없는 글 */
export const NotFound: Story = { parameters: at('nope') };
/** 동행 · 번개 같은 글이 아닌 것 */
export const NotAPost: Story = { parameters: at('t1') };
/** 글쓴이를 차단함 */
export const BlockedAuthor: Story = { beforeEach: setup(() => blockMember('하나')) };
/** 리더 · 매니저가 숨긴 사람의 글 */
export const HiddenAuthor: Story = { beforeEach: setup(() => hideMember('하나')) };
/** 비회원 */
export const AsGuest: Story = { globals: { userKind: 'guest' } };
