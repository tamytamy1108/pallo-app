/*
 * 개발용 (웹에서만 · 상태 캡처용): 주소 뒤 ?now=19:45 로 지금 시각을, ?season=spring 으로 맵 계절을, ?plan=app 으로 앱 구독자 홈을 봐요.
 * 화면에는 아무것도 그리지 않아요. 실제 앱에서는 쓰이지 않아요.
 */
import { Platform } from 'react-native';

import type { Season } from '@/constants/season';
import { updateMe } from '@/state/me';

import { setClockOffset } from './attendance';

let season: Season | null = null;
export const devSeason = () => season;

const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter', 'xmas'];

/** ?plan=app: 앱 구독자 홈(오늘의 목표 카드)으로 봐요 */
export function applyDevPlan(plan?: string) {
  if (Platform.OS !== 'web' || !__DEV__) return;
  if (plan === 'app' || plan === 'study') updateMe({ plan });
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
