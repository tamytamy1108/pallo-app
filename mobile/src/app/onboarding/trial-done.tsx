import { TrialDoneView } from '@/components/onboarding/trial-done-view';
import { finishOnboarding, useOnboarding } from '@/state/onboarding';

/**
 * 가입 › 체험 예약 확정 — '첫 무대 입장권' (TrialDoneView · 앱 안 /trial/done 과 같은 화면).
 * '앱 둘러보기'(안드로이드 뒤로 키도)에서 가입이 끝나고 홈으로 가요.
 */
export default function OnboardingTrialDone() {
  const onb = useOnboarding();
  return <TrialDoneView booking={onb} button="앱 둘러보기" onDone={finishOnboarding} />;
}
