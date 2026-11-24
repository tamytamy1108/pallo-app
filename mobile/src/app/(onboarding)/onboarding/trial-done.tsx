import { apiErrorMessage } from '@/api/errors';
import { useCompleteOnboarding } from '@/api/session';
import { TrialDoneView } from '@/components/onboarding/trial-done-view';
import { showToast } from '@/components/ui/toast';
import { useOnboarding } from '@/state/onboarding';

/**
 * 가입 › 체험 예약 확정 — '첫 무대 입장권' (TrialDoneView · 앱 안 /trial/done 과 같은 화면).
 * '앱 둘러보기'(안드로이드 뒤로 키도)에서 가입이 끝나요 → 로그인 상태가 needsOnboarding=false 가 되고 app/_layout.tsx 가 홈으로 보내요.
 */
export default function OnboardingTrialDone() {
  const onb = useOnboarding();
  const { mutate: complete } = useCompleteOnboarding();
  return <TrialDoneView booking={onb} button="앱 둘러보기" onDone={() => complete(undefined, { onError: (e) => showToast(apiErrorMessage(e)) })} />;
}
