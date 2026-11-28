/**
 * 남의 프로필 (api/member-profile.ts) 을 프로필 시트 모양으로 바꿔요 — 캐릭터는 Avatar, 배지는 배지 칸(Badge).
 * 도메인이 아직 없는 값(언어 · 팔로우 · 학습 현황)은 서버 기본값을 그대로 옮겨요 — TODO(고도화) 는 api/member-profile.ts 에.
 */
import { useQuery } from '@tanstack/react-query';

import { avFresh, type Avatar, type Badge } from '@/data/my';

import { fromLook } from './avatar';
import type { MemberProfile } from './member-profile';
import { memberProfileQuery } from './queries';
import { toBadge } from './use-badges';

export type MemberProfileView = {
  code: string;
  name: string;
  /** 아직 캐릭터를 안 고른 사람은 기본 모습 */
  av: Avatar;
  /** 연동된 지점 — 없으면 빈 글자 */
  branch: string;
  /** 가입한 해 (서버가 KST 로 줘요) */
  joinedYear: string;
  bio: string | null;
  langs: string[];
  following: number;
  followers: number;
  viewerFollowing: boolean;
  meetN: number;
  stats: MemberProfile['stats'];
  /** 받은 배지만 */
  badges: Badge[];
};

export function toMemberProfileView(d: MemberProfile): MemberProfileView {
  return {
    code: d.code,
    name: d.displayName,
    av: d.avatar ? fromLook(d.avatar) : avFresh(),
    branch: d.branchName ?? '',
    joinedYear: d.joinedAt.slice(0, 4),
    bio: d.bio,
    langs: d.languages,
    following: d.follow.following,
    followers: d.follow.followers,
    viewerFollowing: d.follow.viewerFollowing,
    meetN: d.joinedMeetCount,
    stats: d.stats,
    badges: d.badges.map((b) => toBadge({ ...b, earned: true })),
  };
}

/** 프로필 시트 한 장 — code 는 회원 code (가짜 서버는 멤버 이름) */
export function useMemberProfile(code: string) {
  return useQuery({ ...memberProfileQuery(code), enabled: !!code, select: toMemberProfileView });
}
