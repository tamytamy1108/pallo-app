/**
 * 앱을 보고 있을 때 온 푸시 → 위에서 내려오는 푸시 배너 (components/ui/push-banner).
 * 이때는 OS 가 알림을 띄우지 않아서 앱이 직접 보여줘요. 앱이 뒤에 있거나 꺼져 있을 땐 OS 알림이 떠요 (여기와 무관).
 * 푸시가 오면 홈 종 배지(안 읽은 알림 수)도 바로 다시 받아요. 뒤에 있다 돌아올 땐 query-client.ts 가 다시 받아요.
 *
 * 푸시 모양은 api/push-to-banner.ts (서버: backend infra/push/PushExecutor) — 제목 · 한 줄 · 알림 종류로 갈 화면.
 *
 * 로그인돼 있을 때만 들어요. Firebase 가 안 붙은 빌드 · 웹에선 아무것도 안 해요 (lib/push 의 pushEnabled).
 */
import { useEffect } from 'react';

import { showPushBanner } from '@/components/ui/push-banner';
import { onForegroundPush, pushEnabled } from '@/lib/push';

import { pushToBanner } from './push-to-banner';
import { queryKeys } from './queries';
import { queryClient } from './query-client';
import { useSession } from './session';

export function useForegroundPushBanner() {
  const signedIn = useSession().status === 'signedIn';
  useEffect(() => {
    if (!pushEnabled || !signedIn) return;
    return onForegroundPush((message) => {
      // 푸시 = 새 알림일 수 있어요: 1분 주기를 기다리지 않고 홈 종 배지를 바로 다시 세요 (배너가 안 뜨는 데이터만 온 푸시도)
      void queryClient.invalidateQueries({ queryKey: queryKeys.unreadNotifications });
      const banner = pushToBanner(message);
      if (banner) showPushBanner(banner);
    });
  }, [signedIn]);
}

export function ForegroundPushBanner() {
  useForegroundPushBanner();
  return null;
}
