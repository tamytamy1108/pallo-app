/**
 * 오늘 지점 현황 가짜 데이터 (지점 관리자 홈 · docs/pages/10-roles.md 4장).
 * 맞는 API: GET /manager/branch/today (docs/api/openapi.yaml BranchToday) — 아직 서버에 없어요.
 * 시각은 data/home 의 SLOTS(11:00 · 19:30 · 21:00)를 써요. 인원은 지금 시각에 맞춰 늘어나는 예시예요.
 */
import { SLOTS, type MyTeamToday } from './home';

/** 그 세션을 누가 프로로 출석했는지: 맡은 프로 · 스텝이 '프로로 참여'로 대신 */
export type ProCheckedInBy = 'PRO' | 'STAFF';

export type BranchTable = {
  tableId: number;
  tableNo: number;
  /** 없으면 앱이 'n번'으로 보여요 */
  tableName: string | null;
  /** 이 테이블 QR 로 출석한 멤버 수 (프로로 참여는 빼요) */
  checkedIn: number;
  /** 프로(또는 프로 대신 스텝)가 이 테이블에서 찍었는지 */
  proCheckedIn: boolean;
};

export type BranchSession = {
  sessionId: string;
  /** 오늘 시작 시각 (ISO) */
  startsAt: string;
  /** 전산 팀 이름 그대로 (예: '1-1 영어') — 앱은 바꾸지 않고 보여요 */
  teamName: string;
  /** 'en' · 'ja' · 'zh' · 'es' */
  lang: string;
  level: string;
  room: string | null;
  /** 원래 맡은 프로 */
  proName: string | null;
  proCheckedInAt: string | null;
  proCheckedInBy: ProCheckedInBy | null;
  /** 실제로 프로 출석한 사람 (STAFF 면 스텝 이름) */
  proCheckedInName: string | null;
  /** 오늘 온 멤버 수 (테이블 합) */
  checkedIn: number;
  tables: BranchTable[];
};

export type BranchToday = {
  branch: { code: string; name: string };
  /** 'YYYY-MM-DD' */
  date: string;
  sessions: BranchSession[];
};

/** 가짜 시간표 한 줄: slot = SLOTS 순서, lang = LANGS 순서, full = 테이블마다 결국 올 멤버 수, proLate = 맡은 프로가 안 와요 */
export type MockBranchSession = {
  id: string;
  slot: number;
  lang: number;
  team: string;
  level: string;
  pro: string;
  tables: { no: number; full: number }[];
  proLate?: boolean;
  /** 예시: 맡은 프로가 못 와서 스텝이 '프로로 참여'로 대신 출석 (시작 20분 전에 찍어요) */
  staffCover?: string;
};

/** 하남점 하루 시간표 (일요일은 쉬어요) */
export const MOCK_BRANCH_SESSIONS: MockBranchSession[] = [
  { id: 'b-1100-en', slot: 0, lang: 0, team: '1-1 영어', level: 'Lv.2', pro: 'Logan', tables: [{ no: 1, full: 4 }, { no: 2, full: 4 }] },
  { id: 'b-1930-en', slot: 1, lang: 0, team: '3-2 영어', level: 'Lv.3', pro: 'Lily', tables: [{ no: 7, full: 5 }, { no: 8, full: 3 }, { no: 9, full: 2 }] },
  { id: 'b-1930-ja', slot: 1, lang: 1, team: '1-1 일본어', level: 'Lv.1', pro: 'Sora', tables: [{ no: 3, full: 5 }, { no: 4, full: 0 }], proLate: true },
  { id: 'b-1930-es', slot: 1, lang: 3, team: '1-1 스페인어', level: 'Lv.1', pro: 'Mateo', tables: [{ no: 6, full: 3 }], proLate: true, staffCover: '민지' },
  { id: 'b-2100-en', slot: 2, lang: 0, team: '4-1 영어', level: 'Lv.4', pro: 'Aiden', tables: [{ no: 10, full: 4 }, { no: 11, full: 3 }] },
  { id: 'b-2100-zh', slot: 2, lang: 2, team: '1-1 중국어', level: 'Lv.1', pro: 'Wei', tables: [{ no: 12, full: 3 }] },
];

/** 쉬는 요일 (0 = 일) */
export const BRANCH_CLOSED_DOW = [0];

/**
 * 지점 관리자 홈 출석 카드: 등록된 팀이 없어서 '지점의 오늘 세션'을 내 팀처럼 써요 (다음 세션 시각 · 고르기 시트).
 * label = 전산 팀 이름 ('1-1 영어') → teamName '1-1 영어 7시 30분'
 */
export function branchTeamsOn(dow: number, branch: string): MyTeamToday[] {
  if (BRANCH_CLOSED_DOW.includes(dow)) return [];
  return MOCK_BRANCH_SESSIONS.map((s) => ({ no: s.id, branch, lang: s.lang, when: `오늘 ${SLOTS[s.slot].t}`, slot: s.slot, label: s.team }));
}

/** 그 시각 · 언어의 지점 세션 (QR 을 찍은 세션 · '프로로 참여'에 보낼 id) */
export const branchSessionAt = (slot: number, lang: number) => MOCK_BRANCH_SESSIONS.find((s) => s.slot === slot && s.lang === lang) ?? null;
