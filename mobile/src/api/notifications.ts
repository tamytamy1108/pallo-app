/**
 * 알림함 — `GET /app/api/v2/me/notifications` · `PATCH /me/notifications/{id}/read` · `POST /me/notifications/read-all`
 * (백엔드 MobileNotificationV2Controller). 홈 종 배지의 안 읽은 수(`GET /me/notifications/unread-count`)는 api/home.ts 에 있어요.
 *
 * 한 줄은 회원 알림이거나 본사 공지 게시 알림이에요. 공통 칸(제목 · 본문 · 읽음 · 시각 · 탭)만 같고, 종류마다 다른 정보는 `meta` 에 와요.
 * `meta.kind` 로 모양을 나눠요 — 모르는 kind 가 오면(서버가 먼저 새 종류를 배포) 앱은 읽음만 처리하고 이동하지 않아요.
 *
 * `extras` 는 서버에 아직 없는 칸 — 가짜 서버 예시(data/home.ts NOTIS)와 앱을 쓰는 동안 기기에서 생긴 알림(noti-state addNoti)만 채워요.
 */
import { getArrivedNotis, getNotiReadMap, markAllNotiRead, markNotiRead } from '@/components/home/noti-state';
import { NOTIS, type Noti, type NotiIcon } from '@/data/home';
import { agoLabel } from '@/lib/when';

import { http, type Page } from './client';
import { apiConfig } from './config';
import { mock } from './mock';

type Opts = { signal?: AbortSignal };

/** 알림함 탭 — 서버가 알림마다 정해요. 탭이 아직 없는 알림은 null('전체'에만 보여요) */
export type NotificationCategory = 'NOTICE';

/** 본사 앱 공지 종류 (점검 공지는 알림함에 오지 않아요) */
export type NoticeType = 'GENERAL' | 'EVENT' | 'UPDATE' | 'IMPORTANT';

/** 공지 게시 알림 — 누르면 공지 상세로 */
export type NoticeNotificationMeta = { kind: 'NOTICE'; noticeId: string; noticeType: NoticeType };

/** 아직 전용 모양이 없는 회원 알림의 딥링크 참조 (referenceType = 백엔드 PushNotificationType 이름) — 갈 곳은 푸시 배너와 같은 규칙 */
export type ReferenceNotificationMeta = { kind: 'REFERENCE'; referenceType: string; referenceId: string | null };

export type NotificationMeta = NoticeNotificationMeta | ReferenceNotificationMeta;

/** 서버에 아직 없는 칸 (가짜 서버 · 기기 알림만) */
export type NotificationExtras = {
  /** '5분 전' 처럼 적힌 때 */
  time: string;
  href: string;
  icon?: NotiIcon;
  who?: Noti['who'];
  badge?: Noti['badge'];
  action?: string;
  toMyLast?: boolean;
};

export type NotificationItem = {
  /** 읽음 처리에 그대로 써요 (공지 게시 알림이면 공지 id) */
  id: string;
  /** 무슨 일인가 — 회원 알림 종류 이름 또는 NOTICE_PUBLISHED. 모르는 값이어도 제목 · 읽음으로 그려요 */
  type: string;
  category: NotificationCategory | null;
  title: string;
  /** 둘째 줄 — 없으면 null */
  body: string | null;
  read: boolean;
  createdAt: string;
  /** 종류별 추가 정보 — 없으면 null. 모르는 kind 가 올 수 있어요 */
  meta: NotificationMeta | null;
  extras?: NotificationExtras;
};

/** 한 쪽 + 탭과 상관없는 전체 안 읽은 수 */
export type NotificationFeed = Page<NotificationItem> & { unreadCount: number };

export type NotificationFeedParams = { category: NotificationCategory | null; cursor?: string | null; limit?: number };

/** 예시 · 기기 알림(Noti) → 서버 모양. 공지 화면으로 가는 알림만 공지 게시 알림 모양으로 (나머지 탭은 아직 없어 '전체'에만) */
export function localNotificationItem(n: Noti, read: boolean): NotificationItem {
  const noticeId = /^\/notice\/([^/?]+)/.exec(n.href)?.[1];
  return {
    id: n.id,
    type: noticeId ? 'NOTICE_PUBLISHED' : 'SYSTEM',
    category: n.kind === 'notice' ? 'NOTICE' : null,
    title: n.text,
    body: null,
    read,
    createdAt: new Date(n.at ?? Date.now()).toISOString(),
    meta: noticeId ? { kind: 'NOTICE', noticeId, noticeType: 'GENERAL' } : null,
    extras: { time: n.at ? agoLabel(n.at) : n.time, href: n.href, icon: n.icon, who: n.who, badge: n.badge, action: n.action, toMyLast: n.toMyLast },
  };
}

/** 가짜 서버: 기기에서 생긴 알림 → 예시 알림 (최신 순), 탭으로 거르고 cursor(쪽 번호)로 나눠요 */
function mockFeed({ category, cursor, limit = 20 }: NotificationFeedParams): NotificationFeed {
  const read = getNotiReadMap();
  const all = [...getArrivedNotis(), ...NOTIS].map((n) => localNotificationItem(n, !!read[n.id]));
  const rows = category ? all.filter((x) => x.category === category) : all;
  const page = cursor ? Number(cursor) || 0 : 0;
  return {
    items: rows.slice(page * limit, (page + 1) * limit),
    nextCursor: (page + 1) * limit < rows.length ? String(page + 1) : null,
    unreadCount: all.filter((x) => !x.read).length,
  };
}

/** GET /me/notifications?category&cursor&limit — 최신 순 한 쪽 (nextCursor 가 null 이면 끝) */
export function fetchNotifications(params: NotificationFeedParams, { signal }: Opts = {}): Promise<NotificationFeed> {
  if (apiConfig.useMock) return mock('notifications', () => mockFeed(params));
  const { category, cursor, limit } = params;
  return http.get('/me/notifications', { query: { category: category ?? undefined, cursor: cursor ?? undefined, limit }, signal });
}

/** PATCH /me/notifications/{id}/read — 한 줄 읽음 (여러 번 불러도 같아요) */
export function markNotificationRead(id: string): Promise<void> {
  if (apiConfig.useMock) return mock('notificationRead', () => markNotiRead(id));
  return http.patch<void>(`/me/notifications/${encodeURIComponent(id)}/read`);
}

/** POST /me/notifications/read-all — 탭과 상관없이 모두 읽음 */
export function markAllNotificationsRead(): Promise<void> {
  if (apiConfig.useMock) return mock('notificationsReadAll', () => markAllNotiRead());
  return http.post<void>('/me/notifications/read-all');
}
