import { pickLevel } from '@/components/scene/scene-store';
import { getMaps, toSituationMaps } from '@/data/maps';
import { findScene, type SceneWithContent, type SituationMap } from '@/data/situation';
import { SCENE_CONTENT } from '@/data/situation-content';

/*
 * 상황 장면 스토리 도구 — 가짜 서버와 같은 맵(data/maps) · 장면 콘텐츠(data/situation-content)로 장면 하나를 꺼낸다.
 */

/** 장면 id('travel-1') → 맵 · 콘텐츠가 붙은 장면. 콘텐츠가 없는 장면이면 오류 */
export function sceneOf(id: string): { map: SituationMap; scene: SceneWithContent } {
  const found = findScene(toSituationMaps(getMaps()).maps, id);
  const content = found?.scene.contentId ? SCENE_CONTENT[found.scene.contentId] : undefined;
  if (!found || !content) throw new Error(`스토리: ${id} 장면 콘텐츠가 없어요`);
  return { map: found.map, scene: { ...found.scene, content } };
}

/** 모든 장면에서 '처음 레벨 고르기'를 이미 한 것으로 (장면 화면 · 퀴즈가 바로 본문부터) */
export function pickedAll(lv: 0 | 1 | 2 | 3 | 4 = 1) {
  for (const row of getMaps()) for (const s of row.scenes) pickLevel(s.title, lv);
}
