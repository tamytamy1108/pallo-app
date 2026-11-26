import { useQuery } from '@tanstack/react-query';

import { nowDate } from '@/components/home/attendance';

import { trialApplicationsQuery } from './queries';
import type { TrialApplication } from './trial-applications';

export type TrialApplicationGroups = {
  /** 상담 희망 일시가 아직 안 온 신청 — 가까운 순 */
  upcoming: TrialApplication[];
  /** 그 시각이 지난 신청 — 최근 상담 순 */
  past: TrialApplication[];
};

/** 기기 시각(nowDate — 개발용 시간 이동 포함)을 'YYYY-MM-DD HH:mm' 로 — 서버 date · time 과 글자로 비교해요 */
const stamp = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
const keyOf = (a: TrialApplication) => `${a.date} ${a.time}`;

/** 다가오는 · 지난 신청으로 나눠요 (요약 upcomingTrials 와 같은 기준: 상담 시각이 되면 '지난') */
export function splitTrialApplications(rows: TrialApplication[], now: Date = nowDate()): TrialApplicationGroups {
  const at = stamp(now);
  const upcoming = rows.filter((a) => keyOf(a) > at).sort((a, b) => keyOf(a).localeCompare(keyOf(b)));
  const past = rows.filter((a) => keyOf(a) <= at).sort((a, b) => keyOf(b).localeCompare(keyOf(a)));
  return { upcoming, past };
}

/** 상담 신청 내역 — 다가오는 · 지난 신청 */
export function useTrialApplications() {
  return useQuery({ ...trialApplicationsQuery(), select: (rows) => splitTrialApplications(rows) });
}
