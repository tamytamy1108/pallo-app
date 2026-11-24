/**
 * 사전 출석 뒤 '함께 가자고 할까요?' 시트를 띄울지 (docs/pages/01-home.md · 함께 가자).
 * 회원만 · 팔로우한 멤버가 있을 때만 · '2주간 보지 않기'를 누른 뒤 14일 동안은 안 떠요.
 * 쉬는 기한은 기기에 남아요 (lib/device-storage). 여러 기기에서 맞추려면 서버 설정 inviteSnoozeUntil 로 (api-additions 제안).
 */
import { createStore } from '@/lib/store';
import { isMember } from '@/state/access';
import { getMe } from '@/state/me';

export const INVITE_SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;

const store = createStore<{ snoozeUntil: number }>({ snoozeUntil: 0 }, { persist: { key: 'invite-snooze' } });

export const snoozeInvite = (now = Date.now()) => store.set({ snoozeUntil: now + INVITE_SNOOZE_MS });
export const getInviteSnooze = () => store.get().snoozeUntil;

/** 지금 물어봐도 되는지 */
export function shouldAskInvite(now = Date.now()) {
  const me = getMe();
  return isMember(me) && Object.values(me.following).some(Boolean) && now >= store.get().snoozeUntil;
}
