/**
 * 남의 프로필 (api/member-profile.ts · api/use-member-profile.ts toMemberProfileView) — 서버 기본값 그대로 옮기기 · 없는 값 대신 채우기.
 */
import { avFresh } from '@/data/my';

import { fromLook } from '../avatar';
import { fetchMemberProfile, type MemberProfile } from '../member-profile';
import { toMemberProfileView } from '../use-member-profile';

jest.mock('../config', () => ({
  apiConfig: { env: 'dev', baseUrl: '', useMock: true, mockDelayMs: 0, timeoutMs: 15000 },
}));

/** 도메인이 아직 없는 값을 기본값으로 준 서버 응답 (백엔드 MemberProfileV2Response) */
const SERVER: MemberProfile = {
  code: 'AB12CD3',
  displayName: '지우',
  avatar: null,
  branchName: null,
  joinedAt: '2025-12-31T23:30:00+09:00',
  bio: null,
  languages: [],
  follow: { following: 0, followers: 0, viewerFollowing: false },
  joinedMeetCount: 2,
  stats: { streakDays: 0, weekRank: null, weekPoints: 0, totalPoints: 0 },
  badges: [{ code: 'first-hangout', name: '첫 번개', description: '번개 첫 참여', imageUrl: 'https://cdn.example/badge-images/a.png' }],
};

describe('서버 프로필 → 프로필 시트', () => {
  it('기본값은 그대로, 없는 캐릭터 · 지점은 기본 모습 · 빈 글자, 가입 연도는 서버(KST) 날짜에서', () => {
    const v = toMemberProfileView(SERVER);
    expect(v).toMatchObject({ code: 'AB12CD3', name: '지우', branch: '', joinedYear: '2025', bio: null, langs: [], following: 0, followers: 0, viewerFollowing: false, meetN: 2 });
    expect(v.stats).toEqual({ streakDays: 0, weekRank: null, weekPoints: 0, totalPoints: 0 });
    expect(v.av).toEqual(avFresh());
  });

  it('배지는 받은 것만 오니 모두 받은 칸(on)으로 · 그림 주소 그대로', () => {
    expect(toMemberProfileView(SERVER).badges).toEqual([
      { code: 'first-hangout', ic: 'heart', imageUrl: 'https://cdn.example/badge-images/a.png', name: '첫 번개', desc: '번개 첫 참여', on: true },
    ]);
  });

  it('가짜 서버는 이름으로 예시 프로필을 줘요 (캐릭터 · 배지 포함)', async () => {
    const d = await fetchMemberProfile('지우');
    expect(d.displayName).toBe('지우');
    expect(d.avatar).not.toBeNull();
    expect(toMemberProfileView(d).av).toEqual(fromLook(d.avatar!));
    expect(d.badges.length).toBeGreaterThan(0);
  });
});
