/**
 * 알림함 목록 · 읽음 · 모두 읽음 (api/notifications.ts) 을 알림함 화면 줄 모양으로 바꿔요.
 * 줄을 누르면 갈 곳은 서버 meta 로 정해요 — 공지 게시 알림은 공지 상세, 참조가 있는 알림은 푸시 배너와 같은 규칙(push-to-banner hrefOf).
 * 탭마다 보이는 행동(버튼 · 얼굴 등)은 탭 기능을 붙일 때 meta 모양을 늘려 여기서 정해요. 지금 탭은 전체 · 공지 둘이에요.
 */
import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';

import { markAllNotiRead, markNotiRead, useArrivedNotis, useNotiRead } from '@/components/home/noti-state';
import type { Noti, NotiIcon } from '@/data/home';
import { agoLabel } from '@/lib/when';

import { apiConfig } from './config';
import {
  fetchNotifications,
  localNotificationItem,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationCategory,
  type NotificationFeed,
  type NotificationItem,
} from './notifications';
import { hrefOf } from './push-to-banner';
import { queryKeys } from './queries';

/** 알림함 탭 (서버 category) — null = 전체 */
export const NOTIFICATION_TABS: { key: NotificationCategory | null; label: string }[] = [
  { key: null, label: '전체' },
  { key: 'NOTICE', label: '공지' },
];

/** 알림함 한 줄 */
export type NotiRowView = {
  id: string;
  title: string;
  body: string | null;
  time: string;
  read: boolean;
  /** 누르면 갈 화면 — 없으면 읽음만 */
  href: string | null;
  /** 누르면 알림 속 단계가 아니라 내가 마지막으로 공부한 곳으로 (친구 퀘스트 성공 · 기기 알림만) */
  toMyLast: boolean;
  icon: NotiIcon;
  who?: Noti['who'];
  badge?: Noti['badge'];
  action?: string;
  /** 앱을 쓰는 동안 기기에서 생긴 알림 — 읽음을 기기에만 남겨요 (서버에 없는 id) */
  local: boolean;
};

/** 알림 → 갈 화면. 모르는 meta 모양이면 null (읽음만) */
function hrefOfItem(item: NotificationItem): string | null {
  if (item.extras) return item.extras.href;
  const meta = item.meta;
  if (!meta) return null;
  switch (meta.kind) {
    case 'NOTICE':
      return `/notice/${encodeURIComponent(meta.noticeId)}`;
    case 'REFERENCE': {
      const href = hrefOf(meta.referenceType, meta.referenceId);
      // 연기 · 지점 이동 결과는 아직 상세 화면이 없어 푸시는 알림함으로 보내요 — 알림함 안에서는 읽음만
      return href && href !== '/notifications' ? String(href) : null;
    }
    default:
      return null;
  }
}

function iconOf(item: NotificationItem): NotiIcon {
  if (item.extras?.icon) return item.extras.icon;
  if (item.meta?.kind === 'REFERENCE' && item.meta.referenceType === 'PROS_NOTE') return 'pen';
  return 'tack';
}

function toRow(item: NotificationItem, local: boolean, readOnDevice: boolean): NotiRowView {
  const x = item.extras;
  return {
    id: item.id,
    title: item.title,
    body: item.body,
    time: x?.time ?? agoLabel(Date.parse(item.createdAt)),
    read: item.read || readOnDevice,
    href: hrefOfItem(item),
    toMyLast: !!x?.toMyLast,
    icon: iconOf(item),
    who: x?.who,
    badge: x?.badge,
    action: x?.action,
    local,
  };
}

/**
 * 알림함 목록 — 최신 순, 끝까지 내리면 fetchNextPage 로 다음 쪽을 이어 붙여요.
 * 실서버일 때는 앱을 쓰는 동안 기기에서 생긴 알림(지점 연동 결과 등)을 맨 위에 더해요 (가짜 서버는 이미 섞어 줘요).
 */
export function useNotificationFeed(category: NotificationCategory | null) {
  const readOnDevice = useNotiRead();
  const arrived = useArrivedNotis();
  const q = useInfiniteQuery({
    queryKey: queryKeys.notifications(category),
    queryFn: ({ pageParam, signal }) => fetchNotifications({ category, cursor: pageParam }, { signal }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
  const rows = useMemo(() => {
    const server = (q.data?.pages ?? []).flatMap((p) => p.items).map((i) => toRow(i, false, !!readOnDevice[i.id]));
    if (apiConfig.useMock) return server;
    const local = arrived
      .map((n) => localNotificationItem(n, !!readOnDevice[n.id]))
      .filter((i) => !category || i.category === category)
      .map((i) => toRow(i, true, false));
    return [...local, ...server];
  }, [q.data, arrived, readOnDevice, category]);
  return { q, rows };
}

type FeedCache = InfiniteData<NotificationFeed, string | null>;

/** 캐시에 있는 알림함 목록(모든 탭)의 줄을 바로 읽음으로 — 서버 응답을 기다리지 않고 점이 꺼지게 */
function markCachedRead(queryClient: ReturnType<typeof useQueryClient>, match: (id: string) => boolean) {
  queryClient.setQueriesData<FeedCache>({ queryKey: queryKeys.notificationsAll }, (data) =>
    data ? { ...data, pages: data.pages.map((p) => ({ ...p, items: p.items.map((i) => (match(i.id) ? { ...i, read: true } : i)) })) } : data,
  );
}

/** 목록 · 홈 종 배지를 서버 값으로 다시 받아요 */
const refreshAll = (queryClient: ReturnType<typeof useQueryClient>) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.notificationsAll }),
    queryClient.invalidateQueries({ queryKey: queryKeys.unreadNotifications }),
  ]);

/** 한 줄 읽음 — 기기 알림은 기기에만, 나머지는 서버에. 실패하면 다시 받아서 원래대로 보여요 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (row: Pick<NotiRowView, 'id' | 'local'>) => (row.local ? Promise.resolve(markNotiRead(row.id)) : markNotificationRead(row.id)),
    onMutate: (row) => markCachedRead(queryClient, (id) => id === row.id),
    onSettled: () => refreshAll(queryClient),
  });
}

/** 모두 읽음 — 탭과 상관없이 서버 알림 전부 + 기기 알림 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await markAllNotificationsRead();
      if (!apiConfig.useMock) markAllNotiRead();
    },
    onMutate: () => markCachedRead(queryClient, () => true),
    onSettled: () => refreshAll(queryClient),
  });
}
