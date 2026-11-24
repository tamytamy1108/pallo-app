/**
 * 지점 연동 결과가 도착했을 때 — docs/pages/09-onboarding.md '3. 지점 연동 요청' 상태 표.
 * 실제로는 지점 매니저가 관리자 웹에서 [연동하기] · [못 찾음으로 보내기]를 누르면 서버가 푸시를 보내요.
 * 앱에는 관리자 웹이 없어서, 개발용 '지점 처리 흉내'(components/home/link-admin-dev)가 simulateBranchResult 로 불러요.
 *
 * 도착하면: 나(state/me) 연동 상태 바꾸기 → 알림함 맨 위 알림 → 위에서 내려오는 푸시 배너
 * → 홈 출석 카드가 풀리는 순간 · 마이 '연동됨' 표시가 톡 튀어나오는 순간을 한 번씩 보여 줘요.
 */
import { addNoti } from '@/components/home/noti-state';
import { createStore } from '@/lib/store';
import { getMe, updateMe } from '@/state/me';

export type LinkResult = 'linked' | 'rejected';

/** 지점이 '못 찾음'으로 보낼 때 고르는 이유 (관리자 웹 · 회원에게 그대로 보여요) */
export const REJECT_NOTE_MOCK = '등록된 번호가 달라요. 등록할 때 쓴 번호로 다시 요청해 주세요.';
/** 지점 전화 (가짜 — 지점 정보 API 가 생기면 거기서) */
export const BRANCH_TEL_MOCK = '031-790-1234';

/** 서버에서 온 것처럼 조금 늦게 도착해요 (기다리는 동안 '지점에서 처리 중…'을 볼 수 있게 넉넉히) */
const SERVER_DELAY = 2500;

type LinkEvents = {
  /** 관리자 처리를 흉내 내는 중 (도착 전) */
  processing: boolean;
  /** 위에서 내려오는 푸시 배너 (key 가 바뀌면 다시 내려와요) */
  push: { key: number; result: LinkResult; branch: string } | null;
  /** 홈 잠긴 카드가 풀리는 순간을 아직 안 봤어요 */
  homeMoment: boolean;
  /** 마이 '연동됨' 표시가 튀어나오는 순간을 아직 안 봤어요 */
  myMoment: boolean;
  /** 지점이 남긴 말 (못 찾음) */
  note: string;
};

const store = createStore<LinkEvents>({ processing: false, push: null, homeMoment: false, myMoment: false, note: REJECT_NOTE_MOCK });

export const useLinkEvents = store.useStore;
export const getLinkEvents = store.get;

let seq = 0;

/** 지점 처리 결과 받기 (실제 앱: 푸시 · 알림 API 가 부르는 자리) */
export function receiveLinkResult(result: LinkResult, note = REJECT_NOTE_MOCK) {
  const { branch } = getMe();
  const key = ++seq;
  if (result === 'linked') {
    updateMe({ link: 'linked', role: 'member' });
    addNoti({ id: `link-${key}`, kind: 'notice', badge: 'ok', text: `${branch} 연동이 끝났어요. 이제 회원 기능을 쓸 수 있어요`, time: '방금', href: '/my', read: false });
  } else {
    // 못 찾음: 권한은 비회원과 같아요 (state/access)
    updateMe({ link: 'rejected', role: 'guest' });
    addNoti({ id: `link-${key}`, kind: 'notice', badge: 'fail', text: `${branch}에서 회원 정보를 찾지 못했어요`, time: '방금', href: '/link-rejected', read: false });
  }
  store.set((s) => ({
    ...s,
    processing: false,
    note,
    push: { key, result, branch },
    homeMoment: result === 'linked',
    myMoment: result === 'linked',
  }));
}

/** 개발용: 지점 매니저가 처리한 것처럼 2.5초 뒤 결과가 도착해요. 이미 처리 중이면 무시 */
export function simulateBranchResult(result: LinkResult) {
  if (store.get().processing) return;
  store.set((s) => ({ ...s, processing: true }));
  setTimeout(() => receiveLinkResult(result), SERVER_DELAY);
}

export const dismissLinkPush = () => store.set((s) => (s.push ? { ...s, push: null } : s));
export const finishHomeMoment = () => store.set((s) => (s.homeMoment ? { ...s, homeMoment: false } : s));
export const finishMyMoment = () => store.set((s) => (s.myMoment ? { ...s, myMoment: false } : s));

/**
 * 못 찾음 → 고쳐서 다시 요청: 연동 요청 화면(onboarding/link)으로 가기 전에 '확인 중'으로 되돌려요.
 * TODO: 연동 요청 화면이 보내기 성공 때 직접 'pending' 으로 바꾸게 되면 이 줄은 빼요 (지금은 그 화면을 다른 사람이 고치는 중)
 */
export function restartLinkRequest() {
  updateMe({ link: 'pending', role: 'guest' });
}
