/**
 * 표현을 저장하면 챌린지로 이어 주는 알림 (프로토타입 chalToast).
 * - 같은 표현 챌린지가 기간 중이면: '같은 표현 챌린지가 있어요' + [참여하기] → 그 챌린지
 * - 없으면: '챌린지로 열 수 있어요' + [챌린지 열기] → 챌린지 열기 창 (그 표현 골라 둠)
 * TOPIC 이야기하기처럼 챌린지를 열지 않는 코너는 부르지 않아요 (noChal).
 */
import { router, type Href } from 'expo-router';

import { showToast } from '@/components/ui/toast';
import { findSameExpr, getChallengeState } from '@/data/challenge';
import { getSavedExpressions } from '@/state/expressions';
import { seeAt, SEE } from '@/lib/see';

let off = false;
/** 이 화면에서는 챌린지 알림 없이 저장만 (TOPIC 이야기하기) — 화면을 닫을 때 false 로 */
export const setChallengeOfferOff = (v: boolean) => {
  off = v;
};

export function offerChallenge(en: string, head = '내 표현함에 저장했어요') {
  if (off) {
    showToast(head, seeAt(SEE.expressions));
    return;
  }
  const dup = findSameExpr(getChallengeState(), en);
  if (dup) {
    showToast(`${head} · 같은 표현 챌린지가 있어요`, { label: '참여하기', onPress: () => router.push({ pathname: '/challenge/[id]', params: { id: dup.id } }) });
    return;
  }
  const saved = getSavedExpressions().find((x) => x.en === en);
  showToast(`${head} · 챌린지로 열 수 있어요`, {
    label: '챌린지 열기',
    onPress: () => router.push((saved ? `/challenge/new?expr=${encodeURIComponent(saved.id)}` : '/challenge/new') as Href),
  });
}
