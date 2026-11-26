import type { QueryKey } from '@tanstack/react-query';

import { EMPTY_BRANCH_SUMMARY, type BranchSummary } from '@/api/branch-summary';
import { queryKeys } from '@/api/queries';
import { nowDate } from '@/components/home/attendance';
import { REJECT_NOTE_MOCK } from '@/state/link-events';
import type { Me } from '@/state/me';

/**
 * 툴바 '보는 사람' (globals.userKind) — 스토리 전용 사람 묶음.
 * 앱의 회원 유형(state/access userKind)은 회원 · 비회원 둘뿐이고, 비회원이 무엇을 기다리는지는 서버 요약(GET /me/branch-summary)이 알려 줘요.
 * 그래서 사람마다 나(state/me)에 덮을 값(USER_KIND_PATCH)과 요약(PERSONA_SUMMARY) 두 가지를 같이 정해요 (.storybook/preview 가 둘 다 채워요).
 * 스토리 하나를 특정 사람에 고정하려면 `globals: { userKind: 'pending' }`.
 */
export type StoryPersona = 'member' | 'pending' | 'rejected' | 'trial' | 'app' | 'guest';

const TRIAL = { branch: '하남점', day: '2026-12-03', time: '19:30', lang: 'en' } as const;

export const USER_KIND_PATCH: Record<StoryPersona, Partial<Me>> = {
  member: { role: 'member', link: 'linked', trial: null, plan: 'study' },
  pending: { role: 'guest', link: 'pending', trial: null, plan: 'study' },
  rejected: { role: 'guest', link: 'rejected', trial: null, plan: 'study' },
  trial: { role: 'guest', link: 'none', trial: { ...TRIAL }, plan: 'study' },
  app: { role: 'guest', link: 'none', trial: null, plan: 'app' },
  guest: { role: 'guest', link: 'none', trial: null, plan: 'study' },
};

/** 사람마다 서버 요약 (연동 대기 · 확인 안 한 반려 · 다가오는 체험) */
export const PERSONA_SUMMARY: Record<StoryPersona, BranchSummary> = {
  member: EMPTY_BRANCH_SUMMARY,
  pending: { ...EMPTY_BRANCH_SUMMARY, pendingLinks: [{ id: 'story-pending', branchCode: 'HANAM', branchName: '하남점', requestedAt: '2026-11-25T01:00:00Z' }] },
  rejected: {
    ...EMPTY_BRANCH_SUMMARY,
    rejectedLinks: [{ id: 'story-rejected', branchCode: 'HANAM', branchName: '하남점', rejectionReason: REJECT_NOTE_MOCK, decidedAt: '2026-11-25T03:00:00Z' }],
  },
  trial: {
    ...EMPTY_BRANCH_SUMMARY,
    upcomingTrials: [
      { id: 'story-trial', branchCode: 'HANAM', branchName: TRIAL.branch, branchPhone: null, languageCode: TRIAL.lang, languageLabel: '영어', date: TRIAL.day, time: TRIAL.time },
    ],
  },
  app: EMPTY_BRANCH_SUMMARY,
  guest: EMPTY_BRANCH_SUMMARY,
};

/** 요약 캐시 한 줄 — 체험이 오늘부터 n일 뒤(음수 = 지난) 19:30 인 사람. 예) `parameters: { queries: [trialSummaryIn(3)] }` */
export function trialSummaryIn(daysAhead: number): readonly [QueryKey, BranchSummary] {
  const d = nowDate();
  d.setDate(d.getDate() + daysAhead);
  const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const [trial] = PERSONA_SUMMARY.trial.upcomingTrials;
  return [queryKeys.branchSummary, { ...EMPTY_BRANCH_SUMMARY, upcomingTrials: [{ ...trial, date: day }] }];
}

export const personaOf = (globals: Record<string, unknown>): StoryPersona => (globals.userKind as StoryPersona | undefined) ?? 'member';

/** 이 스토리가 쓸 요약 — 스토리가 `parameters.queries` 로 요약을 직접 채웠으면 그걸, 아니면 사람 것 */
export function storySummary(globals: Record<string, unknown>, queries: readonly (readonly [QueryKey, unknown])[] | undefined): BranchSummary {
  const seeded = queries?.find(([key]) => JSON.stringify(key) === JSON.stringify(queryKeys.branchSummary));
  return (seeded?.[1] as BranchSummary | undefined) ?? PERSONA_SUMMARY[personaOf(globals)];
}

export const USER_KIND_ITEMS: { value: StoryPersona; title: string }[] = [
  { value: 'member', title: '회원 (연동됨)' },
  { value: 'pending', title: '비회원 · 연동 대기' },
  { value: 'rejected', title: '비회원 · 반려 확인 전' },
  { value: 'trial', title: '비회원 · 체험 예약' },
  { value: 'app', title: '비회원 · 앱 구독' },
  { value: 'guest', title: '비회원' },
];
