/**
 * 마이 B 화면들이 같이 쓰는 작은 상태 (가짜 데이터용 · 백엔드가 생기면 서버 값으로 바꿔요).
 * - 변경 신청: 내 스터디 카드 · 신청서가 같이 봐요 (프로토타입 CHG · `pallo-chg`) — API 39 `/me/change-requests`
 * - PRO'S NOTE: 읽음 · 고마워요 · 보낸 인사 · 스터디 일기 (프로토타입 PNR · PNT · PNM · PND) — API 44 · 45
 * - 설정 · 로그인 연결 · 레벨 변경 요청 (프로토타입 SET · LOGINS · LVREQ) — API 30 · 46 (1:1 문의는 서버: api/support)
 * 모두 기기에 남아요 (프로토타입 `pallo-chg` · `pallo-pn` · `pallo-set` 과 같은 일).
 */
import { LOGINS_DEFAULT, SETTINGS_DEFAULT, type Diary, type Settings } from '@/data/account';
import { createStore } from '@/lib/store';

// ---------- 연기 · 팀 · 지점 변경 신청 ----------

/**
 * 신청은 바로 바뀌지 않아요: 운영진 전산으로 넘어가 확인(승인 · 반려)을 기다려요.
 * status: 대기(pending) → 승인(approved) · 반려(rejected) — 앱은 대기로만 넣고, 바꾸는 건 운영진 전산이에요.
 * reason: 1달 넘게 쉬기처럼 사유가 꼭 필요한 신청의 사유
 */
export type ChangeRequestStatus = 'pending' | 'approved' | 'rejected';
export type ChangeRequest = { label: string; txt: string; msg: string; at: number; status: ChangeRequestStatus; reason?: string };
const changeStore = createStore<ChangeRequest | null>(null, {
  persist: {
    key: 'change-request',
    // 예전에 남긴 신청(상태 없음)은 대기로 읽어요
    load: (v, initial) => (isObj(v) && typeof v.label === 'string' ? ({ status: 'pending', ...v } as ChangeRequest) : initial),
  },
});
export const useChangeRequest = () => changeStore.useStore();
/** 가짜 서버가 신청을 받아 대기로 넣어요 (화면은 api/change-requests 의 requestChange 로 불러요) */
export const submitChangeRequest = (r: Omit<ChangeRequest, 'at' | 'status'>): ChangeRequest => {
  const saved: ChangeRequest = { ...r, at: Date.now(), status: 'pending' };
  changeStore.set(saved);
  return saved;
};
/** 서버가 돌려준 신청을 그대로 남겨요 (내 스터디 카드가 '운영진 확인 중'으로 보여요) */
export const putChangeRequest = (r: ChangeRequest) => changeStore.set(r);
export const cancelChangeRequest = () => changeStore.set(null);

// ---------- PRO'S NOTE ----------

export type NoteMessage = { kind: '감사 인사' | '질문'; text: string };
type NoteState = {
  read: Record<string, boolean>;
  thanks: Record<string, boolean>;
  msgs: Record<string, NoteMessage[]>;
  diary: Record<string, Diary>;
};
const noteStore = createStore<NoteState>({ read: {}, thanks: {}, msgs: {}, diary: {} }, { persist: { key: 'pro-notes' } });
export const useNoteState = () => noteStore.useStore();
export const markNoteRead = (id: string) => noteStore.set((s) => (s.read[id] ? s : { ...s, read: { ...s.read, [id]: true } }));
export const toggleNoteThanks = (id: string) => {
  const on = !noteStore.get().thanks[id];
  noteStore.set((s) => ({ ...s, thanks: { ...s.thanks, [id]: on } }));
  return on;
};
export const sendNoteMessage = (id: string, m: NoteMessage) => noteStore.set((s) => ({ ...s, msgs: { ...s.msgs, [id]: [...(s.msgs[id] ?? []), m] } }));
export const saveDiary = (id: string, d: Diary) => noteStore.set((s) => ({ ...s, diary: { ...s.diary, [id]: d } }));

// ---------- 설정 ----------

const settingsStore = createStore<Settings>({ ...SETTINGS_DEFAULT }, { persist: { key: 'settings' } });
export const useSettings = () => settingsStore.useStore();
export const getSettings = settingsStore.get;
export const updateSettings = (patch: Partial<Settings>) => settingsStore.set((s) => ({ ...s, ...patch }));
/** 마케팅 정보 수신 (광고성 정보 · 약관 '마케팅 정보 수신 동의'): 켜면 동의 날짜를 기록해요 */
export const setMarketing = (on: boolean) => {
  const t = new Date();
  settingsStore.set((s) => ({ ...s, nMkt: on, mktAt: on ? `${t.getFullYear()}.${t.getMonth() + 1}.${t.getDate()}` : '' }));
};

const loginStore = createStore<Record<string, boolean>>({ ...LOGINS_DEFAULT }, { persist: { key: 'logins' } });
export const useLogins = () => loginStore.useStore();
/** 연결 ↔ 해제. 마지막 하나는 해제 못 해요 → false */
export function toggleLogin(name: string) {
  const L = loginStore.get();
  const on = Object.values(L).filter(Boolean).length;
  if (L[name] && on === 1) return false;
  loginStore.set({ ...L, [name]: !L[name] });
  return true;
}

/** 레벨 변경 요청 (예: '한 단계 위로 · 수업이 쉬워요') */
const levelReqStore = createStore<string | null>(null, { persist: { key: 'level-request', load: (v, initial) => (typeof v === 'string' ? v : initial) } });
export const useLevelRequest = () => levelReqStore.useStore();
export const requestLevelChange = (v: string) => levelReqStore.set(v);

/** 공지 읽음 (프로토타입 NREAD — 안 읽은 공지는 제목 옆 분홍 점) */
const noticeReadStore = createStore<Record<string, boolean>>({}, { persist: { key: 'notice-read' } });
export const useNoticeRead = () => noticeReadStore.useStore();
export const markNoticeRead = (id: string) => noticeReadStore.set((s) => ({ ...s, [id]: true }));

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}
