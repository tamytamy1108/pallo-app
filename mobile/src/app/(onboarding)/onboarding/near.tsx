import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BranchPicker } from '@/components/onboarding/branch-sheet';
import { OnbScreen } from '@/components/onboarding/parts';
import { stepsFor, updateOnboarding, useOnboarding } from '@/state/onboarding';

/**
 * 가입 › 앱 구경 › 나에게 가장 가까운 지점 (6/6).
 * 지점 하나를 누르면 그 지점 안내 전체 화면(onboarding/branch)으로 가요. 거기서 '앱 둘러보기' → 홈.
 * 고른 지점은 나의 지점(me.branch)이 돼요 (연동은 아니라서 비회원 권한 그대로).
 */
export default function OnboardingNear() {
  const branch = useOnboarding((s) => s.branch);
  return (
    <OnbScreen step={6} total={stepsFor('app')} title={'나에게 가장\n가까운 지점은?'}>
      <View style={styles.picker}>
        <BranchPicker
          value={branch || null}
          onPick={(b) => {
            updateOnboarding({ branch: b.name });
            router.push('/onboarding/branch');
          }}
        />
      </View>
    </OnbScreen>
  );
}

const styles = StyleSheet.create({
  // 제목과 검색 칸 사이 (회원 확인 화면 첫 카드와 같은 20)
  picker: { marginTop: 20 },
});
