/**
 * 번개 · 동아리 · 이벤트에서 내가 한 일 (가짜 상태 · 기기에 남아요). 백엔드가 생기면 서버 데이터로 바꿔요.
 * 프로토타입 LG.joined · LG.club · LG.saved · LG.vac · LG.mhi · LG.greet · LG.att · LG.shi · LG.ans · LG.props · LG.chat 과 같아요.
 * 맞는 API: 60 `/meetups/:id/join` · `/waitlist` · 65 `/clubs/:id/members` · 69 `/club-sessions/:sid/attend` · 70 한마디 · 인사
 *   · 88 `/events/:id/applications` · 92 `/event-proposals` · 찜 `/events/:id/save`
 */
import type { MadeCard } from '@/data/poster-colors';
import { apiConfig } from '@/api/config';
import { createStore } from '@/lib/store';
import type { Club, Meet } from '@/data/meet';

/** 설문 답: 질문 번호 → 고른 보기 번호(하나) · 번호들(여럿) · 글(짧은 답) */
export type SurveyAnswers = Record<number, number | number[] | string>;

export type Proposal = { id: string; title: string; br: string; date: string; cat: string; cover?: string; /** 만든 카드 (있으면 대표) */ card?: MadeCard; /** 예상 인원 (0 = 무관) */ cap?: number; /** 희망 시간 [시작, 끝] ('19:00', '21:00') */ time?: [string, string]; body?: string; /** 1인 참가비 (원 · 0 = 무료) */ fee?: number; /** 서버 처리 상태 (없으면 검토 중) */ status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED'; /** 반려 사유 */ rejectionReason?: string | null; /** 보낸 시각 (ISO) */ sentAt?: string };

export type ChatMsg = { day?: string; sys?: string; n?: string; host?: boolean; x?: string; t?: string; me?: boolean };

export type BoardPost = { id: string; k: 'note' | 'rev' | 'hi'; w: string; pin?: boolean; mine?: boolean; ti: string; bd: string; t: string; lk: number; cm: [string, string][] };

type State = {
  joined: Record<string, boolean>;
  /** 가입한 동아리 (신청하면 바로 가입돼요 · 승인 단계 없음) */
  club: Record<string, 'in'>;
  /** 호스트가 정한 코호스트 이름들 (clubId → 이름). 없으면 예시 코호스트(model clubStaff) */
  cohost: Record<string, string[]>;
  saved: Record<string, boolean>;
  vac: Record<string, boolean>;
  /** 번개 · 이벤트 인사 (함께하는 멤버 내 줄) */
  mhi: Record<string, string>;
  /** 동아리 가입 인사 */
  greet: Record<string, string>;
  /** 정기 모임 참석 (clubId@월-일) */
  att: Record<string, boolean>;
  /** 정기 모임 한마디 */
  shi: Record<string, string>;
  ans: Record<string, SurveyAnswers>;
  props: Proposal[];
  board: Record<string, BoardPost[]>;
  bliked: Record<string, boolean>;
  chat: Record<string, ChatMsg[]>;
  /** 내가 연 번개 · 만든 동아리 */
  myMeets: Meet[];
  myClubs: Club[];
  /** 호스트 · 코호스트였던 기록 (동아리가 닫혀도 남아요). to 가 없으면 지금도 맡고 있어요 */
  hostLog: HostLog[];
  /** 호스트 · 코호스트가 만든 정기 모임 일정 (clubId → 일정들) */
  sched: Record<string, ClubSched[]>;
};

/** 호스트 · 코호스트가 만든 일정 하나 — date 'YYYY-MM-DD' · time 'HH:MM' · cap 0 = 인원 무관 */
export type ClubSched = { id: string; date: string; time: string; end?: string; title: string; cap: number; place?: string; memo?: string; at: number };

/** 호스트 · 코호스트 기록 한 줄 */
export type HostLog = { clubId: string; name: string; role: 'host' | 'co'; from: number; to?: number; why?: string };

/**
 * 가짜 서버로 볼 때의 예시 (마이 › 내 모임이 비어 보이지 않게): 다가오는 · 지난 번개, 가입한 동아리, 다가오는 · 지난 이벤트, 제안 하나.
 * 진짜 서버면 비어서 시작해요 (서버가 내 참여 목록을 줘요).
 */
const SAMPLE = apiConfig.useMock;
const MEET0: State = {
  joined: SAMPLE ? { m15: true, m16: true, m17: true, m1: true, m9: true, m6: true, m2: true, e4: true, e3: true, e6: true } : {},
  club: SAMPLE ? { cl1: 'in', cl2: 'in', cl10: 'in', cl4: 'in' } : {},
  cohost: {},
  saved: {},
  vac: {},
  mhi: {},
  greet: {},
  att: {},
  shi: {},
  ans: {},
  props: SAMPLE ? [{ id: 'pr-sample', title: '한강 영어 피크닉', br: '영등포', date: '2026-12-13', cat: '액티비티', time: ['14:00', '17:00'], cap: 20, card: { color: '#FFE200', words: ['PICNIC', ''] }, body: '돗자리 펴고 영어로 수다 떠는 피크닉이에요.' }] : [],
  board: {},
  bliked: {},
  chat: {},
  myMeets: [],
  myClubs: [],
  hostLog: [],
  sched: {},
};
const store = createStore<State>(MEET0, {
  persist: {
    key: 'meets',
    version: 2,
    // 예전엔 '가입 신청 중'('ask')이 있었어요 → 이제 신청하면 바로 가입이라 가입한 것으로 봐요
    load: (saved, initial) => {
      if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return initial;
      const s = { ...initial, ...(saved as Partial<State>) };
      return { ...s, club: Object.fromEntries(Object.keys(s.club ?? {}).map((k) => [k, 'in' as const])) };
    },
  },
});

export const useMeetStore = store.useStore;
export const getMeetStore = store.get;

type Rec = 'joined' | 'saved' | 'vac' | 'att' | 'bliked';
/** 켜고 끄는 값 하나 */
export const toggleIn = (key: Rec, id: string) =>
  store.set((s) => {
    const next = { ...s[key] };
    if (next[id]) delete next[id];
    else next[id] = true;
    return { ...s, [key]: next };
  });

type TextRec = 'mhi' | 'greet' | 'shi';
export const setText = (key: TextRec, id: string, v: string | null) =>
  store.set((s) => {
    const next = { ...s[key] };
    if (v == null) delete next[id];
    else next[id] = v;
    return { ...s, [key]: next };
  });

export const setClubState = (id: string, v: 'in' | null) =>
  store.set((s) => {
    const club = { ...s.club };
    let att = s.att;
    if (v == null) {
      delete club[id];
      // 동아리에서 나가면 참석하기로 한 정기 모임도 함께 취소 (프로토타입 club-leave)
      att = Object.fromEntries(Object.entries(s.att).filter(([k]) => !k.startsWith(id + '@')));
    } else club[id] = v;
    return { ...s, club, att };
  });

/** 코호스트 정하기 · 빼기 (호스트만 · 정한 순간부터 코호스트예요) */
export const setCohosts = (id: string, L: string[]) => store.set((s) => ({ ...s, cohost: { ...s.cohost, [id]: L } }));

export const setAnswers = (id: string, a: SurveyAnswers | null) =>
  store.set((s) => {
    const ans = { ...s.ans };
    if (a) ans[id] = a;
    else delete ans[id];
    return { ...s, ans };
  });

export const addProposal = (p: Proposal) => store.set((s) => ({ ...s, props: [p, ...s.props] }));
export const removeProposal = (id: string) => store.set((s) => ({ ...s, props: s.props.filter((p) => p.id !== id) }));

export const setBoard = (id: string, L: BoardPost[]) => store.set((s) => ({ ...s, board: { ...s.board, [id]: L } }));
export const setChat = (id: string, L: ChatMsg[]) => store.set((s) => ({ ...s, chat: { ...s.chat, [id]: L } }));

export const addMyMeet = (m: Meet) => store.set((s) => ({ ...s, myMeets: [{ ...m, at: m.at ?? Date.now() }, ...s.myMeets] }));
export const updateMyMeet = (id: string, patch: Partial<Meet>) => store.set((s) => ({ ...s, myMeets: s.myMeets.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
export const addMyClub = (c: Club) => store.set((s) => ({ ...s, myClubs: [{ ...c, at: c.at ?? Date.now() }, ...s.myClubs] }));

/** 내 동아리 하나 고치기 (myClubs 안) */
const patchMyClub = (s: State, id: string, patch: Partial<Club>) => s.myClubs.map((c) => (c.id === id ? { ...c, ...patch } : c));
/** 이 동아리에서 맡고 있던 호스트 · 코호스트 기록을 끝내요 */
const endLog = (L: HostLog[], id: string, why: string, at: number) => L.map((h) => (h.clubId === id && !h.to ? { ...h, to: at, why } : h));

/**
 * 관리자 결정 (동아리 만들기 신청). 승인하면 만든 사람이 호스트가 되고, 거절하면 이유와 함께 내 신청 카드에 남아요.
 * 백엔드가 생기면 관리자 웹(64 `/admin/clubs/:id/approve` · reject)이 정하고, 앱은 알림 · `/me/club-applications` 로 받아요.
 */
export const decideMyClub = (id: string, ok: boolean, reason = '') =>
  store.set((s) => {
    const c = s.myClubs.find((x) => x.id === id);
    if (!c) return s;
    const at = Date.now();
    if (!ok) return { ...s, myClubs: patchMyClub(s, id, { wait: false, rejected: { reason: reason || '운영 기준에 맞지 않아요', at } }) };
    return {
      ...s,
      myClubs: patchMyClub(s, id, { wait: false, rejected: undefined, okAt: at }),
      hostLog: [{ clubId: id, name: c.name, role: 'host' as const, from: at }, ...endLog(s.hostLog, id, '다시 승인', at)],
    };
  });

/**
 * 검토 중인 신청 고치기 (승인 전까지만). 고치면 지점 관리자에게 '신청 내용이 바뀌었어요' 알림이 가요.
 * 지금은 가짜 상태라 고친 때(editedAt)만 남겨요. 백엔드가 생기면 `PATCH /me/club-applications/:id` → 서버가 매니저 알림을 보내요.
 */
export const editMyClub = (id: string, patch: Partial<Club>) =>
  store.set((s) => {
    const c = s.myClubs.find((x) => x.id === id);
    if (!c?.wait) return s;
    return { ...s, myClubs: patchMyClub(s, id, { ...patch, id, wait: true, mine: true, at: c.at, editedAt: Date.now() }) };
  });

/** 거절된 신청을 같은 내용으로 다시 보내요 */
export const resubmitMyClub = (id: string) => store.set((s) => ({ ...s, myClubs: patchMyClub(s, id, { wait: true, rejected: undefined, at: Date.now() }) }));
/** 검토 중 · 거절된 신청 지우기 (승인된 동아리는 '닫기'로) */
export const removeMyClub = (id: string) => store.set((s) => ({ ...s, myClubs: s.myClubs.filter((c) => c.id !== id || (!c.wait && !c.rejected)) }));

/**
 * 동아리 닫기 (호스트가 관리에서 · 관리자가 경고 뒤). 닫히면 이 동아리의 호스트 · 코호스트 권한이 같이 없어지고 기록만 남아요.
 * 운영 중인 동아리가 0개가 되면 호스트(코호스트) 뱃지도 사라져요 (model useMyClubRoles).
 */
export const closeMyClub = (id: string, by: 'host' | 'admin', reason?: string) =>
  store.set((s) => {
    const at = Date.now();
    const cohost = { ...s.cohost };
    delete cohost[id];
    return {
      ...s,
      myClubs: patchMyClub(s, id, { closed: { at, by, reason } }),
      cohost,
      hostLog: endLog(s.hostLog, id, by === 'admin' ? '관리자가 닫음' : '동아리를 닫음', at),
    };
  });

/** 일정 만들기 (호스트 · 코호스트) — 멤버 모두에게 알림은 서버가 보내요 (A34) */
export const addSched = (clubId: string, q: ClubSched) =>
  store.set((s) => ({ ...s, sched: { ...s.sched, [clubId]: [...(s.sched[clubId] ?? []), q].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)) } }));
/** 만든 일정 취소 (참석하기로 한 멤버에게 알림) */
export const removeSched = (clubId: string, id: string) =>
  store.set((s) => {
    const att = Object.fromEntries(Object.entries(s.att).filter(([k]) => k !== id));
    return { ...s, att, sched: { ...s.sched, [clubId]: (s.sched[clubId] ?? []).filter((q) => q.id !== id) } };
  });
