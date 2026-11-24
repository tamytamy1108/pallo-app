/**
 * 번개 · 동아리 · 이벤트에서 내가 한 일 (가짜 상태 · 기기에 남아요). 백엔드가 생기면 서버 데이터로 바꿔요.
 * 프로토타입 LG.joined · LG.club · LG.saved · LG.vac · LG.mhi · LG.greet · LG.att · LG.shi · LG.ans · LG.props · LG.chat 과 같아요.
 * 맞는 API: 60 `/meetups/:id/join` · `/waitlist` · 65 `/clubs/:id/members` · 69 `/club-sessions/:sid/attend` · 70 한마디 · 인사
 *   · 88 `/events/:id/applications` · 92 `/event-proposals` · 찜 `/events/:id/save`
 */
import type { MadeCard } from '@/data/poster-walls';
import { createStore } from '@/lib/store';
import type { Club, Meet } from '@/data/meet';

/** 설문 답: 질문 번호 → 고른 보기 번호(하나) · 번호들(여럿) · 글(짧은 답) */
export type SurveyAnswers = Record<number, number | number[] | string>;

export type Proposal = { id: string; title: string; br: string; date: string; cat: string; cover?: string; /** 만든 카드 (있으면 대표) */ card?: MadeCard };

export type ChatMsg = { day?: string; sys?: string; n?: string; host?: boolean; x?: string; t?: string; me?: boolean };

export type BoardPost = { id: string; k: 'note' | 'rev' | 'hi'; w: string; pin?: boolean; mine?: boolean; ti: string; bd: string; t: string; lk: number; cm: [string, string][] };

type State = {
  joined: Record<string, boolean>;
  club: Record<string, 'in' | 'ask'>;
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
};

const MEET0: State = {
  joined: {},
  club: {},
  saved: {},
  vac: {},
  mhi: {},
  greet: {},
  att: {},
  shi: {},
  ans: {},
  props: [],
  board: {},
  bliked: {},
  chat: {},
  myMeets: [],
  myClubs: [],
};
const store = createStore<State>(MEET0, { persist: { key: 'meets' } });

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

export const setClubState = (id: string, v: 'in' | 'ask' | null) =>
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

export const addMyMeet = (m: Meet) => store.set((s) => ({ ...s, myMeets: [m, ...s.myMeets] }));
export const updateMyMeet = (id: string, patch: Partial<Meet>) => store.set((s) => ({ ...s, myMeets: s.myMeets.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
export const addMyClub = (c: Club) => store.set((s) => ({ ...s, myClubs: [c, ...s.myClubs] }));
