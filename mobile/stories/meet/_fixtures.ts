/**
 * 번개 · 동아리 스토리 공용 재료.
 * - 예시 번개(MEETS)는 날짜가 2026년 11월 초중순으로 박혀 있어 오늘 기준으로 이미 다 '지남'이다.
 *   다가오는 번개는 `upcomingMeet()` 로 오늘부터 n일 뒤 날짜를 만들어 쓴다 (daysUntil 이 2026년 고정이라 해가 바뀌면 다시 지남).
 * - 번개 · 동아리 가게(meet-store)는 기기에 남아서 스토리마다 `meetState(...)` 로 처음 상태부터 다시 채운다.
 *   clearSavedData 가 나(state/me)도 처음 값으로 돌리므로 툴바 회원 유형을 다시 덮는다.
 */
import { CLUBS, MONTHS, WEEK, type Club, type Meet } from '@/data/meet';
import { membersOf, type Member, type Session } from '@/components/meet/model';
import { clearSavedData } from '@/lib/store';
import { getMe, updateMe } from '@/state/me';

import { personaOf, USER_KIND_PATCH } from '../../.storybook/user-kinds';

/** 스토리 beforeEach — 가게를 비우고 회원 유형을 다시 넣은 뒤 fill 로 필요한 상태를 채운다. */
export const meetState =
  (fill?: () => void) =>
  ({ globals }: { globals: Record<string, unknown> }) => {
    clearSavedData();
    updateMe(USER_KIND_PATCH[personaOf(globals)]);
    fill?.();
  };

/** 오늘부터 n일 뒤 (번개 mon · day · 요일 글자) */
export function ahead(n: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return { mon: MONTHS[d.getMonth()], day: String(d.getDate()).padStart(2, '0'), w: WEEK[d.getDay()] };
}

/** 오늘부터 n일 뒤 다가오는 번개 하나 (기본: 8명 중 5명) */
export function upcomingMeet(id: string, n = 3, over: Partial<Meet> = {}): Meet {
  const { mon, day, w } = ahead(n);
  return { id, br: '영등포', reg: '서울', mon, day, wd: `${w} 20:00`, title: '퇴근 후 영어 맥주 번개', place: '영등포 근처 수제맥주집', host: '하나 리더', cur: 5, max: 8, ...over };
}

/** 올린 포스터 사진 대신 쓰는 그림 (네트워크 없이 그려지게 data URI) */
export const PHOTO = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect width="400" height="500" fill="#8FA6DC"/><circle cx="300" cy="120" r="80" fill="#FFE200" stroke="#1E1A2B" stroke-width="6"/><rect x="0" y="330" width="400" height="170" fill="#493087"/></svg>',
)}`;
export const PHOTO2 = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect width="400" height="500" fill="#D0798E"/><circle cx="120" cy="300" r="110" fill="#FBF6EA" stroke="#1E1A2B" stroke-width="6"/></svg>',
)}`;

/** 동아리 — 가입 조건 '누구나' (cl5 영화 대사 따라 하기) · 'Lv.2 이상' (cl1 원서 북클럽) */
export const CLUB_FREE = CLUBS.find((c) => c.id === 'cl5') as Club;
export const CLUB_COND = CLUBS.find((c) => c.id === 'cl1') as Club;

/** 내가 만든 동아리 (승인 대기 여부 선택) */
export function myClub(id: string, wait = false): Club {
  const me = getMe();
  return { id, cc: 'study', reg: '서울', name: '퇴근 후 영어 수다', lang: '영어', br: me.branch, when: '매주 수 20:00', n: 1, max: 12, cond: '누구나', host: me.name, days: [3], mine: true, wait };
}

export const ME_ARG = { name: '태미', branch: '영등포' };

/** 동아리 멤버 목록 (호스트 · 서브 호스트 · 예시 멤버, inMe 면 맨 앞에 나) */
export function clubMembers(c: Club, n: number, inMe = false, hi = '', staff: string[] = []): Member[] {
  return membersOf(c, n, inMe, hi, ME_ARG, staff, true);
}

/** 정기 모임 한 회차 (기본: 3일 뒤 · 8명 중 4명 · 내가 안 감) */
export function session(over: Partial<Session> = {}): Session {
  const { mon, day, w } = ahead(over.k ?? 3);
  return { id: 'cl5@s', k: 3, label: `${MONTHS.indexOf(mon) + 1}.${Number(day)}(${w}) 20:00`, cap: 8, cur: 4, me: false, day: Number(day), mon: MONTHS.indexOf(mon) + 1, no: 21, wd: w, tm: '20:00', th: '오늘의 장면: 첫 만남 인사', ...over };
}
