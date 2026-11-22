/**
 * 마이 B 화면들이 같이 쓰는 작은 상태 (가짜 데이터용 · 백엔드가 생기면 서버 값으로 바꿔요).
 * - 변경 신청: 내 스터디 카드 · 신청서가 같이 봐요 (프로토타입 CHG · `pallo-chg`) — API 39 `/me/change-requests`
 * - PRO'S NOTE: 읽음 · 고마워요 · 보낸 인사 · 스터디 일기 (프로토타입 PNR · PNT · PNM · PND) — API 44 · 45
 * - 설정 · 로그인 연결 · 1:1 문의 · 레벨 변경 요청 (프로토타입 SET · LOGINS · ASKS · LVREQ) — API 30 · 46 · 94
 */
import { ASKS_DEFAULT, LOGINS_DEFAULT, SETTINGS_DEFAULT, type Ask, type Diary, type Settings } from '@/data/account';
import { createStore } from '@/lib/store';

// ---------- 연기 · 팀 · 지점 변경 신청 ----------

export type ChangeRequest = { label: string; txt: string; msg: string; at: number };
const changeStore = createStore<ChangeRequest | null>(null);
export const useChangeRequest = () => changeStore.use();
export const submitChangeRequest = (r: Omit<ChangeRequest, 'at'>) => changeStore.set({ ...r, at: Date.now() });
export const cancelChangeRequest = () => changeStore.set(null);

// ---------- PRO'S NOTE ----------

export type NoteMessage = { kind: '감사 인사' | '질문'; text: string };
type NoteState = {
  read: Record<string, boolean>;
  thanks: Record<string, boolean>;
  msgs: Record<string, NoteMessage[]>;
  diary: Record<string, Diary>;
};
const noteStore = createStore<NoteState>({ read: {}, thanks: {}, msgs: {}, diary: {} });
export const useNoteState = () => noteStore.use();
export const markNoteRead = (id: string) => noteStore.set((s) => (s.read[id] ? s : { ...s, read: { ...s.read, [id]: true } }));
export const toggleNoteThanks = (id: string) => {
  const on = !noteStore.get().thanks[id];
  noteStore.set((s) => ({ ...s, thanks: { ...s.thanks, [id]: on } }));
  return on;
};
export const sendNoteMessage = (id: string, m: NoteMessage) => noteStore.set((s) => ({ ...s, msgs: { ...s.msgs, [id]: [...(s.msgs[id] ?? []), m] } }));
export const saveDiary = (id: string, d: Diary) => noteStore.set((s) => ({ ...s, diary: { ...s.diary, [id]: d } }));

// ---------- 설정 ----------

const settingsStore = createStore<Settings>({ ...SETTINGS_DEFAULT });
export const useSettings = () => settingsStore.use();
export const updateSettings = (patch: Partial<Settings>) => settingsStore.set((s) => ({ ...s, ...patch }));

const loginStore = createStore<Record<string, boolean>>({ ...LOGINS_DEFAULT });
export const useLogins = () => loginStore.use();
/** 연결 ↔ 해제. 마지막 하나는 해제 못 해요 → false */
export function toggleLogin(name: string) {
  const L = loginStore.get();
  const on = Object.values(L).filter(Boolean).length;
  if (L[name] && on === 1) return false;
  loginStore.set({ ...L, [name]: !L[name] });
  return true;
}

const askStore = createStore<Ask[]>([...ASKS_DEFAULT]);
export const useAsks = () => askStore.use();
export const addAsk = (a: Ask) => askStore.set((L) => [a, ...L]);

/** 레벨 변경 요청 (예: '한 단계 위로 · 수업이 쉬워요') */
const levelReqStore = createStore<string | null>(null);
export const useLevelRequest = () => levelReqStore.use();
export const requestLevelChange = (v: string) => levelReqStore.set(v);
