/**
 * 지점 연동 결과가 도착했을 때 — docs/pages/09-onboarding.md '3. 지점 연동 요청' 상태 표.
 * 실제로는 지점 매니저가 관리자 웹에서 [연동하기] · [못 찾음으로 보내기]를 누르면 서버가 푸시를 보내요.
 * 앱에는 관리자 웹이 없어서, 개발용 '지점 처리 흉내'(components/home/link-admin-dev)가 simulateBranchResult 로 불러요.
 *
 * 도착하면: /me(회원 등급) · 서버 요약(연동 대기 · 반려) 다시 받기 → 알림함 맨 위 알림 → 위에서 내려오는 푸시 배너
 * → 홈 출석 카드가 풀리는 순간 · 마이 '연동됨' 표시가 톡 튀어나오는 순간을 한 번씩 보여 줘요.
 */
import { mockApproveLinkRequest, mockRejectLinkRequest } from '@/api/branch-link';
import { apiConfig } from '@/api/config';
import { queryKeys } from '@/api/queries';
import { getBranchProgress } from '@/api/use-branch-progress';
import { queryClient } from '@/api/query-client';
import { showLinkPush } from '@/components/home/link-push';
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
  /** 홈 잠긴 카드가 풀리는 순간을 아직 안 봤어요 */
  homeMoment: boolean;
  /** 마이 '연동됨' 표시가 튀어나오는 순간을 아직 안 봤어요 */
  myMoment: boolean;
  /** 지점이 남긴 말 (못 찾음) */
  note: string;
};

const store = createStore<LinkEvents>({ processing: false, homeMoment: false, myMoment: false, note: REJECT_NOTE_MOCK });

export const useLinkEvents = store.useStore;
export const getLinkEvents = store.get;

let seq = 0;

/** 지점 처리 결과 받기 (실제 앱: 푸시 · 알림 API 가 부르는 자리) */
export function receiveLinkResult(result: LinkResult, note = REJECT_NOTE_MOCK) {
  // 처리된 지점: 대기 중인 요청의 지점 (요약을 아직 안 받았으면 내 지점)
  const branch = getBranchProgress().pending?.branchName ?? getMe().branch;
  const key = ++seq;
  if (result === 'linked') {
    // 가짜 서버: 승인 한 건 + 지점 회원이 돼요 (실서버는 지점이 처리하면 /me · 요약이 이미 바뀌어 있어요)
    if (apiConfig.useMock) {
      mockApproveLinkRequest(branch);
      updateMe({ memberAccessLevel: 'ACTIVE_MEMBER', role: 'member' });
    }
    addNoti({ id: `link-${key}`, kind: 'notice', badge: 'ok', text: `${branch} 연동이 끝났어요. 이제 회원 기능을 쓸 수 있어요`, time: '방금', href: '/my', read: false });
  } else {
    // 못 찾음: 권한은 비회원 그대로 (state/access). 가짜 서버의 내 연동 요청에 반려 한 건 → 홈 반려 팝업 (components/home/link-rejected-popup)
    if (apiConfig.useMock) mockRejectLinkRequest(branch, note);
    // 다른 공지처럼 한 줄 글로: 반려 사유를 글 안에 그대로 (누르면 연동 안 됨 화면 · 다시 요청)
    addNoti({ id: `link-${key}`, kind: 'notice', icon: 'tack', text: `${branch} 연동이 반려됐어요. 사유: ${note}`, time: '방금', href: '/link-rejected', read: false });
  }
  // ['me'] 아래 전부: /me(회원 등급) · 요약(연동 대기 · 반려) · 내 연동 요청
  void queryClient.invalidateQueries({ queryKey: queryKeys.me });
  store.set((s) => ({
    ...s,
    processing: false,
    note,
    homeMoment: result === 'linked',
    myMoment: result === 'linked',
  }));
  showLinkPush(result, branch, `link-${key}`, note);
}

/** 개발용: 지점 매니저가 처리한 것처럼 2.5초 뒤 결과가 도착해요. 이미 처리 중이면 무시 */
export function simulateBranchResult(result: LinkResult) {
  if (store.get().processing) return;
  store.set((s) => ({ ...s, processing: true }));
  setTimeout(() => receiveLinkResult(result), SERVER_DELAY);
}

export const finishHomeMoment = () => store.set((s) => (s.homeMoment ? { ...s, homeMoment: false } : s));
export const finishMyMoment = () => store.set((s) => (s.myMoment ? { ...s, myMoment: false } : s));

