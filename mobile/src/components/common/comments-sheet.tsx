import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { Colors } from '@/constants/theme';

export type Comment = { id: string; author: string; text: string; time: string; mine?: boolean; likes?: number };

export type CommentsSheetProps = {
  open: boolean;
  onClose: () => void;
  comments: Comment[];
  onSend?: (text: string) => void;
  title?: string;
};

/**
 * 댓글 창 — 라운지 글 · 스토리 · 챌린지 · 번개 · 이벤트 모든 댓글을 이걸로 통일 (docs/pages/08-common.md '댓글 창').
 * 담당: 공통 부품 — 프로토타입 lgComments 모양 · 신고 연결까지 채워요. props 는 바꾸지 않아요(늘리기만).
 */
export function CommentsSheet({ open, onClose, comments, onSend, title = '댓글' }: CommentsSheetProps) {
  const [text, setText] = useState('');
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`${title} ${comments.length}`}
      footer={
        <View style={styles.compose}>
          <View style={styles.input}>
            <TextField value={text} onChangeText={setText} placeholder="댓글 달기" />
          </View>
          <Button
            label="보내기"
            disabled={!text.trim()}
            onPress={() => {
              onSend?.(text.trim());
              setText('');
            }}
          />
        </View>
      }>
      {comments.map((c) => (
        <View key={c.id} style={styles.item}>
          <PText variant="bodyStrong">{c.author}</PText>
          <PText>{c.text}</PText>
          <PText variant="small" color={Colors.inkSub}>
            {c.time}
          </PText>
        </View>
      ))}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  compose: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: { flex: 1 },
  item: { paddingVertical: 10, borderBottomWidth: 1, borderColor: Colors.line, gap: 2 },
});
