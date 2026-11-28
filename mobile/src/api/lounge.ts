/**
 * 라운지 탭 '새 글' 배지 — `GET /lounge/unread-counts` (docs/api/openapi.yaml · x-status new, 백엔드 아직 없음).
 *
 * 탭마다 '마지막으로 본 때'는 기기가 갖고 있다가 보내요. 서버는 그때 뒤로 올라온 수만 세요 (서버에 저장하는 것 없음).
 * 보낸 시각은 서버 시계 기준이에요 — 응답의 serverTime 으로 기기 시계 차이를 맞춰서 저장해요 (api/use-lounge-new-counts.ts).
 * 지점 필터는 배지에 안 들어가요: 고른 지점과 상관없이 전체에서 세요.
 */
import { http } from './client';
import { apiConfig } from './config';
import { mock } from './mock';

type Opts = { signal?: AbortSignal };

/** 배지를 다는 탭 (추천은 빼요 · 해외 동행은 출시 때 꺼져 있어 아직 없어요) */
export type LoungeBadgeTab = 'com' | 'chal' | 'meet';
export const LOUNGE_BADGE_TABS: LoungeBadgeTab[] = ['com', 'chal', 'meet'];

/** 탭마다 마지막으로 본 때 (UTC ISO). 없는 탭은 서버가 0 으로 줘요 */
export type LoungeUnreadSince = Partial<Record<LoungeBadgeTab, string>>;

/** 서버는 10개까지만 세요 (화면은 9+ 까지만 보여요) */
export const LOUNGE_UNREAD_CAP = 10;

export type LoungeUnreadCounts = Record<LoungeBadgeTab, number> & {
  /** 서버가 센 때 (UTC ISO) — 기기는 이 시계로 '본 때'를 남겨요 */
  serverTime: string;
};

/* ───────── 가짜 서버 ───────── */

/** 가짜 서버가 세는 방법 — 기기 안 예시 데이터를 보는 쪽(api/use-lounge-new-counts)이 넣어 줘요 (여기서 화면 부품을 불러오지 않게) */
let mockCount: (since: LoungeUnreadSince) => Record<LoungeBadgeTab, number> = () => ({ com: 0, chal: 0, meet: 0 });
export function setLoungeUnreadMock(fn: typeof mockCount) {
  mockCount = fn;
}

/** GET /lounge/unread-counts?com=&chal=&meet= — 탭별 그때 뒤로 올라온 수 (내 것 · 차단 · 숨김 · 지운 것 빼고, 10개까지) */
export function fetchLoungeUnreadCounts(since: LoungeUnreadSince, { signal }: Opts = {}): Promise<LoungeUnreadCounts> {
  if (apiConfig.useMock) return mock('loungeUnreadCounts', () => ({ ...mockCount(since), serverTime: new Date().toISOString() }));
  return http.get('/lounge/unread-counts', { query: { com: since.com, chal: since.chal, meet: since.meet }, signal });
}
