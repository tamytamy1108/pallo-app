import { useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';

import { AccountPage } from '@/components/account/parts';
import { SavedChallengesList, useSavedChallengesTitle } from '@/components/challenge/saved-sheet';
import { SavedPostsList, useSavedPostsTitle } from '@/components/lounge/saved-posts-sheet';
import { MyMeetsList } from '@/components/my/my-meets-sheet';
import { MeetsList, useMeetsTitle } from '@/components/my/my-sheets';
import { isSavedBox, useSeeHere, type SavedBox } from '@/lib/see';

/**
 * 저장함: ?box=meets(찜한 모임) · joined(내 모임) · challenges(찜한 챌린지) · posts(라운지 저장함).
 * 토스트 [보러가기] (lib/see) · 마이의 내 활동 줄 · '참여중' 칸이 이 화면을 열어요. 보던 화면 위에 쌓여서, 뒤로 가면 누르기 전 그 자리예요.
 * 목록 몸통은 시트와 같은 부품이에요. 줄을 누르면 그 상세가 이 화면 위에 쌓여요.
 */
export default function SavedScreen() {
  const { box: raw } = useLocalSearchParams<{ box?: string }>();
  const box: SavedBox = isSavedBox(raw) ? raw : 'meets';
  // 이 화면에서 다시 찜하면 [보러가기] 를 안 붙여요 (같은 화면이 또 쌓이지 않게)
  useSeeHere(box);
  if (box === 'joined') {
    return (
      <AccountPage title="내 모임" bodyStyle={styles.body}>
        <MyMeetsList />
      </AccountPage>
    );
  }
  if (box === 'challenges') return <ChallengesPage />;
  if (box === 'posts') return <PostsPage />;
  return <MeetsPage />;
}

function MeetsPage() {
  return (
    <AccountPage title={useMeetsTitle('saved')} bodyStyle={styles.body}>
      <MeetsList kind="saved" />
    </AccountPage>
  );
}

function ChallengesPage() {
  return (
    <AccountPage title={useSavedChallengesTitle()} bodyStyle={styles.body}>
      <SavedChallengesList />
    </AccountPage>
  );
}

function PostsPage() {
  return (
    <AccountPage title={useSavedPostsTitle()} bodyStyle={styles.body}>
      <SavedPostsList />
    </AccountPage>
  );
}

// 시트 안과 같은 줄 간격 (Sheet gap 12)
const styles = StyleSheet.create({
  body: { gap: 12 },
});
