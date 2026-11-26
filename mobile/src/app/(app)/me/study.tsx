import { StyleSheet } from 'react-native';

import { apiErrorMessage } from '@/api/errors';
import { useMyPage } from '@/api/use-my-page';
import { MyStudyCard } from '@/components/account/my-study-card';
import { AccountPage } from '@/components/account/parts';
import { MemberOnly } from '@/components/common/member-lock';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-view';

/**
 * 내 스터디 (알림 · 홈에서 바로 여는 주소). 프로토타입은 마이 화면 안 카드(myStudyHTML)뿐이라 같은 카드를 그대로 보여 줘요.
 * 값은 마이 BFF(GET /me/mypage study) — 이용 중인 멤버십이 없으면(null) 빈 상태.
 */
function MyStudyScreen() {
  const page = useMyPage();
  return (
    <AccountPage title="내 스터디" bodyStyle={styles.body}>
      {page.isPending ? (
        <LoadingState />
      ) : page.isError ? (
        <ErrorState message={apiErrorMessage(page.error)} onRetry={() => page.refetch()} />
      ) : page.data.study ? (
        <MyStudyCard study={page.data.study} title={false} />
      ) : (
        <EmptyState title="이용 중인 이용권이 없어요" />
      )}
    </AccountPage>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: 16, paddingBottom: 40 },
});

/** 회원 전용 화면 (state/access 'myStudy'): 비회원이 알림 · 주소로 바로 들어와도 '지점 회원이 되면 열려요' 칸만 보여요 */
export default function MyStudyScreenGate() {
  return (
    <MemberOnly feature="myStudy" title="내 스터디">
      <MyStudyScreen />
    </MemberOnly>
  );
}
