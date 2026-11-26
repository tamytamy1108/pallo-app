/**
 * 앱을 보고 있을 때 온 푸시 → 위에서 내려오는 푸시 배너 (components/ui/push-banner).
 * 이때는 OS 가 알림을 띄우지 않아서 앱이 직접 보여줘요. 앱이 뒤에 있거나 꺼져 있을 땐 OS 알림이 떠요 (여기와 무관).
 *
 * 푸시 모양은 api/push-to-banner.ts (서버: backend infra/push/PushExecutor) — 제목 · 한 줄 · 알림 종류로 갈 화면.
 *
 * 로그인돼 있을 때만 들어요. Firebase 가 안 붙은 빌드 · 웹에선 아무것도 안 해요 (lib/push 의 pushEnabled).
 */
import { useEffect } from 'react';

import { showPushBanner } from '@/components/ui/push-banner';
import { onForegroundPush, pushEnabled } from '@/lib/push';

import { pushToBanner } from './push-to-banner';
import { useSession } from './session';

export function useForegroundPushBanner() {
  const signedIn = useSession().status === 'signedIn';
  useEffect(() => {
    if (!pushEnabled || !signedIn) return;
    return onForegroundPush((message) => {
      const banner = pushToBanner(message);
      if (banner) showPushBanner(banner);
    });
  }, [signedIn]);
}

export function ForegroundPushBanner() {
  useForegroundPushBanner();
  return null;
}
