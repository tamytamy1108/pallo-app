/**
 * 체험 예약 칸 값 · 앱 안에서 방금 한 체험 예약 (예약 확정 화면이 읽어요).
 * 가입 중 예약은 온보딩 값(state/onboarding)에 같은 이름으로 담겨요. 맞는 API: 47 `POST /trial-bookings`.
 */
import { createStore } from '@/lib/store';
import type { StudyLang } from '@/state/me';

/** 체험 예약 칸 값 (가입 온보딩 값과 같은 이름). 희망 언어는 langs[0] 하나 */
export type TrialDraft = {
  branch: string;
  realName: string;
  phone: string;
  langs: StudyLang[];
  why: string[];
  trialDay: string;
  trialTime: string;
  note: string;
};

const store = createStore<TrialDraft | null>(null);

/** 앱 안에서 방금 한 예약 (없으면 null — 주소로 바로 들어온 경우) */
export const useLastTrial = store.useStore;
export const setLastTrial = (b: TrialDraft) => store.set(b);
