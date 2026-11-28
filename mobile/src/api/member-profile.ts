/**
 * 남의 프로필 — `GET /app/api/v2/members/{code}/profile` (백엔드 MobileMemberProfileV2Controller). 프로필 시트 한 장의 값을 한 번에 받아요.
 *
 * 서버는 도메인이 아직 없는 값을 기본값으로 줘요 (언어 [] · 팔로우 0 · 학습 현황 0 · null) — 앱은 받은 대로 그려요.
 * TODO(고도화): 언어 · 팔로우 · 학습 현황 · 포인트 달리기 · 함께 아는 멤버 · 추천 멤버 · 계정 역할(PRO · STAFF · HOST) · 차단은
 * 서버 도메인이 생기면 응답에 채워요 (지금 함께 아는 멤버 · 추천 · 역할 표시는 예시 값 그대로).
 *
 * 가짜 서버는 code 자리에 멤버 이름을 받아 예시 값(data/my)으로 그려요 — 예시 화면(모임 · 챌린지)이 이름으로 열기 때문이에요.
 */
import { followLists, findMember, MY_BADGES, memberAvatar, memberBio, memberLangs, nameHash } from '@/data/my';
import { getMe } from '@/state/me';

import { toLook, type AvatarLook } from './avatar';
import { http } from './client';
import { apiConfig } from './config';
import { mock } from './mock';

type Opts = { signal?: AbortSignal };

export type MemberProfile = {
  code: string;
  displayName: string;
  /** 꾸민 캐릭터 — 아직 안 골랐으면 null */
  avatar: AvatarLook | null;
  /** 연동된 지점 — 없으면 null */
  branchName: string | null;
  joinedAt: string;
  /** 한 줄 소개 — 안 남겼으면 null */
  bio: string | null;
  /** TODO(고도화) 배우는 언어 — 서버는 지금 늘 빈 목록 */
  languages: string[];
  /** TODO(고도화) 팔로우 — 서버는 지금 0 · 0 · false */
  follow: { following: number; followers: number; viewerFollowing: boolean };
  /** 참여 중인 모임 (마이 탭 숫자 칸과 같은 기준) */
  joinedMeetCount: number;
  /** TODO(고도화) 학습 현황 — 서버는 지금 0 · null */
  stats: { streakDays: number; weekRank: number | null; weekPoints: number; totalPoints: number };
  /** 받은 배지만 (콘솔 순서) */
  badges: { code: string; name: string; description: string; imageUrl: string | null }[];
};

/** 예시 멤버 → 서버 모양. 시트가 예전에 이름으로 만들던 예시 값과 같게 */
function mockProfile(name: string): MemberProfile {
  const h = nameHash(name);
  const me = getMe();
  const L = followLists(name, me, me.following);
  return {
    code: name,
    displayName: name,
    avatar: toLook(memberAvatar(name)),
    branchName: findMember(name)?.branch ?? me.branch,
    joinedAt: '2026-01-01T00:00:00+09:00',
    bio: memberBio(name) || null,
    languages: memberLangs(name),
    follow: { following: L.fing.length, followers: L.fer.length, viewerFollowing: !!me.following[name] },
    // 예시 '참여 중' 목록(components/my/profile-meets)은 아직 이름으로 고른 예시예요 — 숫자만 대략 맞춰요
    joinedMeetCount: 1 + (h % 4),
    stats: { streakDays: 3 + (h % 40), weekRank: 2 + (h % 9), weekPoints: 90 + ((h * 7) % 140), totalPoints: 1200 + ((h * 37) % 3000) },
    badges: MY_BADGES.filter((_, i) => (h + i) % 3 !== 0)
      .slice(0, 4)
      .map((b) => ({ code: b.code, name: b.name, description: b.desc, imageUrl: null })),
  };
}

/** GET /members/{code}/profile — 없는 code 는 404 */
export function fetchMemberProfile(code: string, { signal }: Opts = {}): Promise<MemberProfile> {
  if (apiConfig.useMock) return mock('memberProfile', () => mockProfile(code));
  return http.get(`/members/${encodeURIComponent(code)}/profile`, { signal });
}
