/**
 * 오늘 세션 출석 상태 · 규칙 (프로토타입 S.rsvp · S.slot · S.lang · S.checked · rsvpOpen · qrOpen · renderHero · renderCount).
 * 가짜 서버 상태예요. 맞는 API: 8 `/me/sessions/today` · 9 `/sessions/:id/rsvp` · 10 `/sessions/:id/attendance`
 * 실제 앱은 시각을 서버 기준으로 받아요 (지금은 기기 시각).
 */
import { useIsFocused } from 'expo-router';
import { useEffect, useState } from 'react';

import { branchTeamsOn } from '@/data/branch-today';
import { ATTEND_POINTS, LANGS, MY_LANG, MY_SLOT, myTeamsOn, QR_AFTER, QR_BEFORE, RSVP_BEFORE, SLOTS, type MyTeamToday } from '@/data/home';
import { hourLabel } from '@/data/account';
import { SPARK_ATTEND } from '@/data/my';
import { createStore } from '@/lib/store';
import { awardPoints, awardSparks } from '@/state/ledger';
import { getMe } from '@/state/me';
import { dayKey, weekKey } from '@/state/today-goal';

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
  // 화면이 안 보이면(다른 탭) 멈춰요 — 1초마다 다시 그리면 라이브러리 3D(JS 에서 그려요)가 1초마다 멈칫했어요
  const focused = useIsFocused();
  useEffect(() => {
    if (!focused) return;
    const tick = () => setT(nowDate());
    // 돌아오면 바로 지금 시각으로 (멈춰 있던 동안 지난 시간)
    const now = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(now);
      clearInterval(id);
    };
  }, [focused]);
  return t;
}

/** 하루 중 분 · 초 */
export const minuteOf = (d: Date) => d.getHours() * 60 + d.getMinutes();
export const secondOf = (d: Date) => minuteOf(d) * 60 + d.getSeconds();

const pad = (n: number) => String(n).padStart(2, '0');
/** 분 → '19:30' */
export const fmtMin = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

/* ───────── 출석 규칙 ───────── */

/** 사전 출석: 시작 24시간 전까지만 (오늘 수업은 이미 지났어요 — 그 뒤엔 QR 출석만) */
export const rsvpOpen = (i: number, m: number) => SLOTS[i].start - m >= RSVP_BEFORE;
/** QR 출석: 시작 30분 전 ~ 시작 20분 후 */
export const qrOpen = (i: number, m: number) => m >= SLOTS[i].start - QR_BEFORE && m <= SLOTS[i].start + QR_AFTER;
/** 오늘 열린 내 수업 중 QR 출석이 열린 게 있나 */
export const anyQrOpen = (m: number) => openTeams().some((t) => qrOpen(t.slot, m));

/** 시트 모드: 사전 출석(시작 전까지) · 출석(QR 창이 열린 시간대만) */
export type SheetMode = 'rsvp' | 'checkin';
export const slotSelectable = (i: number, mode: SheetMode, m: number) => (mode === 'checkin' ? qrOpen(i, m) : rsvpOpen(i, m));
export function slotSub(i: number, mode: SheetMode, m: number) {
  if (qrOpen(i, m)) return '지금 출석 가능';
  if (m > SLOTS[i].start + QR_AFTER) return '출석 마감';
  if (mode === 'rsvp') return rsvpOpen(i, m) ? '참석 알림 가능' : '사전 출석 마감 · 24시간 전까지';
  return `${fmtMin(SLOTS[i].start - QR_BEFORE)}부터 출석`;
}
/** 고른 수업 이름: 내 팀이면 팀 이름 (영어 월수 8시) · 아니면 '20:00 · 영어' */
export function summary(slot: number, lang: number) {
  const t = openTeamAt(slot, lang);
  return t ? teamName(t) : `${SLOTS[slot].t} · ${LANGS[lang].ko}`;
}

/* ───────── 내 출석 상태 (가짜 서버) ───────── */

export type Attend = {
  rsvp: 'yes' | 'no' | null;
  slot: number;
  lang: number;
  checked: boolean;
  /** 이번 주 출석 횟수 */
  week: number;
};

// 기기에 남아요 — 같은 날 앱을 다시 켜도 사전 출석 · 출석 그대로. 날이 바뀌면 오늘 것은 처음부터, 주가 바뀌면 횟수도 0
const store = createStore<Attend>(
  { rsvp: null, slot: MY_SLOT, lang: MY_LANG, checked: false, week: 0 },
  {
    persist: {
      key: 'attendance',
      save: (s) => ({ ...s, day: dayKey(nowDate().getTime()), wk: weekKey(nowDate().getTime()) }),
      load: (saved, initial) => {
        if (!saved || typeof saved !== 'object') return initial;
        const { day, wk, ...a } = saved as Partial<Attend> & { day?: string; wk?: string };
        const t = nowDate().getTime();
        const week = wk === weekKey(t) && typeof a.week === 'number' ? a.week : 0;
        if (day !== dayKey(t)) return { ...initial, week };
        const slot = typeof a.slot === 'number' && SLOTS[a.slot] ? a.slot : initial.slot;
        const lang = typeof a.lang === 'number' && LANGS[a.lang] ? a.lang : initial.lang;
        return { rsvp: a.rsvp === 'yes' || a.rsvp === 'no' ? a.rsvp : null, slot, lang, checked: !!a.checked, week };
      },
    },
  },
);
export const useAttend = store.useStore;
export const getAttend = store.get;

/** 사전 출석 (POST /sessions/:id/rsvp · lang 필수) */
export const sendRsvp = (slot: number, lang: number) => store.set((s) => ({ ...s, rsvp: 'yes', slot, lang }));

/** QR 출석 (POST /sessions/:id/attendance). 같은 세션에 두 번 출석되지 않아요 → 처음이면 true */
export function sendAttendance(slot: number, lang: number, qr: string) {
  void qr; // 실제 앱: 서버가 QR(지점 · 시간 · 만료)을 확인해요
  if (store.get().checked) return false;
  store.set((s) => ({ ...s, checked: true, slot, lang, week: s.week + 1 }));
  // 출석 포인트 · 스파크 (같은 날 같은 세션은 한 번만 · 서버는 세션 id 로)
  const id = `attend:${dayKey(nowDate().getTime())}:${slot}`;
  awardPoints(id, 'attend', ATTEND_POINTS);
  awardSparks(id, 'attend', SPARK_ATTEND);
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

/** 오늘 내 스터디: 사전 출석 · 출석한 팀 → 아직 출석 마감 전인 첫 열린 수업 → 마지막 열린 수업. 오늘 열린 수업이 없으면 null */
export function todayTeam(a: Attend, m: number): OpenTeam | null {
  if (a.checked || a.rsvp === 'yes') {
    const mine = openTeamAt(a.slot, a.lang);
    if (mine) return mine;
  }
  const open = openTeams().sort((p, q) => SLOTS[p.slot].start - SLOTS[q.slot].start || p.lang - q.lang);
  return open.find((t) => m <= SLOTS[t.slot].start + QR_AFTER) ?? open[open.length - 1] ?? null;
}

/** 위 칸: 오늘 스터디 이름 · 시작까지(진행 중) 남은 시간 */
export function countOf(a: Attend, d: Date) {
  const team = todayTeam(a, minuteOf(d));
  if (!team) return { name: '스터디 쉬는 날', label: '시작까지', value: '--:--' };
  const name = teamName(team);
  const diff = SLOTS[team.slot].start * 60 - secondOf(d);
  if (diff <= 0) {
    // 스터디가 시작됨: 지난 시간
    const el = -diff;
    const value = '+' + (el >= 3600 ? `${Math.floor(el / 3600)}:${pad(Math.floor((el % 3600) / 60))}` : `${pad(Math.floor(el / 60))}:${pad(el % 60)}`);
    return { name, label: '진행 중', value };
  }
  // 1시간 넘게 남으면 시:분 (앱에서 다듬은 모양 그대로 · 프로토타입은 'n시간 mm분')
  const value = diff >= 3600 ? `${pad(Math.floor(diff / 3600))}:${pad(Math.floor((diff % 3600) / 60))}` : `${pad(Math.floor(diff / 60))}:${pad(diff % 60)}`;
  return { name, label: '시작까지', value };
}

/* ───────── 내 팀 (다 보이고 · 오늘 열린 수업만 누를 수 있어요) ───────── */

/** 팀 이름 · 예) 영어 월수 8시 · 영어 화목 7시 30분 */
export function teamName(t: Pick<MyTeamToday, 'lang' | 'when' | 'label'>) {
  const [days, time] = t.when.split(' ');
  if (t.label) return `${t.label} ${hourLabel(time)}`;
  return `${LANGS[t.lang].ko} ${days} ${hourLabel(time)}`;
}

/** 전산에서 오늘 수업을 연 내 팀 */
export type OpenTeam = MyTeamToday & { slot: number };
export const isOpenToday = (t: MyTeamToday): t is OpenTeam => t.slot !== null;
/**
 * 내 팀 · 오늘 열린 수업 (가짜 전산은 요일로 열어요 · 개발용 ?now= 기준).
 * 지점 관리자는 등록된 팀이 없어서 지점의 오늘 세션 전부 — 출석 카드가 '지점의 다음 세션'을 보여 줘요 (10-roles 4장).
 */
export const myTeams = () => {
  const me = getMe();
  return me.role === 'manager' ? branchTeamsOn(nowDate().getDay(), me.branch) : myTeamsOn(nowDate().getDay());
};
export const openTeams = () => myTeams().filter(isOpenToday);
export const openTeamAt = (slot: number, lang: number) => openTeams().find((t) => t.slot === slot && t.lang === lang);

/** 이 팀을 지금 누를 수 있나: 오늘 열린 수업 + 시트 모드의 시간 창 */
export const teamSelectable = (t: MyTeamToday, mode: SheetMode, m: number) => isOpenToday(t) && slotSelectable(t.slot, mode, m);
export function teamSub(t: MyTeamToday, mode: SheetMode, m: number) {
  return isOpenToday(t) ? slotSub(t.slot, mode, m) : '스터디 쉬는 날';
}

/** 시트를 열 때 처음 골라 둘 팀: 지금 고른 것 → 누를 수 있는 첫 팀. 없으면 null */
export function firstTeam(slot: number, lang: number, mode: SheetMode, m: number) {
  const cur = openTeamAt(slot, lang);
  if (cur && slotSelectable(cur.slot, mode, m)) return cur;
  return openTeams().find((t) => slotSelectable(t.slot, mode, m)) ?? null;
}
