import { router } from 'expo-router';

import { TrialForm } from '@/components/onboarding/trial-form';
import { updateOnboarding, useOnboarding } from '@/state/onboarding';

/**
 * 가입 › 체험 예약 (한 장 · 4/4). 칸 · 확인 · 스크롤은 TrialForm (앱 안 체험 예약 /trial 과 같은 화면).
 * 고르는 대로 온보딩 값에 바로 담아서, 뒤로 갔다 와도 그대로예요. 예약하면 예약 확정 → '앱 둘러보기'에서 가입이 끝나요.
 */
export default function OnboardingTrial() {
  const onb = useOnboarding();
  return (
    <TrialForm
      mode="onboarding"
      value={onb}
      onChange={updateOnboarding}
      onSubmit={(b) => {
        updateOnboarding({ ...b, path: 'trial' });
        router.replace('/onboarding/trial-done');
      }}
    />
  );
}
