/**
 * 알림 읽음 상태 (프로토타입 NOTIR · notiDot). 맞는 API: 13 `/me/notifications` · 14 `/me/notifications/read`
 * 홈 종의 빨간 점은 안 읽은 알림이 있을 때만 보여요. 읽음은 기기에 남아요.
 */
import { NOTIS } from '@/data/home';
import { createStore } from '@/lib/store';

const store = createStore<Record<string, boolean>>(Object.fromEntries(NOTIS.map((n) => [n.id, n.read])), { persist: { key: 'noti-read' } });

export const useNotiRead = store.useStore;
export const useUnreadCount = () => store.useStore((s) => NOTIS.filter((n) => !s[n.id]).length);
export const markNotiRead = (id: string) => store.set((s) => (s[id] ? s : { ...s, [id]: true }));
export const markAllNotiRead = () => store.set(() => Object.fromEntries(NOTIS.map((n) => [n.id, true])));

/* 공지 새 글 점 (프로토타입 NREAD): 상세를 열면 읽음 */
const noticeStore = createStore<Record<string, boolean>>({}, { persist: { key: 'notice-dot' } });
export const useNoticeRead = (id: string) => noticeStore.useStore((s) => !!s[id]);
export const markNoticeRead = (id: string) => noticeStore.set((s) => (s[id] ? s : { ...s, [id]: true }));
