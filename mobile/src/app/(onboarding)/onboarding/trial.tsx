import { router } from 'expo-router';

import { useSubmitOnboarding } from '@/api/use-onboarding';
import { TrialForm } from '@/components/onboarding/trial-form';
import { updateOnboarding, useOnboarding } from '@/state/onboarding';

/**
 * 가입 › 체험 예약 (한 장 · 4/4). 칸 · 확인 · 스크롤은 TrialForm (앱 안 체험 예약 /trial 과 같은 화면).
 * 고르는 대로 온보딩 값에 바로 담아서, 뒤로 갔다 와도 그대로예요.
 * 예약하면 가입 전체를 POST /onboarding (TRIAL) 으로 보내고 → 예약 확정 → '앱 둘러보기'에서 세션이 가입을 끝내요.
 * 실패하면 토스트만 띄우고 이 화면에 남아요 (서버는 하나라도 틀리면 아무것도 남기지 않아요).
 */
export default function OnboardingTrial() {
  const onb = useOnboarding();
  const submit = useSubmitOnboarding();
  return (
    <TrialForm
      mode="onboarding"
      value={onb}
      onChange={updateOnboarding}
      busy={submit.isPending}
      onSubmit={(b) => {
        updateOnboarding({ ...b, path: 'trial' });
        submit.mutate('TRIAL', { onSuccess: () => router.replace('/onboarding/trial-done') });
      }}
    />
  );
}
