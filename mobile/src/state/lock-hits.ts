/**
 * 비회원 잠김 → 안내 · 권유 시트 상태 (docs/pages/09-onboarding.md '회원 · 비회원 권한').
 * - 누름(탭)은 여기서 세지 않아요: 회원만 되는 걸 누르면 늘 guardMember(…, why) 가 체험 안내 시트를 띄워요 (components/common/trial-guide).
 * - 스크롤로 잠긴 칸이 보이기만 한 것(lockView)만 세요: 앱을 켠 동안 3 · 6 · 9 … 번째면 '체험해 보시겠어요?' 권유 시트.
 * - 무료 첫 챕터를 다 끝내고 다음 챕터로 가려 하면 chapterUpsell() 로 '실제 대화' 권유 시트.
 * - 시트는 한 번에 하나만: 안내 시트나 권유 시트가 떠 있으면(guideBusy) 새로 띄우지 않아요.
 * 연동 대기 · 확인 안 한 반려(api/use-branch-progress · 서버 요약)는 세지도 띄우지도 않아요 — 짧은 토스트만. 회원은 아무 일도 없어요.
 */
import { router } from 'expo-router';

import { getBranchProgress } from '@/api/use-branch-progress';
import { showToast } from '@/components/ui/toast';
import { createStore } from '@/lib/store';
import { isMember } from '@/state/access';
import { getMe } from '@/state/me';

/** 스크롤 잠김을 몇 번 볼 때마다 권유 시트 */
export const POPUP_EVERY = 3;

/** lock: 잠김을 여러 번 봤을 때 · chapter: 첫 챕터를 끝냈을 때 · trial: 체험 예약한 사람이 회원 전용을 눌렀을 때 */
export type Upsell = 'lock' | 'chapter' | 'trial';

type LockState = { count: number; upsell: Upsell | null; why: string; introOpen: boolean };

const store = createStore<LockState>({ count: 0, upsell: null, why: '', introOpen: false });

export const useUpsell = () => store.useStore((s) => s.upsell);
export const useUpsellWhy = () => store.useStore((s) => s.why);
export const getLockHits = () => store.get().count;
export const closeUpsell = () => store.set((s) => ({ ...s, upsell: null }));

/** 체험 안내 시트(TrialGuideHost)가 열리고 닫힐 때 알려요 */
export const setIntroOpen = (open: boolean) => store.set((s) => (s.introOpen === open ? s : { ...s, introOpen: open }));
/** 안내 · 권유 시트 중 하나라도 떠 있으면 true (두 장이 겹치지 않게) */
export const guideBusy = () => store.get().introOpen || store.get().upsell !== null;

const openUpsell = (upsell: Upsell, why = '') => {
  if (guideBusy()) return false;
  store.set((s) => ({ ...s, upsell, why }));
  return true;
};

const rejectedToast = (msg: string) => showToast(msg, { label: '다시 요청', onPress: () => router.push('/link-rejected') });

/** 체험 예약한 사람이 회원 전용을 눌렀을 때: 다시 예약하지 않게 '예약한 체험' 시트 (why 를 제목에) */
export const trialReminder = (why: string) => openUpsell('trial', why);

/**
 * 스크롤하다 잠긴 칸이 화면에 들어왔어요 (components/common/scroll-lock · 화면에 들어올 때마다 한 번).
 * 3번째마다 권유 시트, 그 밖에는 짧은 토스트.
 * @returns 권유 시트를 띄웠으면 true
 */
export function lockView(toast = '지점 회원이 되면 다 볼 수 있어요') {
  if (isMember(getMe())) return false;
  const { pending, rejected } = getBranchProgress();
  if (pending) {
    showToast('지점 연동이 끝나면 다 볼 수 있어요');
    return false;
  }
  if (rejected) {
    rejectedToast('지점 연동이 필요해요');
    return false;
  }
  const count = store.get().count + 1;
  store.set((s) => ({ ...s, count }));
  if (count % POPUP_EVERY === 0 && openUpsell('lock')) return true;
  showToast(toast);
  return false;
}

/** 무료 첫 챕터를 다 끝내고 다음 챕터로 가려 할 때 */
export function chapterUpsell() {
  if (isMember(getMe())) return;
  const { pending, rejected, trial } = getBranchProgress();
  if (pending) showToast('다음 챕터는 지점 연동이 끝나면 열려요');
  else if (rejected) rejectedToast('다음 챕터는 지점 연동이 필요해요');
  else openUpsell(trial ? 'trial' : 'chapter', trial ? '다음 챕터를 하려면' : '');
}

/** 테스트 · 로그아웃용 */
export const resetLockHits = () => store.set({ count: 0, upsell: null, why: '', introOpen: false });
