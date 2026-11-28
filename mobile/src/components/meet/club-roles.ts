/**
 * 동아리 · 번개 순수 판정 (UI 를 불러오지 않아요) — components/meet/model 이 다시 내보내고, api/my-activity 가짜 서버도 써요.
 */
import { CLUBS, MEETS, type Club, type Meet } from '@/data/meet';
import { devClubRole } from '@/lib/dev-profile';

/** 운영 중인 동아리 (승인됐고 · 거절 · 닫힘이 아니에요) */
export const clubLive = (c: Club) => !c.wait && !c.rejected && !c.closed;

export const findMeet = (id: string, mine: Meet[]) => mine.find((m) => m.id === id) ?? MEETS.find((m) => m.id === id);
export const findClub = (id: string, mine: Club[]) => mine.find((c) => c.id === id) ?? CLUBS.find((c) => c.id === id);

/** 개발용 '운영 중인 동아리' (모임 역할을 호스트 · 코호스트로 골랐을 때) */
const DEV_RUN_CLUB = 'cl4';

/**
 * 내 호스트 · 코호스트 자격 (useMyClubRoles 의 계산 — 훅 밖에서도 써요).
 * 호스트: 내가 만든 동아리가 관리자 승인을 받았고 닫히지 않았을 때. 코호스트: 그 동아리 호스트가 나를 코호스트로 정했고 동아리가 운영 중일 때.
 */
export function myClubRoles(myName: string, mine: Club[], cohost: Record<string, string[]>) {
  const real = mine.filter((c) => clubLive(c));
  const all = [...mine, ...CLUBS];
  const realCo = all.filter((c) => clubLive(c) && !c.mine && (cohost[c.id] ?? []).includes(myName));
  // 개발용: 마이 '개발 · 사람'에서 모임 역할을 호스트 · 코호스트로 고르면, 예시 동아리 하나를 운영 중인 것으로 봐요 (뱃지 · 내 모임 확인용)
  const devClub = __DEV__ && (devClubRole === 'host' || devClubRole === 'co') ? CLUBS.find((c) => c.id === DEV_RUN_CLUB) : undefined;
  const hostOf = devClub && devClubRole === 'host' ? [...real, devClub] : real;
  const coOf = devClub && devClubRole === 'co' ? [...realCo, devClub] : realCo;
  const badge: 'host' | 'co' | null = hostOf.length ? 'host' : coOf.length ? 'co' : null;
  return { hostOf, coOf, badge };
}
