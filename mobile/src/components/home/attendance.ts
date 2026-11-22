/**
 * 오늘 세션 출석 상태 · 규칙 (프로토타입 S.rsvp · S.slot · S.lang · S.checked · rsvpOpen · qrOpen · renderHero · renderCount).
 * 가짜 서버 상태예요. 맞는 API: 8 `/me/sessions/today` · 9 `/sessions/:id/rsvp` · 10 `/sessions/:id/attendance`
 * 실제 앱은 시각을 서버 기준으로 받아요 (지금은 기기 시각).
 */
import { useEffect, useState } from 'react';

import { LANGS, MY_LANG, MY_SLOT, QR_AFTER, QR_BEFORE, SLOTS } from '@/data/home';
import { createStore } from '@/lib/store';

/* ───────── 지금 시각 ───────── */

// 개발용: 웹 주소 ?now=19:45 로 바꾼 시각과 실제 시각의 차이 (dev.ts 에서만 바꿔요)
let offsetMs = 0;
export function setClockOffset(ms: number) {
  offsetMs = ms;
}
export const nowDate = () => new Date(Date.now() + offsetMs);

/** 1초마다 바뀌는 지금 시각 */
export function useClock() {
  const [t, setT] = useState(nowDate);
  useEffect(() => {
    const id = setInterval(() => setT(nowDate()), 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

/** 하루 중 분 · 초 */
export const minuteOf = (d: Date) => d.getHours() * 60 + d.getMinutes();
export const secondOf = (d: Date) => minuteOf(d) * 60 + d.getSeconds();

const pad = (n: number) => String(n).padStart(2, '0');
/** 분 → '19:30' */
export const fmtMin = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

/* ───────── 출석 규칙 ───────── */

/** 시작 전까지 사전 출석 가능 */
export const rsvpOpen = (i: number, m: number) => m < SLOTS[i].start;
/** QR 출석: 시작 30분 전 ~ 시작 20분 후 */
export const qrOpen = (i: number, m: number) => m >= SLOTS[i].start - QR_BEFORE && m <= SLOTS[i].start + QR_AFTER;
export const anyQrOpen = (m: number) => SLOTS.some((_, i) => qrOpen(i, m));

/** 시트 모드: 사전 출석(시작 전까지) · 출석(QR 창이 열린 시간대만) */
export type SheetMode = 'rsvp' | 'checkin';
export const slotSelectable = (i: number, mode: SheetMode, m: number) => (mode === 'checkin' ? qrOpen(i, m) : rsvpOpen(i, m));
export function slotSub(i: number, mode: SheetMode, m: number) {
  if (qrOpen(i, m)) return '지금 출석 가능';
  if (rsvpOpen(i, m)) return mode === 'checkin' ? `${fmtMin(SLOTS[i].start - QR_BEFORE)}부터 출석` : '참석 알림 가능';
  return '출석 마감';
}
export const summary = (slot: number, lang: number) => `${SLOTS[slot].t} · ${LANGS[lang].ko}`;

/* ───────── 내 출석 상태 (가짜 서버) ───────── */

export type Attend = {
  rsvp: 'yes' | 'no' | null;
  slot: number;
  lang: number;
  checked: boolean;
  /** 이번 주 출석 횟수 */
  week: number;
};

const store = createStore<Attend>({ rsvp: null, slot: MY_SLOT, lang: MY_LANG, checked: false, week: 0 });
export const useAttend = store.useStore;
export const getAttend = store.get;

/** 사전 출석 (POST /sessions/:id/rsvp · lang 필수) */
export const sendRsvp = (slot: number, lang: number) => store.set((s) => ({ ...s, rsvp: 'yes', slot, lang }));

/** QR 출석 (POST /sessions/:id/attendance). 같은 세션에 두 번 출석되지 않아요 → 처음이면 true */
export function sendAttendance(slot: number, lang: number, qr: string) {
  void qr; // 실제 앱: 서버가 QR(지점 · 시간 · 만료)을 확인해요
  if (store.get().checked) return false;
  store.set((s) => ({ ...s, checked: true, slot, lang, week: s.week + 1 }));
  return true;
}

/* ───────── 카드 상태 (프로토타입 renderHero · renderCount) ───────── */

export type HeroKind = 'ready' | 'rsvp' | 'action' | 'entered' | 'onair' | 'off';
export type Hero = { kind: HeroKind; badge: string; live: 'idle' | 'on' | 'done'; started: boolean };

export function heroOf(a: Attend, d: Date): Hero {
  const m = minuteOf(d);
  const started = secondOf(d) >= SLOTS[a.slot].start * 60;
  if (a.checked && started) return { kind: 'onair', badge: 'ON AIR · 스터디 중', live: 'on', started };
  if (a.checked) return { kind: 'entered', badge: 'READY · 입장 완료', live: 'done', started };
  if (anyQrOpen(m)) return { kind: 'action', badge: 'ACTION!', live: 'on', started };
  if (a.rsvp === 'yes') return { kind: 'rsvp', badge: 'READY · 참석 예정', live: 'idle', started };
  if (a.rsvp === 'no') return { kind: 'off', badge: '오늘은 쉬어요', live: 'idle', started };
  return { kind: 'ready', badge: 'READY', live: 'idle', started };
}

/** 위 칸: 스터디 시각 · 시작까지(진행 중) 남은 시간 */
export function countOf(a: Attend, d: Date) {
  const mine = a.checked || a.rsvp === 'yes';
  const m = minuteOf(d);
  const target = mine ? a.slot : SLOTS.findIndex((s) => s.start > m);
  if (target < 0) return { time: 'NOW', label: '스터디', value: 'ON' };
  const diff = SLOTS[target].start * 60 - secondOf(d);
  if (mine && diff <= 0) {
    // 내 스터디가 시작됨: 지난 시간
    const el = -diff;
    const value = '+' + (el >= 3600 ? `${Math.floor(el / 3600)}:${pad(Math.floor((el % 3600) / 60))}` : `${pad(Math.floor(el / 60))}:${pad(el % 60)}`);
    return { time: SLOTS[target].t, label: '진행 중', value };
  }
  const left = Math.max(0, diff);
  // 1시간 넘게 남으면 시:분 (앱에서 다듬은 모양 그대로 · 프로토타입은 'n시간 mm분')
  const value = left >= 3600 ? `${pad(Math.floor(left / 3600))}:${pad(Math.floor((left % 3600) / 60))}` : `${pad(Math.floor(left / 60))}:${pad(left % 60)}`;
  return { time: SLOTS[target].t, label: '시작까지', value };
}

/** 시트를 열 때 처음 골라 둘 시간대: 지금 고른 것 → 내 수업 → 고를 수 있는 첫 시간대 */
export function firstSelectable(slot: number, mode: SheetMode, m: number) {
  if (slotSelectable(slot, mode, m)) return slot;
  if (slotSelectable(MY_SLOT, mode, m)) return MY_SLOT;
  return SLOTS.findIndex((_, i) => slotSelectable(i, mode, m));
}
