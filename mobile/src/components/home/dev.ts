/*
 * 개발용 (웹에서만 · 상태 캡처용): 주소 뒤 ?now=19:45 로 지금 시각을, ?season=spring 으로 맵 계절을, ?plan=app 으로 앱 구독자 홈을 봐요.
 * ?link=pending 으로 지점 연동 확인 중 화면을, ?name=말많은망고 로 긴 닉네임을 봐요 (홈 · 마이).
 * ?link= 은 역할도 같이 바꿔요: pending · rejected · none(비회원) → guest, linked → member.
 * ?trial=1 로 체험 예약한 사람(영등포점 · 사흘 뒤 19:30)을, ?trial=today 로 체험 당일을, ?trial=past 로 체험이 지난 뒤를 봐요.
 * ?follow=민준,소라 로 팔로우한 멤버를 정해요.
 * ?admin=link · ?admin=reject 로 지점 매니저가 연동 요청을 처리한 것처럼 흉내 내요 (확인 중에서 2.5초 뒤 결과 도착 · state/link-events).
 * 화면에는 아무것도 그리지 않아요. 실제 앱에서는 쓰이지 않아요.
 */
import { Platform } from 'react-native';

import type { Season } from '@/constants/season';
import { simulateBranchResult } from '@/state/link-events';
import { updateMe } from '@/state/me';

import { nowDate, setClockOffset } from './attendance';

let season: Season | null = null;
export const devSeason = () => season;

const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter', 'xmas'];

/** ?plan=app: 앱 구독자 홈(오늘의 목표 카드)으로 봐요 */
export function applyDevPlan(plan?: string) {
  if (Platform.OS !== 'web' || !__DEV__) return;
  if (plan === 'app' || plan === 'study') updateMe({ plan });
}

/** ?link=pending|linked|rejected|none · ?trial=1|today|past · ?name=닉네임: 연동 상태 · 체험 예약 · 닉네임을 바꿔 봐요 */
export function applyDevMe({ link, name, trial, follow }: { link?: string; name?: string; trial?: string; follow?: string }) {
  if (Platform.OS !== 'web' || !__DEV__) return;
  // 연동되기 전은 모두 비회원 권한 (state/access)
  if (link === 'linked') updateMe({ link, role: 'member', trial: null });
  if (link === 'pending' || link === 'rejected' || link === 'none') updateMe({ link, role: 'guest', trial: null });
  if (trial) {
    const ahead = trial === 'today' ? 0 : trial === 'past' ? -2 : 3;
    updateMe({ role: 'guest', link: 'none', plan: 'study', trial: { branch: '영등포점', day: dayKey(ahead), time: '19:30', lang: 'en' } });
  }
  if (name) updateMe({ name: name.slice(0, 20) });
  // ?follow=민준,소라 : 팔로우한 멤버를 정해요 ('함께 가자고 할까요?' 시트 확인용)
  if (follow) updateMe({ following: Object.fromEntries(follow.split(',').filter(Boolean).map((n) => [n.trim(), true])) });
}

/** 오늘부터 n일 뒤 'YYYY-MM-DD' (개발용 시각 ?now= 기준) */
function dayKey(n: number) {
  const d = nowDate();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function applyDevParams({ now, season: s }: { now?: string; season?: string }) {
  if (Platform.OS !== 'web' || !__DEV__) return;
  if (now && /^\d{1,2}:\d{2}$/.test(now)) {
    const [h, m] = now.split(':').map(Number);
    const want = new Date();
    want.setHours(h, m, 0, 0);
    setClockOffset(want.getTime() - Date.now());
  }
  season = SEASONS.find((x) => x === s) ?? null;
}

/** ?admin=link|reject: 확인 중으로 두고, 지점이 처리한 결과가 2.5초 뒤 도착해요 */
export function applyDevAdmin(admin?: string) {
  if (Platform.OS !== 'web' || !__DEV__) return;
  if (admin !== 'link' && admin !== 'reject') return;
  updateMe({ link: 'pending', role: 'guest', trial: null });
  simulateBranchResult(admin === 'link' ? 'linked' : 'rejected');
}
