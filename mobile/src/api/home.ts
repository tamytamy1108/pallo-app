/**
 * 홈 · 출석 API (api-inventory 8 · 9 · 10 · 12 · 13 · 14 · 15 + 추가 A1 시작 팝업).
 * 가짜 서버 값은 data/home.ts · data/mock.ts · components/home/attendance.ts 에 있어요.
 */
import { getAttend, myTeams, sendAttendance as markAttendance, sendRsvp as markRsvp, type Attend } from '@/components/home/attendance';
import { markAllNotiRead, markNotiRead } from '@/components/home/noti-state';
import { LANGS, LAUNCH_POPUPS, LOUNGE_HIGHLIGHTS, MY_LANG, MY_SLOT, NOTIS, QR_AFTER, QR_BEFORE, SLOTS, ATTEND_POINTS, type LaunchPopup, type LoungeHighlight, type Noti } from '@/data/home';
import { NOTICES, type Notice } from '@/data/mock';

import { http, type Page, type PageParams } from './client';
import { apiConfig } from './config';
import { mock, mockNotFound } from './mock';

type Opts = { signal?: AbortSignal };

/** 가짜 목록 나눠 주기: cursor = 다음 시작 위치 */
function pageOf<T>(all: T[], { cursor, limit = 20 }: PageParams = {}): Page<T> {
  const start = cursor ? Number(cursor) || 0 : 0;
  const items = all.slice(start, start + limit);
  const next = start + limit;
  return { items, nextCursor: next < all.length ? String(next) : null };
}

/* ───────── 오늘 세션 · 출석 ───────── */

export type TodaySessions = {
  slots: { id: string; t: string; start: number }[];
  /** 내 수업 시간대 · 언어 (slots · langs 의 순서) */
  mySlot: number;
  myLang: number;
  langs: string[];
  /** 내가 등록된 팀 · 전산에서 오늘 연 수업(slot, 안 열었으면 null). 출석체크 시트엔 내 팀이 다 보이고 열린 수업만 누를 수 있어요 */
  teams: { no: string; branch: string; lang: number; when: string; slot: number | null }[];
  /** QR 출석: 시작 qrBefore 분 전 ~ 시작 qrAfter 분 후 */
  qrBefore: number;
  qrAfter: number;
  attend: Attend;
};

/** 8 GET /me/sessions/today */
export function fetchTodaySessions({ signal }: Opts = {}): Promise<TodaySessions> {
  if (apiConfig.useMock)
    return mock('sessionsToday', () => ({
      slots: SLOTS.map((s) => ({ ...s })),
      mySlot: MY_SLOT,
      myLang: MY_LANG,
      langs: LANGS.map((l) => l.key),
      teams: myTeams(),
      qrBefore: QR_BEFORE,
      qrAfter: QR_AFTER,
      attend: { ...getAttend() },
    }));
  return http.get('/me/sessions/today', { signal });
}

/** 9 POST /sessions/:id/rsvp — 사전 출석 (lang 필수). slot · lang 은 화면의 순서 번호 */
export function sendRsvp({ slot, lang }: { slot: number; lang: number }): Promise<void> {
  if (apiConfig.useMock) return mock('rsvp', () => void markRsvp(slot, lang));
  return http.post(`/sessions/${SLOTS[slot].id}/rsvp`, { lang: LANGS[lang].key });
}

export type AttendanceResult = { firstTime: boolean; points: number; weekCount: number };

/** 10 POST /sessions/:id/attendance — QR 출석 (qr, lang) → +30P · 이번 주 n번째. 같은 세션 두 번째면 firstTime=false */
export function sendAttendance({ slot, lang, qr }: { slot: number; lang: number; qr: string }): Promise<AttendanceResult> {
  if (apiConfig.useMock)
    return mock('attendance', () => {
      const firstTime = markAttendance(slot, lang, qr);
      return { firstTime, points: firstTime ? ATTEND_POINTS : 0, weekCount: getAttend().week };
    });
  return http.post(`/sessions/${SLOTS[slot].id}/attendance`, { qr, lang: LANGS[lang].key });
}

/* ───────── 공지 ───────── */

/** 12 GET /notices — 홈 Notice board 띠는 앞의 3개 (limit=3) */
export function fetchNotices(params: PageParams = {}, { signal }: Opts = {}): Promise<Page<Notice>> {
  if (apiConfig.useMock) return mock('notices', () => pageOf(NOTICES, params));
  return http.get('/notices', { query: params, signal });
}

/** 12 GET /notices/:id — 없으면 ApiError(404 · isNotFound) */
export function fetchNotice(id: string, { signal }: Opts = {}): Promise<Notice> {
  if (apiConfig.useMock)
    return mock('notice', () => {
      const n = NOTICES.find((x) => x.id === id);
      if (!n) throw mockNotFound();
      return n;
    });
  return http.get(`/notices/${encodeURIComponent(id)}`, { signal });
}

/* ───────── 알림함 ───────── */

/** 13 GET /me/notifications?kind= */
export function fetchNotifications(params: PageParams & { kind?: Noti['kind'] } = {}, { signal }: Opts = {}): Promise<Page<Noti>> {
  if (apiConfig.useMock) return mock('notifications', () => pageOf(params.kind ? NOTIS.filter((n) => n.kind === params.kind) : NOTIS, params));
  return http.get('/me/notifications', { query: params, signal });
}

/** 14 POST /me/notifications/read — ids 를 주면 그것만, 없으면 모두 읽음 */
export function markNotificationsRead(ids?: string[]): Promise<void> {
  if (apiConfig.useMock)
    return mock('notificationsRead', () => {
      if (ids) ids.forEach(markNotiRead);
      else markAllNotiRead();
    });
  return http.post('/me/notifications/read', ids ? { ids } : { all: true });
}

/* ───────── 라운지 미리보기 · 시작 팝업 ───────── */

/** 15 GET /lounge/highlights */
export function fetchLoungeHighlights({ signal }: Opts = {}): Promise<LoungeHighlight[]> {
  if (apiConfig.useMock) return mock('loungeHighlights', () => LOUNGE_HIGHLIGHTS);
  return http.get('/lounge/highlights', { signal });
}

/** A1 GET /popups — 본사 관리자가 올린 앱 시작 팝업 (오늘 보여 줄 것만) */
export function fetchLaunchPopups({ signal }: Opts = {}): Promise<LaunchPopup[]> {
  if (apiConfig.useMock) return mock('popups', () => LAUNCH_POPUPS);
  return http.get('/popups', { signal });
}

/* ───────── 함께 가자 · 퀘스트 성공 알리기 (추가 제안 · docs/frontend/api-additions.md) ───────── */

/** 사전 출석한 세션에 팔로우한 멤버를 불러요 → 받는 사람마다 푸시 + 알림함 '○○님이 오늘 19:30 영어 세션에 가요' */
export function sendSessionInvite({ slot, lang, names }: { slot: number; lang: number; names: string[] }): Promise<{ sent: number }> {
  if (apiConfig.useMock)
    return mock('sessionInvite', () => {
      if (__DEV__) console.info('[mock] POST /sessions/:id/invites', { session: SLOTS[slot].id, lang: LANGS[lang].key, names });
      return { sent: names.length };
    });
  return http.post(`/sessions/${SLOTS[slot].id}/invites`, { lang: LANGS[lang].key, memberNames: names });
}

/** 퀘스트(레슨 단계 · 상황 장면) 성공 → 서버가 내 팔로워에게 알려요 (설정 shareProgress · 서버가 묶어 보내기). 보내고 잊어요 */
export function sendQuestDone({ key, title, href }: { key: string; title: string; href: string }): Promise<void> {
  if (apiConfig.useMock)
    return mock('questDone', () => {
      if (__DEV__) console.info('[mock] POST /me/progress/events', { key, title, href });
    });
  return http.post('/me/progress/events', { type: 'quest_completed', key, title, deepLink: href });
}
