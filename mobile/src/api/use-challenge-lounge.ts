/**
 * 라운지 '챌린지' 탭 데이터 (api/challenges.ts). 섹션 나누기 · 정렬 · 숫자는 서버가 정해서, 여기서는 받은 그대로 넘겨요.
 * 칩 '전체' · '참여 중' 은 같은 응답을 나눠 보여 주는 것이라 다시 받지 않아요 — 분류 칩만 category 를 바꿔 새로 받아요.
 * 참여 · 찜 뒤에는 챌린지 목록(모든 분류) · 마이 › 찜한 챌린지 · 마이 탭 개수를 다시 받아요.
 */
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { joinChallenge, setChallengeSaved, type ChallengeLounge, type ChallengeSummary } from './challenges';
import { challengeCategoriesQuery, challengeLoungeQuery, queryKeys } from './queries';

/** category: 분류 코드 (CHALLENGE_CATEGORY 마스터데이터) · null 이면 전 분류 */
export function useChallengeLounge(category: string | null) {
  return useQuery(challengeLoungeQuery(category));
}

/** 분류 칩 (마스터데이터 code · 이름, 콘솔 정렬 순서) */
export function useChallengeCategories() {
  return useQuery(challengeCategoriesQuery());
}

const refetchAfterChange = (queryClient: QueryClient) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.challengesAll }),
    queryClient.invalidateQueries({ queryKey: queryKeys.savedChallenges }),
    queryClient.invalidateQueries({ queryKey: queryKeys.myPage }),
  ]);

/** 받아 둔 라운지 목록(모든 분류) 안의 같은 챌린지 카드를 한 번에 고쳐요 — 같은 챌린지가 핫 · 진행 중에 함께 있을 수 있어요 */
function patchCachedCard(queryClient: QueryClient, id: string, fn: (c: ChallengeSummary) => ChallengeSummary) {
  queryClient.setQueriesData<ChallengeLounge>({ queryKey: queryKeys.challengeLoungeAll }, (old) => {
    if (!old) return old;
    const map = (L: ChallengeSummary[]) => L.map((c) => (c.id === id ? fn(c) : c));
    return { ...old, hot: map(old.hot), running: map(old.running), joined: map(old.joined), upcoming: map(old.upcoming) };
  });
}

/** 참여하기 · 도전 신청 — 돌려주는 값의 viewerRole 로 '참여했어요'(MEMBER) · '승인 기다려요'(PENDING) 를 갈라요 */
export function useJoinChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => joinChallenge(id),
    // 섹션이 바뀌니(진행 중 → 참여 중) 서버 목록을 다시 받아요
    onSettled: () => refetchAfterChange(queryClient),
  });
}

/** 찜 · 찜 취소 — 하트는 누르자마자 바뀌고, 실패하면 서버 값으로 되돌려요 */
export function useSetChallengeSaved() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, on }: { id: string; on: boolean }) => setChallengeSaved(id, on),
    onMutate: async ({ id, on }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.challengeLoungeAll });
      patchCachedCard(queryClient, id, (c) => ({ ...c, saved: on }));
    },
    onError: () => queryClient.invalidateQueries({ queryKey: queryKeys.challengesAll }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.savedChallenges }),
        queryClient.invalidateQueries({ queryKey: queryKeys.myPage }),
      ]),
  });
}
