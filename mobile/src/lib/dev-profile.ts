/**
 * 개발용 '사람 바꾸기' (폰 · 웹, 개발 서버에서만): 비회원 · 체험 · 연동 대기 · 회원 · 프로 · 지점 관리자 … 로 앱을 열어 봐요.
 * - 마이 위 '개발 · 사람' 단추(components/my/dev-persona)에서 고르면 앱을 다시 열어요 (고른 사람은 이 기기에 남아요)
 * - 웹은 주소에 `?who=pro` 를 붙이면 그 탭만 그 사람이에요 (탭 여러 개를 나란히 띄워 비교할 때)
 * - 개발 서버를 `EXPO_PUBLIC_DEV_PROFILE=linked npx expo start` 로 켜면, 아직 고른 적이 없을 때 '연동된 회원'으로 시작해요
 * - 사람마다 저장은 따로 (폰: 문서 폴더 `pallo@<사람>/` · 웹: localStorage `pallo@<사람>-<키>`) → 기록이 서로 섞이지 않아요
 * - 가입을 건너뛰고 홈부터 · 앱을 열 때마다 그 사람으로 돌려놔요 (state/me). 가짜 서버일 때만: 가짜 토큰으로 로그인한 채(api/token) · /me 가 가입을 끝낸 것으로(api/me)
 * - 호스트 · 코호스트는 계정이 아니라 모임 안 역할이라 따로 골라요 (devClubRole: 동아리 · 번개 화면이 이 값으로 열려요)
 * '보통'(가입부터)은 개발용 사람 없이 첫 화면부터예요. 실제 앱(__DEV__ 아님)에서는 늘 '' 예요.
 */
import { File, Paths } from 'expo-file-system';
import { DevSettings, Platform } from 'react-native';

export type DevPersona = 'guest' | 'trial' | 'pending' | 'rejected' | 'app' | 'linked' | 'pro' | 'manager';
/** 모임(동아리 · 번개) 안에서 나: 화면 그대로(내가 연 모임만 호스트) · 늘 멤버처럼 · 늘 호스트 · 늘 코호스트 */
export type DevClubRole = 'auto' | 'member' | 'host' | 'co';

/** 고르는 순서 = 화면에 보이는 순서. desc 는 그 사람의 role · link · trial · plan (state/me) */
export const DEV_PERSONAS: {
  k: DevPersona;
  label: string;
  desc: string;
  group: '멤버' | '프로 · 직원';
}[] = [
  {
    k: 'guest',
    label: '비회원',
    desc: '가입만 했어요 · 둘러보는 중',
    group: '멤버',
  },
  {
    k: 'trial',
    label: '체험 예약',
    desc: '체험 상담을 예약했어요',
    group: '멤버',
  },
  {
    k: 'pending',
    label: '연동 확인 중',
    desc: '지점에 연동을 요청했어요',
    group: '멤버',
  },
  {
    k: 'rejected',
    label: '연동 안 됨',
    desc: '지점이 못 찾았어요',
    group: '멤버',
  },
  // '앱 구독'(지점 없이 앱만 결제)은 고르기 목록에서 뺐어요 (2026-11-25)
  {
    k: 'linked',
    label: '회원',
    desc: '지점에 연동된 스터디 회원',
    group: '멤버',
  },
  {
    k: 'pro',
    label: '프로',
    desc: '세션을 맡는 강사 (role leader)',
    group: '프로 · 직원',
  },
  {
    k: 'manager',
    label: '지점 관리자',
    desc: '지점 하나를 맡은 직원 (role manager)',
    group: '프로 · 직원',
  },
];

export const DEV_CLUB_ROLES: { k: DevClubRole; label: string }[] = [
  { k: 'auto', label: '그대로' },
  { k: 'member', label: '멤버' },
  { k: 'host', label: '호스트' },
  { k: 'co', label: '코호스트' },
];

type Saved = { who: DevPersona | 'none'; club: DevClubRole };

const KEY = 'pallo-dev-profile';
const TAB_KEY = 'pallo-dev-who';
const web = Platform.OS === 'web';
const on = __DEV__ && process.env.NODE_ENV !== 'test';
const isPersona = (v: unknown): v is DevPersona => DEV_PERSONAS.some((p) => p.k === v);
const isClubRole = (v: unknown): v is DevClubRole => DEV_CLUB_ROLES.some((r) => r.k === v);

// 사람마다 따로 저장하는 폴더 · 키와 섞이지 않게, 고른 값은 그 밖 한 곳에 (pallo-dev-profile)
function savedFile() {
  return new File(Paths.document, `${KEY}.json`);
}

function readSaved(): Partial<Saved> {
  if (!on) return {};
  try {
    const text = web ? globalThis.localStorage?.getItem(KEY) : savedFile().exists ? savedFile().textSync() : null;
    return text ? (JSON.parse(text) as Partial<Saved>) : {};
  } catch {
    return {};
  }
}

function writeSaved(s: Saved) {
  const text = JSON.stringify(s);
  if (web) {
    globalThis.localStorage?.setItem(KEY, text);
    return;
  }
  const f = savedFile();
  if (!f.exists) f.create({ intermediates: true, overwrite: true });
  f.writeSync(text);
}

/** 웹 탭 하나만: 주소 ?who= 를 이 탭에 기억해요 (화면을 옮겨 주소가 바뀌어도 그대로) */
function tabWho(): DevPersona | 'none' | null {
  if (!on || !web || typeof window === 'undefined') return null;
  try {
    const q = new URLSearchParams(window.location.search).get('who');
    if (q === 'none' || isPersona(q)) window.sessionStorage.setItem(TAB_KEY, q);
    const v = window.sessionStorage.getItem(TAB_KEY);
    return v === 'none' || isPersona(v) ? v : null;
  } catch {
    return null;
  }
}

function pick(): Saved {
  const saved = readSaved();
  const env = process.env.EXPO_PUBLIC_DEV_PROFILE;
  const who = tabWho() ?? (saved.who === 'none' || isPersona(saved.who) ? saved.who : isPersona(env) ? env : 'none');
  return { who, club: isClubRole(saved.club) ? saved.club : 'auto' };
}

const now: Saved = on ? pick() : { who: 'none', club: 'auto' };

/** 지금 개발용 사람 ('' = 보통 · 실제 앱) */
export const devProfile: '' | DevPersona = now.who === 'none' ? '' : now.who;
/** 모임 안에서 나 (auto = 화면 그대로) */
export const devClubRole: DevClubRole = now.club;

/** 사람(또는 모임 역할)을 바꾸고 앱을 다시 열어요 */
export function switchDevProfile(next: { who?: DevPersona | 'none'; club?: DevClubRole }) {
  if (!__DEV__) return;
  const s: Saved = { who: next.who ?? now.who, club: next.club ?? now.club };
  try {
    writeSaved(s);
  } catch {
    return;
  }
  if (web && typeof window !== 'undefined') {
    // 이 탭에 ?who= 로 고른 사람이 있으면 지우고 (방금 고른 사람으로), 주소에서도 빼요
    try {
      window.sessionStorage.removeItem(TAB_KEY);
    } catch {}
    const url = new URL(window.location.href);
    url.searchParams.delete('who');
    window.location.replace(url.toString());
    return;
  }
  DevSettings.reload();
}
