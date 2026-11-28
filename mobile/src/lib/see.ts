/**
 * 토스트 [보러가기]: 방금 저장 · 참여 · 개설해서 다른 곳에 생긴 것을 바로 보러 가요.
 * 예) showToast('저장했어요', seeAt(SEE.savedMeets))
 *
 * 보던 화면은 그대로 두고 그 위에 새 화면을 쌓아요 (router.push) — 탭을 바꾸거나 화면을 갈아 끼우지 않아요.
 * 뒤로 가면(위 줄 뒤로 · 밀어서 · 기기 뒤로) 누르기 전 그 자리(같은 탭 · 같은 스크롤)로 돌아와요.
 * 찜한 모임 · 내 모임 · 찜한 챌린지 · 라운지 저장함은 저장함 화면(/me/saved?box=)이에요 — 마이의 같은 줄도 이 화면을 열어요.
 * (예전에는 보던 화면 위에 목록 시트를 띄웠어요)
 */
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback } from 'react';

import type { ToastAction } from '@/components/ui/toast';
import { runAfterSheetClose } from '@/components/ui/sheet';

/** 저장함 화면(/me/saved?box=)의 칸: 찜한 모임 · 내 모임 · 찜한 챌린지 · 라운지 저장함 */
export type SavedBox = 'meets' | 'joined' | 'challenges' | 'posts';
export const SAVED_BOXES: readonly SavedBox[] = ['meets', 'joined', 'challenges', 'posts'];
export const isSavedBox = (v: unknown): v is SavedBox => typeof v === 'string' && (SAVED_BOXES as readonly string[]).includes(v);
export const savedBoxHref = (box: SavedBox): Href => ({ pathname: '/me/saved', params: { box } });

// 지금 보고 있는 저장함 칸 — 그 화면 안에서 다시 찜하면 [보러가기] 를 안 붙여요 (같은 화면이 또 쌓이지 않게)
let here: SavedBox | null = null;
/** 저장함 화면이 보이는 동안 그 칸을 알려 둬요 (화면을 떠나면 지워요) */
export function useSeeHere(box: SavedBox) {
  useFocusEffect(
    useCallback(() => {
      here = box;
      return () => {
        if (here === box) here = null;
      };
    }, [box]),
  );
}

type SeeTarget = Href | { box: SavedBox };
const isBox = (to: SeeTarget): to is { box: SavedBox } => typeof to === 'object' && to !== null && 'box' in to;

export const seeAt = (to: SeeTarget): ToastAction | undefined => {
  if (isBox(to)) return to.box === here ? undefined : { label: '보러가기', onPress: () => router.push(savedBoxHref(to.box)) };
  return { label: '보러가기', onPress: () => router.push(to) };
};

export const SEE = {
  savedMeets: { box: 'meets' },
  joinedMeets: { box: 'joined' },
  savedChallenges: { box: 'challenges' },
  /** 라운지 글 저장(책갈피)으로 모은 글 */
  savedPosts: { box: 'posts' },
  expressions: '/me/expressions',
  myRoom: '/my',
} as const satisfies Record<string, SeeTarget>;

/**
 * 목록 몸통(찜한 모임 · 내 모임 · 찜한 챌린지 · 라운지 저장함)에서 줄을 눌러 다른 화면으로 갈 때.
 * 화면(저장함)에서는 바로 가고, 시트에서는 시트를 닫은 다음에 가요 (leaveSheet).
 */
export type Leave = (go: () => void) => void;
export const stay: Leave = (go) => go();
export const leaveSheet =
  (onClose: () => void): Leave =>
  (go) => {
    onClose();
    runAfterSheetClose(go);
  };
