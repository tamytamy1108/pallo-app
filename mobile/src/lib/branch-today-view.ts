/**
 * 오늘 지점 현황 → 화면에 그릴 모양 (홈 요약 카드 · 모두 보기 화면이 같이 써요).
 * 순서: 지금 QR 이 열린 세션(출석 중) → 예정 → 끝난 수업(맨 아래 · 최근 것 위). docs/pages/10-roles.md 4장.
 */
import type { BranchSession, BranchToday } from '@/data/branch-today';

export type SessionPhase = 'open' | 'soon' | 'done';

export type SessionRow = BranchSession & {
  /** 하루 중 분 (시작) */
  start: number;
  phase: SessionPhase;
};

export type BranchTodayView = {
  branchName: string;
  /** 오늘 열리는 팀 수 — 0이면 쉬는 날 */
  sessions: number;
  /** 오늘 스터디 수 (예: 영어 화목 7시 30분 · 일본어 화목 7시 30분 — 스터디 안에 팀이 여럿) */
  studies: number;
  /** 프로 출석: 몇 명이 했는지 (프로 + 스텝 대타) */
  proCount: number;
  proByPro: number;
  proByStaff: number;
  /** 스텝 출석: 대타 + 그냥 참석 (스텝이 몇 명 왔는지) */
  staffCount: number;
  /** 프로 출석 예정: 프로가 배정된 스터디 수 (전산 시간표) */
  proPlanned: number;
  /** 프로 불참: 출석이 열렸는데(출석 중 · 끝남) 맡은 프로가 안 온 팀 수 — 스텝이 대타로 메워도 프로는 불참 */
  proAbsent: number;
  /** 오늘 온 멤버 수 */
  members: number;
  open: SessionRow[];
  soon: SessionRow[];
  done: SessionRow[];
  /** 홈 한 줄: 지금 출석 중이거나 다음에 열리는 시각과 그 시각 팀들 (없으면 null = 오늘 다 끝남) */
  next: { start: number; phase: 'open' | 'soon'; rows: SessionRow[] } | null;
};

/** 언어 순서: 영어 · 일본어 · 중국어 · 스페인어 (data/home LANGS) */
const LANG_ORDER = ['en', 'ja', 'zh', 'es'];
const langOrder = (key: string) => (LANG_ORDER.includes(key) ? LANG_ORDER.indexOf(key) : LANG_ORDER.length);

const minuteOfIso = (iso: string) => {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
};

/** QR: 시작 qrBefore 분 전 ~ 시작 qrAfter 분 후. 그 뒤는 끝난 수업 */
export function phaseOf(start: number, m: number, qrBefore: number, qrAfter: number): SessionPhase {
  if (m < start - qrBefore) return 'soon';
  if (m > start + qrAfter) return 'done';
  return 'open';
}

export function toBranchTodayView(data: BranchToday, m: number, qrBefore: number, qrAfter: number): BranchTodayView {
  const rows: SessionRow[] = data.sessions
    .map((s) => {
      const start = minuteOfIso(s.startsAt);
      return { ...s, start, phase: phaseOf(start, m, qrBefore, qrAfter) };
    })
    .sort((a, b) => a.start - b.start || langOrder(a.lang) - langOrder(b.lang));
  const open = rows.filter((r) => r.phase === 'open');
  const soon = rows.filter((r) => r.phase === 'soon');
  const done = rows.filter((r) => r.phase === 'done').reverse();
  const head = open[0] ?? soon[0];
  const next = head ? { start: head.start, phase: head.phase === 'open' ? ('open' as const) : ('soon' as const), rows: rows.filter((r) => r.start === head.start) } : null;
  const proByPro = rows.filter((r) => r.proCheckedInBy === 'PRO').length;
  const proByStaff = rows.filter((r) => r.proCheckedInBy === 'STAFF').length;
  return {
    branchName: data.branch.name,
    sessions: rows.length,
    studies: new Set(rows.map((r) => r.studyName)).size,
    proCount: proByPro + proByStaff,
    proByPro,
    proByStaff,
    staffCount: proByStaff + rows.filter((r) => r.staffJoinedName).length,
    proPlanned: rows.filter((r) => r.proName).length,
    proAbsent: rows.filter((r) => r.proName && r.phase !== 'soon' && r.proCheckedInBy !== 'PRO').length,
    members: rows.reduce((n, r) => n + r.checkedIn, 0),
    open,
    soon,
    done,
    next,
  };
}

export type StudyGroup = { studyName: string; rows: SessionRow[] };

/** 같은 스터디의 팀끼리 묶어요 (순서는 들어온 순서 그대로) */
export function groupByStudy(rows: SessionRow[]): StudyGroup[] {
  const out: StudyGroup[] = [];
  for (const r of rows) {
    const g = out.find((x) => x.studyName === r.studyName);
    if (g) g.rows.push(r);
    else out.push({ studyName: r.studyName, rows: [r] });
  }
  return out;
}
