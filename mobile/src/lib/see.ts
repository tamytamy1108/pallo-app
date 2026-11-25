/**
 * 토스트 [보러가기]: 방금 저장 · 참여 · 개설해서 다른 곳에 생긴 것을 바로 보러 가요.
 * 예) showToast('저장했어요', seeAt(SEE.savedMeets))
 */
import { router, type Href } from 'expo-router';

import type { ToastAction } from '@/components/ui/toast';

export const seeAt = (href: Href): ToastAction => ({ label: '보러가기', onPress: () => router.push(href) });

/** 마이 탭의 목록 시트를 바로 열어요 (마이 › ?open=) */
export const SEE = {
  savedMeets: '/my?open=saved-meets',
  joinedMeets: '/my?open=joined-meets',
  savedChallenges: '/my?open=saved-challenges',
  expressions: '/me/expressions',
  myRoom: '/my',
} as const satisfies Record<string, Href>;
