/**
 * 알림 읽음 상태 (프로토타입 NOTIR · notiDot). 맞는 API: 13 `/me/notifications` · 14 `/me/notifications/read`
 * · `/me/notifications/unread-count`. 홈 종의 빨간 점은 안 읽은 알림이 있을 때만 보여요. 읽음은 기기에 남아요.
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { apiConfig } from '@/api/config';
import { unreadNotificationsQuery } from '@/api/queries';
import { NOTIS, type Noti } from '@/data/home';
import { createStore } from '@/lib/store';

const store = createStore<Record<string, boolean>>(Object.fromEntries(NOTIS.map((n) => [n.id, n.read])), { persist: { key: 'noti-read' } });

/** 앱을 쓰는 동안 새로 도착한 알림 (푸시 · 지점 연동 결과). 목록 맨 위에 쌓여요 */
const arrived = createStore<Noti[]>([]);

const unreadOf = (list: Noti[], read: Record<string, boolean>) => list.filter((n) => !read[n.id]).length;

export const useNotiRead = store.useStore;
export const getNotiReadMap = store.get;
/** 앱을 쓰는 동안 기기에서 생긴 알림 — 알림함 맨 위 (api/notifications.ts · use-notifications.ts) */
export const getArrivedNotis = arrived.get;
export const useArrivedNotis = arrived.useStore;
/** 알림함 목록: 새로 온 알림 → 원래 알림 (최신 순) */
export function useNotiList() {
  const fresh = arrived.useStore();
  return useMemo(() => [...fresh, ...NOTIS], [fresh]);
}
/** 기기에 남은 읽음 상태로 센 안 읽은 수 (가짜 서버 응답 · api/home.ts) */
export const countDeviceUnread = () => unreadOf([...arrived.get(), ...NOTIS], store.get());

/**
 * 홈 종 배지 · 알림함의 안 읽은 수.
 * 실제 서버: GET /me/notifications/unread-count (1분마다) + 앱을 쓰는 동안 기기에서 생긴 알림 중 안 읽은 것.
 * 가짜 서버: 기기 읽음 상태로 바로 세요 (누르자마자 점이 꺼지게).
 */
export function useUnreadCount() {
  const fresh = arrived.useStore();
  const freshUnread = store.useStore((s) => unreadOf(fresh, s));
  const sampleUnread = store.useStore((s) => unreadOf(NOTIS, s));
  const server = useQuery({ ...unreadNotificationsQuery(), enabled: !apiConfig.useMock });
  if (apiConfig.useMock) return sampleUnread + freshUnread;
  return (server.data?.count ?? 0) + freshUnread;
}
export const markNotiRead = (id: string) => store.set((s) => (s[id] ? s : { ...s, [id]: true }));
export const markAllNotiRead = () => store.set(() => Object.fromEntries([...arrived.get(), ...NOTIS].map((n) => [n.id, true])));

/** 새 알림 받기 (안 읽음으로 맨 위에). 같은 id 면 바꿔 끼워요 */
export function addNoti(n: Noti) {
  arrived.set((l) => [n, ...l.filter((x) => x.id !== n.id)]);
  store.set((s) => ({ ...s, [n.id]: n.read }));
}

/* 공지 새 글 점 (프로토타입 NREAD): 상세를 열면 읽음 */
const noticeStore = createStore<Record<string, boolean>>({}, { persist: { key: 'notice-dot' } });
export const useNoticeRead = (id: string) => noticeStore.useStore((s) => !!s[id]);
export const markNoticeRead = (id: string) => noticeStore.set((s) => (s[id] ? s : { ...s, [id]: true }));
