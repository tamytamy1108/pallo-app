/**
 * 토스트 [보러가기]: 방금 저장 · 참여 · 개설해서 다른 곳에 생긴 것을 바로 보러 가요.
 * 예) showToast('저장했어요', seeAt(SEE.savedMeets))
 *
 * 보던 화면은 그대로 두고 그 위에 띄워요 — 탭을 바꾸거나 화면을 갈아 끼우지 않아요.
 * 닫거나 뒤로 가면 누르기 전 그 자리(같은 탭 · 같은 스크롤)로 돌아와요.
 * - 화면 주소(Href): 지금 화면 위에 새 화면을 쌓아요 (router.push)
 * - 목록 시트({ sheet }): 마이 탭의 목록 시트(찜한 모임 · 내 모임 · 찜한 챌린지 · 라운지 저장함)를 지금 화면 위에 바로 띄워요
 *   (예전에는 /my?open= 으로 마이 탭으로 넘어가서, 돌아올 길이 없었어요). 시트는 맨 바깥 _layout 의 SeeSheetHost 가 그려요.
 */
import { router, type Href } from 'expo-router';

import type { ToastAction } from '@/components/ui/toast';
import { createStore } from '@/lib/store';

export type SeeSheet = 'saved-meets' | 'joined-meets' | 'saved-challenges' | 'saved-posts';
type SeeTarget = Href | { sheet: SeeSheet };

const sheetStore = createStore<{ open: SeeSheet | null }>({ open: null });
// React Compiler 가 x.use() 를 React use() 로 보지 않게 useXxx 이름으로 꺼내 써요
const useSheetStore = sheetStore.use;
/** 지금 떠 있는 [보러가기] 목록 시트 (SeeSheetHost 가 써요) */
export const useSeeSheet = () => useSheetStore((s) => s.open);
export const openSeeSheet = (sheet: SeeSheet) => sheetStore.set({ open: sheet });
export const closeSeeSheet = () => sheetStore.set({ open: null });

const isSheet = (to: SeeTarget): to is { sheet: SeeSheet } => typeof to === 'object' && to !== null && 'sheet' in to;

export const seeAt = (to: SeeTarget): ToastAction => ({ label: '보러가기', onPress: () => (isSheet(to) ? openSeeSheet(to.sheet) : router.push(to)) });

export const SEE = {
  savedMeets: { sheet: 'saved-meets' },
  joinedMeets: { sheet: 'joined-meets' },
  savedChallenges: { sheet: 'saved-challenges' },
  /** 라운지 글 저장(책갈피)으로 모은 글 */
  savedPosts: { sheet: 'saved-posts' },
  expressions: '/me/expressions',
  myRoom: '/my',
} as const satisfies Record<string, SeeTarget>;
