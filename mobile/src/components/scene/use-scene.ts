/**
 * 장면 화면 · 단계 화면이 쓰는 장면 받기: 16 `/library/maps` 에서 맵 · 장면 줄 → 18 `/lessons/:contentId` 에서 장면 콘텐츠.
 * 라이브러리 탭에서 이미 받은 맵 목록 · 같은 장면의 다른 단계에서 받은 콘텐츠는 기다리지 않고 그대로 써요.
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { ClientErrorCode, errorMessage, isApiError } from '@/api/errors';
import { sceneContentQuery, situationMapsQuery } from '@/api/queries';
import { findScene, type SceneWithContent, type SituationMap } from '@/data/situation';

export type SceneLoad =
  | { state: 'loading' }
  | { state: 'error'; message: string; retry: () => void }
  /** 없는 장면 · 콘텐츠가 아직 없는 장면 ('곧 열려요') */
  | { state: 'soon' }
  | { state: 'ready'; map: SituationMap; scene: SceneWithContent };

export function useScene(id: string | undefined): SceneLoad {
  const maps = useQuery(situationMapsQuery());
  const found = useMemo(() => (maps.data ? findScene(maps.data.maps, id) : null), [maps.data, id]);
  const contentId = found?.scene.contentId ?? null;
  const content = useQuery({ ...sceneContentQuery(contentId ?? ''), enabled: !!contentId });
  const scene = useMemo(() => (found && content.data ? { ...found.scene, content: content.data } : null), [found, content.data]);

  if (maps.isPending) return { state: 'loading' };
  if (maps.isError) return { state: 'error', message: errorMessage(maps.error), retry: () => void maps.refetch() };
  if (!found || !contentId) return { state: 'soon' };
  if (content.isPending) return { state: 'loading' };
  if (content.isError) {
    if (isApiError(content.error) && content.error.code === ClientErrorCode.notFound) return { state: 'soon' };
    return { state: 'error', message: errorMessage(content.error), retry: () => void content.refetch() };
  }
  return scene ? { state: 'ready', map: found.map, scene } : { state: 'loading' };
}
