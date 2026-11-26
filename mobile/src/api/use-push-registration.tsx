/**
 * 로그인돼 있는 동안 이 기기 푸시 토큰을 서버에 맞춰 둬요 — 로그인되면(가입 과정 중이어도) 알림 권한을 묻고 허용하면 등록,
 * 토큰이 바뀌면 다시 등록. 앱을 켤 때마다(로그인 상태가 복원될 때) 한 번씩 다시 보내요 — 서버는 같은 토큰이면 갱신만 해요.
 * ApiProvider 가 PushTokenSync 를 한 번 붙여요. 해제는 로그아웃(api/auth.ts)이 해요.
 *
 * Firebase 가 안 붙은 빌드(웹 미리보기 · 설정 파일 없는 빌드)에선 아무것도 안 해요 (lib/push.ts 의 pushEnabled).
 * 권한을 거절했으면 OS 가 다시 묻지 않아요(iOS 는 한 번만). 설정 화면에서 다시 켜게 하는 건 다음 단계.
 */
import { useEffect } from 'react';

import { onPushTokenRefresh, pushEnabled } from '@/lib/push';

import { registerPushTokenQuietly, registerThisDevice } from './push-registration';
import { useSession } from './session';

export function usePushRegistration() {
  const signedIn = useSession().status === 'signedIn';
  useEffect(() => {
    if (!pushEnabled || !signedIn) return;
    void registerThisDevice();
    return onPushTokenRefresh((token) => void registerPushTokenQuietly(token));
  }, [signedIn]);
}

export function PushTokenSync() {
  usePushRegistration();
  return null;
}
