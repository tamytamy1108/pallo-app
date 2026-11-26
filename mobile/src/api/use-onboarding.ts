/**
 * 가입 단계 · 체험 예약 · 연동 요청 훅 — 화면은 여기 훅만 불러요 (api/onboarding · trial-applications · branch-link).
 * 보내기 훅은 실패하면 토스트를 띄우고(부르는 화면마다 빠뜨리지 않게), 끝나면 바뀌는 목록을 다시 받아요.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { showToast } from '@/components/ui/toast';
import { markLinkWaited } from '@/state/link-waited';
import { getOnboarding, updateOnboarding } from '@/state/onboarding';

import { createLinkRequest } from './branch-link';
import { apiErrorMessage } from './errors';
import { branchGuideView, nearestBranches, submitOnboarding, type BranchOption, type LatLng, type OnboardingBody, type OnboardingResult } from './onboarding';
import { assetCatalogQuery, branchOptionsQuery, branchPublicGuideQuery, onboardingInfoQuery, queryKeys, trialSlotsQuery } from './queries';
import { createTrialApplication, type TrialApplicationBody } from './trial-applications';

/** GET /onboarding — 약관 · 미리 채울 값 · 닉네임 규칙 · 언어 · 이유 */
export const useOnboardingInfo = () => useQuery(onboardingInfoQuery());

/** GET /asset-catalog — 고를 수 있는 팔로로 */
export const useAssetCatalog = () => useQuery(assetCatalogQuery());

/** GET /branches/{code}/guide — 고른 지점 안내. 지점을 고르기 전엔 부르지 않아요 */
export const useBranchPublicGuide = (branchCode: string) =>
  useQuery({ ...branchPublicGuideQuery(branchCode), enabled: !!branchCode, select: branchGuideView });

/** GET /trial-slots — 지점을 고르기 전엔 부르지 않아요 */
export const useTrialSlots = (branchCode: string) => useQuery({ ...trialSlotsQuery(branchCode), enabled: !!branchCode });

/** 지점 시트에서 이 지점을 고를 수 없는 이유 (고를 수 있으면 null) — 숨기지 말고 막아서 보여 줘요. 제출 때 서버가 다시 판정해요 */
export function branchBlockReason(b: BranchOption, purpose: 'link' | 'trial'): string | null {
  if (purpose === 'trial') return b.status === 'ACTIVE' ? null : '지금은 쉬는 중';
  if (b.linkStatus === 'linked') return '이미 연동됨';
  if (b.linkStatus === 'pending') return '연동 확인 중';
  return null;
}

export type BranchGroup = { region: string; rows: BranchOption[] };
/** 지역 없는 지점의 묶음 이름 */
export const NO_REGION = '기타';

/** 지점 목록을 지역별로 묶어요 — 지역 순서는 지점이 많은 순(같으면 이름순), 지역 없는 지점은 맨 끝 '기타' */
export function groupBranches(rows: BranchOption[]): BranchGroup[] {
  const by = new Map<string, BranchOption[]>();
  for (const b of rows) {
    const r = b.region ?? NO_REGION;
    by.set(r, [...(by.get(r) ?? []), b]);
  }
  return [...by.entries()]
    .map(([region, list]) => ({ region, rows: list }))
    .sort((a, b) => (a.region === NO_REGION ? 1 : b.region === NO_REGION ? -1 : b.rows.length - a.rows.length || a.region.localeCompare(b.region)));
}

const selectBranchOptions = (rows: BranchOption[]) => ({ rows, groups: groupBranches(rows), nearest: nearestBranches(rows) });

/** GET /branches — 지점 시트 (지역 묶음까지). near(내 위치)를 주면 가까운 순 · 거리 · 방위도 */
export const useBranchOptions = (near: LatLng | null = null) => useQuery({ ...branchOptionsQuery(near), select: selectBranchOptions });

/** 지금 온보딩 값으로 POST /onboarding 본문을 만들어요 (고른 길의 블록 하나만) */
export function onboardingBody(path: OnboardingBody['path']): OnboardingBody {
  const s = getOnboarding();
  const base = { consents: s.consents, nickname: s.nickname, palloloCode: s.palloloCode, path };
  if (path === 'MEMBER') return { ...base, member: { branchCode: s.branchCode, realName: s.realName, phone: s.phone } };
  if (path === 'TRIAL')
    return {
      ...base,
      trial: { branchCode: s.branchCode, realName: s.realName, phone: s.phone, languageCode: s.langs[0] ?? '', date: s.trialDay, time: s.trialTime, reasons: s.why, note: s.note.trim() || null },
    };
  return { ...base, app: { languageCodes: s.langs, reasons: s.why } };
}

/**
 * POST /onboarding — 가입 완료를 서버에 보내요 (길의 마지막 칸). 응답은 온보딩 값 result 에 두고 확인 화면이 그려요.
 * 세션(needsOnboarding)은 아직 내리지 않아요 — 확인 화면의 [시작하기] · [앱 둘러보기] 에서 useCompleteOnboarding.
 */
export function useSubmitOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (path: OnboardingBody['path']) => submitOnboarding(onboardingBody(path)),
    onSuccess: (result: OnboardingResult) => {
      updateOnboarding({ result });
      void queryClient.invalidateQueries({ queryKey: queryKeys.branchSummary });
      void queryClient.invalidateQueries({ queryKey: queryKeys.linkRequests });
      void queryClient.invalidateQueries({ queryKey: queryKeys.trialApplications });
      void queryClient.invalidateQueries({ queryKey: queryKeys.branchOptions });
    },
    onError: (e) => showToast(apiErrorMessage(e)),
  });
}

/** POST /trial-applications — 앱 안 체험 신청 (가입을 마친 계정). 끝나면 상담 신청 내역 · 홈 체험 카드를 다시 받아요 */
export function useCreateTrialApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ body, names }: { body: TrialApplicationBody; names: { branchName: string; languageLabel: string } }) => createTrialApplication(body, names),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.trialApplications });
      void queryClient.invalidateQueries({ queryKey: queryKeys.branchSummary });
    },
    onError: (e) => showToast(apiErrorMessage(e)),
  });
}

/** POST /me/branch-link-requests — 가입을 마친 뒤 연동 요청 (못 찾음 뒤 고쳐서 다시 등). 끝나면 요약 · 이력 · 지점 시트를 다시 받아요 */
export function useCreateLinkRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchCode, branchName, realName, phone }: { branchCode: string; branchName: string; realName: string; phone: string }) =>
      createLinkRequest({ branchCode, realName, phone }, branchName),
    onSuccess: () => {
      // 승인되면 처음 홈에 올 때 '회원이 됐어요' 팝업 (components/home/link-welcome-popup)
      markLinkWaited();
      void queryClient.invalidateQueries({ queryKey: queryKeys.branchSummary });
      void queryClient.invalidateQueries({ queryKey: queryKeys.linkRequests });
      void queryClient.invalidateQueries({ queryKey: queryKeys.branchOptions });
    },
    onError: (e) => showToast(apiErrorMessage(e)),
  });
}
