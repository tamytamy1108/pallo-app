/**
 * 내 배지 — `GET /app/api/v2/me/badges` · `GET /me/badges/unseen` · `POST /me/badges/seen` (백엔드 MobileBadgeV2Controller).
 * 배지는 서버가 활동(번개 참여 확정 · 동아리 정식 멤버 · 한 글 좋아요 수)에 맞춰 주고, 받으면 인앱 알림 + 푸시(type BADGE)가 와요.
 * 푸시를 꺼 두었을 수 있어서 앱은 열릴 때 · 앞으로 돌아올 때 '안 본 배지'를 물어 축하 시트를 띄우고, 띄운 배지 코드만 본 것으로 보내요.
 *
 * 받는 조건(conditionType · threshold) · 진행(progress)은 배지 상세의 '받는 방법'에 써요 — 서버에 더해 달라고 한 칸이에요
 * (docs/frontend/api-additions.md A36). 아직 안 오면 화면은 설명 글만 보여요.
 *
 * 가짜 서버는 예시 배지(data/my MY_BADGES)를 그대로 주고, 안 본 배지는 없어요.
 */
import { MY_BADGES, type BadgeConditionType } from '@/data/my';

import { http } from './client';
import { apiConfig } from './config';
import { mock } from './mock';

type Opts = { signal?: AbortSignal };

export type MyBadge = {
  /** 배지 코드 — 알림 referenceId · 본 것으로 보낼 때 쓰는 키 */
  code: string;
  name: string;
  description: string;
  /** 256×256 투명 배경 PNG */
  imageUrl: string | null;
  earned: boolean;
  /** 받은 시각 — 못 받았으면 null */
  earnedAt: string | null;
  /** 달성 조건 유형 (A36) — 없으면 받는 방법을 설명 글로만 */
  conditionType?: BadgeConditionType | null;
  /** 기준 숫자 (A36) */
  threshold?: number | null;
  /** 지금 내 값 (A36) — 번개 참여 수 · 가장 좋아요 많은 글의 좋아요 수 등. 서버가 아직 셀 수 없으면 null */
  progress?: number | null;
};

const mockBadges = (): MyBadge[] =>
  MY_BADGES.map((b) => ({
    code: b.code,
    name: b.name,
    description: b.desc,
    imageUrl: null,
    earned: b.on,
    earnedAt: b.earnedAt ?? null,
    conditionType: b.cond?.type ?? null,
    threshold: b.cond?.threshold ?? null,
    progress: b.cond?.progress ?? null,
  }));

/** GET /me/badges — 배지 모두 보기 (앱에 보이는 배지 전부 + 받은 배지, 콘솔 순서) */
export function fetchMyBadges({ signal }: Opts = {}): Promise<MyBadge[]> {
  if (apiConfig.useMock) return mock('myBadges', mockBadges);
  return http.get('/me/badges', { signal });
}

/** GET /me/badges/unseen — 아직 축하 시트를 안 본 배지 (받은 순, 없으면 빈 목록) */
export function fetchUnseenBadges({ signal }: Opts = {}): Promise<MyBadge[]> {
  if (apiConfig.useMock) return mock('unseenBadges', (): MyBadge[] => []);
  return http.get('/me/badges/unseen', { signal });
}

/** POST /me/badges/seen — 띄운 배지만 본 것으로 (여러 번 보내도 같아요) */
export function markBadgesSeen(codes: string[]): Promise<void> {
  if (apiConfig.useMock) return mock('badgesSeen', () => undefined);
  return http.post<void>('/me/badges/seen', { codes });
}
