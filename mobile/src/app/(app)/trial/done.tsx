import { Redirect } from 'expo-router';

import { leaveTrial } from '@/components/common/trial-guide';
import { bodySrcOf } from '@/components/onboarding/start-palloro';
import { TrialDoneView } from '@/components/onboarding/trial-done-view';
import { useMyAvatar } from '@/state/avatar';
import { useLastTrial } from '@/state/trial-booking';

/**
 * 앱 안 체험 예약 확정 — 가입 때와 같은 '첫 무대 입장권' (TrialDoneView). 무대에는 마이에서 꾸민 몸 색 팔로로.
 * '확인'(안드로이드 뒤로 키도) → 예약을 시작했던 화면으로 (홈이면 체험 예약 카드가 바로 보여요).
 */
export default function TrialDoneScreen() {
  const booking = useLastTrial();
  const avatar = useMyAvatar();
  if (!booking) return <Redirect href="/home" />;
  return <TrialDoneView booking={booking} button="확인" onDone={leaveTrial} hero={bodySrcOf(avatar.color)} />;
}
