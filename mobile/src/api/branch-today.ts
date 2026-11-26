/**
 * 오늘 지점 현황 (지점 관리자) — GET /manager/branch/today (docs/api/openapi.yaml BranchToday · 아직 서버에 없어요).
 * 가짜 서버: data/branch-today 의 시간표 + 지금 시각으로 인원을 만들고, 내 출석(멤버로 · 프로로)을 더해요.
 */
import { getAttend, minuteOf, nowDate } from '@/components/home/attendance';
import { BRANCH_CLOSED_DOW, MOCK_BRANCH_SESSIONS, type BranchSession, type BranchToday, type MockBranchSession } from '@/data/branch-today';
import { LANGS, QR_AFTER, QR_BEFORE, SLOTS } from '@/data/home';
import { createStore } from '@/lib/store';
import { getMe } from '@/state/me';
import { dayKey } from '@/state/today-goal';

import { http } from './client';
import { apiConfig } from './config';
import { mock } from './mock';

type Opts = { signal?: AbortSignal };

/* ───────── 가짜 서버: 스텝이 '프로로 참여'로 대신한 세션 ───────── */

type ProCover = { day: string; sessions: Record<string, { at: string; name: string; tableNo: number }> };
const cover = createStore<ProCover>({ day: '', sessions: {} });

/** 스텝이 테이블 QR 에서 '프로로 참여' (POST /study/sessions/{id}/check-in {tableId, role: LEADER}) */
export function sendProCheckIn({ sessionId, tableNo }: { sessionId: string; tableNo: number }): Promise<void> {
  if (apiConfig.useMock)
    return mock('proCheckIn', () => {
      const day = dayKey(nowDate().getTime());
      cover.set((c) => ({ day, sessions: { ...(c.day === day ? c.sessions : {}), [sessionId]: { at: nowDate().toISOString(), name: getMe().name, tableNo } } }));
    });
  return http.post(`/study/sessions/${sessionId}/check-in`, { tableId: tableNo, role: 'LEADER' });
}

/* ───────── 가짜 서버: 시간표 → 오늘 현황 ───────── */

const atMinute = (m: number) => {
  const d = nowDate();
  d.setHours(Math.floor(m / 60), m % 60, 0, 0);
  return d.toISOString();
};

/** QR 이 열린 뒤 지난 만큼 멤버가 와요 (마감되면 다 왔어요) */
function arrived(full: number, start: number, m: number) {
  const open = start - QR_BEFORE;
  if (m < open) return 0;
  const span = QR_BEFORE + QR_AFTER;
  return Math.min(full, Math.round((full * (m - open + 1)) / span));
}

function mockSession(s: MockBranchSession, m: number, covers: ProCover['sessions']): BranchSession {
  const start = SLOTS[s.slot].start;
  const me = getAttend();
  // 내가 멤버로 출석한 세션이면 첫 테이블에 +1 (가짜 서버는 테이블을 첫 칸으로 쳐요)
  const mine = me.checked && me.slot === s.slot && me.lang === s.lang;
  const staff = covers[s.id];
  const proAt = start - 25;
  const proCame = !s.proLate && m >= proAt;
  const tables = s.tables.map((t, i) => {
    const checkedIn = arrived(t.full, start, m) + (mine && i === 0 ? 1 : 0);
    const proHere = staff ? staff.tableNo === t.no : proCame && i === 0;
    return { tableId: t.no, tableNo: t.no, tableName: null, checkedIn, proCheckedIn: proHere };
  });
  return {
    sessionId: s.id,
    startsAt: atMinute(start),
    teamName: s.team,
    lang: LANGS[s.lang].key,
    level: s.level,
    room: null,
    proName: s.pro,
    proCheckedInAt: staff ? staff.at : proCame ? atMinute(proAt) : null,
    proCheckedInBy: staff ? 'STAFF' : proCame ? 'PRO' : null,
    proCheckedInName: staff ? staff.name : proCame ? s.pro : null,
    checkedIn: tables.reduce((n, t) => n + t.checkedIn, 0),
    tables,
  };
}

function mockBranchToday(): BranchToday {
  const d = nowDate();
  const m = minuteOf(d);
  const day = dayKey(d.getTime());
  const c = cover.get();
  const covers = c.day === day ? c.sessions : {};
  const sessions = BRANCH_CLOSED_DOW.includes(d.getDay()) ? [] : MOCK_BRANCH_SESSIONS.map((s) => mockSession(s, m, covers));
  return { branch: { code: 'hanam', name: getMe().branch }, date: day, sessions };
}

/** GET /manager/branch/today */
export function fetchBranchToday({ signal }: Opts = {}): Promise<BranchToday> {
  if (apiConfig.useMock) return mock('branchToday', mockBranchToday);
  return http.get('/manager/branch/today', { signal });
}
