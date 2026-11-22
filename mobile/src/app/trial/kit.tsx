import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CommentsSheet, StoryReplySheet, type Comment } from '@/components/common/comments-sheet';
import { ReportSheet } from '@/components/common/report-sheet';
import { guardMember, openTrial } from '@/components/common/trial-guide';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { Checkbox, Switch, TextField } from '@/components/ui/field';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-view';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Colors } from '@/constants/theme';
import { updateMe } from '@/state/me';

// 임시 확인용 (공통 부품 캡처) — 끝나면 지워요
const CMTS: Comment[] = [
  { id: 'c1', author: '민준', text: '오 저도 이 표현 써봤어요!', time: '3시간', likes: 6, replies: [{ id: 'c1r', author: '하나', text: '다음엔 같이 연습해요', time: '1시간', likes: 1 }] },
  { id: 'c2', author: '소라', text: '다음 번개는 꼭 갈게요', time: '12시간', likes: 0 },
];

export default function Kit() {
  const { show } = useLocalSearchParams<{ show?: string }>();
  const [open, setOpen] = useState<string | null>(show ?? null);
  const [sw, setSw] = useState(true);
  const [ck, setCk] = useState(false);
  const close = () => setOpen(null);
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.body}>
        <PText variant="headline">공통 부품</PText>
        {['comments', 'empty', 'menu', 'report', 'block', 'confirm', 'confirm2', 'card', 'reply'].map((k) => (
          <Button key={k} label={k} variant="secondary" onPress={() => setOpen(k)} />
        ))}
        <Button label="toast" variant="secondary" onPress={() => showToast('저장했어요', { label: '바로 보기', onPress: () => {} })} />
        <Button
          label="guest gate"
          variant="secondary"
          onPress={() => {
            updateMe({ role: 'guest' });
            guardMember(() => {}, '댓글을 달려면');
          }}
        />
        <Button label="openTrial ja" variant="secondary" onPress={() => openTrial({ lang: '일본어' })} />
        <TextField label="이름" placeholder="홍길동" />
        <TextField placeholder="예) 저도 그 표현 써 봤어요!" multiline />
        <Checkbox checked={ck} onChange={setCk} label="피드에도 올리기" sub="24시간 뒤에도 남아요" />
        <Switch value={sw} onValueChange={setSw} label="세션 알림" sub="세션 1시간 전" />
        <View style={styles.card}>
          <EmptyState title={'이날은 번개가 없어요.'} link={{ label: '이날 번개 열기 ›', onPress: () => {} }} />
        </View>
        <LoadingState />
        <ErrorState onRetry={() => {}} />
      </ScrollView>
      <CommentsSheet open={open === 'comments'} onClose={close} comments={CMTS} author="하나" />
      <CommentsSheet open={open === 'empty'} onClose={close} comments={[]} />
      <ReportSheet open={open === 'menu'} onClose={close} target={{ kind: 'post', name: '하나' }} />
      <ReportSheet open={open === 'report'} onClose={close} target={{ kind: 'post', name: '하나' }} start="report" />
      <ReportSheet open={open === 'block'} onClose={close} target={{ kind: 'member', name: '하나' }} start="block" />
      <ConfirmDialog open={open === 'confirm'} title="참여를 취소할까요?" message="퇴근 후 영어 맥주 번개 · 11월 14일" confirmLabel="참여 취소" destructive onConfirm={close} onCancel={close} />
      <ConfirmDialog open={open === 'confirm2'} title="로그아웃할까요?" message="다시 로그인하면 기록은 그대로 있어요." confirmLabel="로그아웃" onConfirm={close} onCancel={close} />
      <ConfirmDialog
        open={open === 'card'}
        variant="card"
        title="정말 그만할까요?"
        message="3문제만 더 하면 끝나요"
        confirmLabel="그만하기"
        cancelLabel="계속하기"
        destructive
        confirmSfx="quit"
        onConfirm={close}
        onCancel={close}
      />
      <StoryReplySheet open={open === 'reply'} onClose={close} who="유키" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  body: { padding: 16, gap: 10 },
  card: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 22, backgroundColor: Colors.white },
});
