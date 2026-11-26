import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { StyleSheet, View } from 'react-native';
import { fn } from 'storybook/test';

import { CommentsSheet, StoryReplySheet, type Comment } from '@/components/common/comments-sheet';
import { PText } from '@/components/ui/text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { getMe } from '@/state/me';

import { behindSheet } from '../ui/_overlay';

const styles = StyleSheet.create({
  head: { gap: Spacing.tight / 2, padding: Spacing.stack, marginBottom: Spacing.tight, borderRadius: Radius.cardSm, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
});

const replies = (n: number): Comment[] =>
  Array.from({ length: n }, (_, i) => ({ id: `r${i}`, author: ['Jay', '민서', '라파', '서준'][i % 4], text: `답글 ${i + 1} — 저도 그 표현 좋아해요`, time: `${i + 1}시간`, likes: i }));

/** 글쓴이(하나) 댓글 · 좋아요 누른 댓글 · 답글 · 내 댓글 · 긴 댓글이 섞인 목록 */
const comments = (): Comment[] => [
  { id: 'c1', author: '하나', text: '오늘 세션 정말 재밌었어요! 다음에도 같이 해요 🙌', time: '3시간', likes: 4, replies: replies(1) },
  { id: 'c2', author: 'Leo', text: '"say that again" 표현 오늘 처음 써 봤어요', time: '2시간', likes: 12, liked: true, replies: replies(4) },
  { id: 'c3', author: getMe().name, text: '저도 참여하고 싶어요. 다음 주에도 열리나요?', time: '1시간', mine: true },
  {
    id: 'c4',
    author: '유키',
    text: '아주 긴 댓글이에요. 오늘 세션에서 배운 표현을 정리해 보면, 먼저 인사 표현 세 가지와 주문할 때 쓰는 표현, 그리고 다시 말해 달라고 부탁하는 표현까지 배웠어요. 다음 시간에는 길 묻기를 한대요.',
    time: '방금',
  },
];

/**
 * 댓글 창 — 라운지 · 스토리 · 동아리 · 챌린지 댓글 공통. 화면 84% 시트 · 작성자 표시 · 답글 · 좋아요 · 내 댓글 수정/삭제 · 아래 입력칸.
 * 비회원은 답글 · 보내기에서 체험 안내가 떠요 (좋아요는 그대로).
 */
const meta = {
  title: 'Common/CommentsSheet',
  component: CommentsSheet,
  args: { open: true, onClose: fn(), onSend: fn(), comments: comments(), author: '하나' },
  decorators: [behindSheet],
} satisfies Meta<typeof CommentsSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** 아직 댓글 없음 */
export const Empty: Story = { args: { comments: [] } };
/** 제목 · 입력칸 안내 바꾸기 */
export const CustomTitle: Story = { args: { title: '인증 댓글', placeholder: '응원 한마디 남기기…' } };
/** 목록 맨 위 머리 (표현 챌린지) */
export const WithHead: Story = {
  args: {
    title: '표현 챌린지',
    head: (
      <View style={styles.head}>
        <PText variant="label" color={Colors.purple}>
          오늘의 표현
        </PText>
        <PText variant="title">Could you say that again?</PText>
      </View>
    ),
  },
};
/** 머리만 있고 댓글 없음 — '아직 댓글이 없어요' 대신 머리만 */
export const HeadOnly: Story = { args: { comments: [], head: <PText variant="title">Could you say that again?</PText> } };
/** 스토리 댓글 — '하나에게 댓글 달기' */
export const StoryOther: Story = { args: { author: undefined, story: { who: '하나' } } };
/** 내 스토리 — '내 스토리에 댓글 달기' */
export const StoryMine: Story = { args: { author: undefined, story: { who: '나', mine: true } } };
/** 비회원 (모양은 같고, 답글 · 보내기에서 막혀요) */
export const Guest: Story = { globals: { userKind: 'guest' } };

/** 스토리 답장 (올린 사람에게만 보이는 답장 보내기) */
export const StoryReply: Story = { render: () => <StoryReplySheet open onClose={fn()} who="하나" onSend={fn()} /> };
