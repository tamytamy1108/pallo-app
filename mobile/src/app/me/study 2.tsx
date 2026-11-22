import { StyleSheet } from 'react-native';

import { MyStudyCard } from '@/components/account/my-study-card';
import { AccountPage } from '@/components/account/parts';

/**
 * 내 스터디 (알림 · 홈에서 바로 여는 주소). 프로토타입은 마이 화면 안 카드(myStudyHTML)뿐이라 같은 카드를 그대로 보여 줘요.
 * 맞는 API: 37 `/me/membership` · `/me/teams`
 */
export default function MyStudyScreen() {
  return (
    <AccountPage title="내 스터디" bodyStyle={styles.body}>
      <MyStudyCard title={false} />
    </AccountPage>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: 16, paddingBottom: 40 },
});
