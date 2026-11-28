/**
 * FCM 메시지 → 푸시 배너 모양 (부르는 곳: api/use-foreground-push.tsx). 화면 부품 · 네이티브 모듈에 기대지 않는 순수 함수예요.
 * 서버(backend infra/push/PushExecutor)가 보내는 모양:
 * - notification.title · notification.body  배너 제목 · 한 줄
 * - data.type · data.referenceId            무엇에 대한 알림인지 (백엔드 PushNotificationType) — 갈 화면은 여기서 정해요
 */
import type { Href } from 'expo-router';

import type { PushBannerMsg } from '@/components/ui/push-banner';
import type { PushMessage } from '@/lib/push';

/** 알림 종류 → 누르면 갈 화면. 모르는 종류 · 종류 없음이면 누르면 닫히기만 (알림함 줄도 같은 규칙 · use-notifications.ts) */
export function hrefOf(type: unknown, referenceId: unknown): Href | undefined {
  switch (type) {
    case 'PROS_NOTE':
      return typeof referenceId === 'string' && referenceId ? (`/me/notes/${encodeURIComponent(referenceId)}` as Href) : '/me/notes';
    case 'USER_INQUIRY':
      return '/me/support';
    // 이벤트 제안 확정 · 반려 — 이벤트 탭 맨 위 '내가 제안한 이벤트' 카드에서 결과 · 매니저 메모를 봐요
    case 'EVENT_PROPOSAL':
      return '/event';
    // 배지 받음 — 배지 모두 보기 (축하 시트는 탭 화면 위에 저절로 떠요 · components/my/badge-celebrate)
    case 'BADGE':
      return '/me/badges';
    // 연기 요청 · 지점 이동 요청 결과는 아직 앱 상세 화면이 없어 알림함으로
    case 'DEFERRAL_REQUEST':
    case 'BRANCH_TRANSFER_REQUEST':
      return '/notifications';
    default:
      return undefined;
  }
}

/** FCM 메시지 → 배너. 제목이 없으면(데이터만 온 푸시) 배너를 띄우지 않아요 */
export function pushToBanner(message: Pick<PushMessage, 'notification' | 'data'>): PushBannerMsg | null {
  const title = message.notification?.title?.trim();
  if (!title) return null;
  const body = message.notification?.body?.trim() || undefined;
  return { title, body, href: hrefOf(message.data?.type, message.data?.referenceId) };
}
