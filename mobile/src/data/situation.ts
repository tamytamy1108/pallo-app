/**
 * 상황 맵 · 장면 — 맵 목록은 data/maps (JSON 한 줄 = 맵 하나), 장면 단계 · 퀴즈 난이도는 여기.
 * 맞는 API: 16 `/library/maps` (맵 목록) · 17 `/library/books/:id/lessons` (장면 목록) · 18 `/lessons/:id` (장면 콘텐츠 → situation-content.ts).
 * 새 상황 맵 = data/maps/situation-maps.json 에 한 줄 (모양은 앱에 있는 프리셋 중 고르기). 형식은 docs/frontend/map-data.md.
 * 장면 id = '맵 id-장면 번호' (예: 'travel-1') — 라이브러리 지도 · 리스닝 룸과 같은 키예요.
 */
import { getMaps, toSituationMaps, type Scene, type SituationMap, type SoonMap } from './maps';

export type { Scene, SituationMap, SoonMap };

const LOADED = toSituationMaps(getMaps());

/** 지금 열린 상황 맵 (순서대로) */
export const SITUATION_MAPS: SituationMap[] = LOADED.maps;

/** 곧 열릴 맵 (칩만 보이고 누르면 알림 안내) */
export const SITUATION_SOON: SoonMap[] = LOADED.soon;

export const sceneIdOf = (mapId: string, no: number) => `${mapId}-${no}`;

/** 장면 id('travel-1') → 맵 · 장면. 없는 id 면 null */
export function findScene(id: string | undefined): { map: SituationMap; scene: Scene } | null {
  if (!id) return null;
  const cut = id.lastIndexOf('-');
  const map = SITUATION_MAPS.find((m) => m.id === id.slice(0, cut));
  const scene = map?.scenes.find((s) => s.no === Number(id.slice(cut + 1)));
  return map && scene ? { map, scene } : null;
}

/* ---- 장면 단계 (프로토타입 STUDY_STEPS.situation.main · v480) ---- */
export type SceneStepId = 'mis' | 'flow' | 'bank' | 'exq' | 'talk';
export type SceneStep = { id: SceneStepId; t: string; d: string; min: number; xp: number };

export const SCENE_STEPS: SceneStep[] = [
  { id: 'mis', t: '미션 익히기', d: '미션 3개 · 내 레벨 문장 듣고 따라 말하기', min: 5, xp: 10 },
  { id: 'flow', t: '장면 롤플레이', d: '도착 → 요청 → 돌발 → 마무리 · 직원 말에 대답하기', min: 5, xp: 15 },
  { id: 'bank', t: 'Word Bank', d: '이 장면 단어 10개 · 30초 타임어택', min: 3, xp: 5 },
  { id: 'exq', t: '상황 퀴즈', d: '실제 상황 15문제 · 내 레벨에 맞춘 난이도', min: 6, xp: 10 },
  { id: 'talk', t: 'AI 미션 대화', d: 'AI 직원과 대화하며 미션 3개 해내기', min: 6, xp: 15 },
];

export const isSceneStep = (x: string | undefined): x is SceneStepId => SCENE_STEPS.some((s) => s.id === x);

/** 단계 카드 · 팝업 제목 (프로토타입 stepTitle: bank 는 'Word Bank 퀴즈') */
export const stepTitle = (s: SceneStep) => (s.id === 'bank' ? 'Word Bank 퀴즈' : s.t);

/** 진도 키: 단계 = stepKey(맵 id, 장면 번호, 단계 id) 와 같은 모양 ('travel:1:mis') · 장면 도장 = sceneKey(장면 id) (state/progress) */
export const sceneStepKey = (sceneId: string, step: SceneStepId) => {
  const cut = sceneId.lastIndexOf('-');
  return `${sceneId.slice(0, cut)}:${sceneId.slice(cut + 1)}:${step}`;
};

/* ---- 상황 퀴즈 난이도 (프로토타입 SITQ_PICK) ---- */
export type QuizLevel = 0 | 1 | 2 | 3 | 4;
export const QUIZ_LEVELS: { lv: QuizLevel; name: string; d: string; ex: string }[] = [
  { lv: 0, name: '왕기초', d: '이 장면에 꼭 필요한 단어와 기초 문법부터 익혀요', ex: '영수증 → receipt · Can I get ___ iced latte? → an' },
  { lv: 1, name: '입문', d: '한국어 뜻을 보고 영어 표현을 골라요', ex: '카드로 계산할 수 있어요? → Can I pay by card?' },
  { lv: 2, name: '기초', d: '상황을 읽고 이럴 때 할 말을 골라요 · 빈칸 채우기', ex: "영수증은 필요 없어요. → No, I'm ___, thanks." },
  { lv: 3, name: '중급', d: '직원의 영어 말을 듣고 알맞은 대답을 골라요', ex: 'Barista: Anything else? → Could you make it less sweet?' },
  { lv: 4, name: '고급', d: '글자 없이 듣기만 하고 답해요 · 한국어식 직역 함정 피하기', ex: 'Wi-Fi password, please teach me. (X)' },
];

/** 내가 듣는 레벨 (프로토타입 ME.lvs · 두 레벨 병행이면 둘). 실제 앱은 /me 의 레벨에서 와요 */
export const MY_QUIZ_LEVELS: QuizLevel[] = [1, 2];

/** 리스닝 룸 문장 (프로토타입 lrItemsOf: 표현 예문 + 롤플레이 대사) */
export function sceneListenItems(scene: Scene) {
  const c = scene.content;
  if (!c) return [];
  return [...c.expr.map(([, ko, ex]) => ({ en: ex, ko, tag: `${scene.title} 표현` })), ...c.rp.lines.map(([en, ko]) => ({ en, ko, tag: `${scene.title} 대화` }))];
}
