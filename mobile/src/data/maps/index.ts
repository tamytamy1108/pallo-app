/**
 * 상황 맵 데이터 — 모양(프리셋)과 내용(이 파일이 읽는 JSON)을 나눠요.
 * - 모양: components/library/world/presets.ts (앱과 함께 나가요. 새 모양만 앱 업데이트)
 * - 내용: situation-maps.json 한 줄 = 맵 하나 (이름 · 색 · 장면 · 공개일 · 순서). 나중에 관리자 웹 → API 로 와요.
 * 맞는 API: 16 `GET /library/maps` — 응답 한 줄이 MapRow 모양이에요. 형식은 docs/frontend/map-data.md.
 */
import { MAP_PRESETS, isMapPreset, type MapPresetKey } from '@/components/library/world/presets';

import { SCENE_CONTENT, type SceneContent } from '../situation-content';
import LOCAL_ROWS from './situation-maps.json';

/* ---- 서버(관리자 웹)가 보내는 모양 ---- */

export type MapLang = 'en' | 'ja' | 'zh' | 'es';

export type SceneRow = {
  no: number;
  title: string;
  sub: string;
  /** 지도 정류장 아이콘 이름 (프로토타입 ICO 키) */
  icon: string;
  /** 장면 콘텐츠 id (없으면 '커밍순' 장면) */
  contentId: string | null;
};

export type MapRow = {
  id: string;
  /** 앱에 있는 모양 키 (MAP_PRESETS). 모르는 키면 '업데이트하면 열려요' 칩 */
  preset: string;
  lang: MapLang;
  /** 칩 순서 (작을수록 앞) */
  order: number;
  title: string;
  /** 표지 · 머리 글자 (TRAVEL) */
  series: string;
  /** 맵 색 '#RRGGBB' */
  color: string;
  about: string;
  isNew?: boolean;
  /** 'YYYY-MM-DD'. 이 날 전에는 '곧 열림' 칩 */
  opensAt?: string | null;
  /** true 면 '커밍순' 칩만 */
  locked?: boolean;
  /** true 면 아예 안 보여요 (만드는 중 · 샘플) */
  hidden?: boolean;
  scenes: SceneRow[];
};

/* ---- 앱 화면이 쓰는 모양 ---- */

export type Scene = {
  no: number;
  title: string;
  sub: string;
  icon: string;
  /** 없으면 '커밍순' */
  content: SceneContent | null;
};

export type SituationMap = {
  id: string;
  preset: MapPresetKey;
  /** LANGS 순서 (0 영어 · 1 일본어 · 2 중국어 · 3 스페인어) */
  lang: number;
  title: string;
  series: string;
  /** 맵 색 (표지 · 단계 번호) */
  c: string;
  about: string;
  /** 새 맵 표시 (NEW) */
  isNew?: boolean;
  scenes: Scene[];
};

/** 곧 열릴 맵 (칩만 보이고 누르면 알림 안내) */
export type SoonMap = { id: string; title: string; when: string; lang: number };

const LANG_INDEX: Record<MapLang, number> = { en: 0, ja: 1, zh: 2, es: 3 };

/**
 * 맵 목록을 받는 곳 하나. 지금은 앱에 든 JSON, 나중엔 `GET /library/maps` 응답으로 바꿔요.
 * (바꿀 때: 앱 시작 때 받아 두고 여기서 돌려주기 — 화면 코드는 그대로)
 */
export function getMaps(): MapRow[] {
  return LOCAL_ROWS as MapRow[];
}

const warn = (msg: string) => {
  if (__DEV__) console.warn(`[maps] ${msg}`);
};

/** 'YYYY-MM-DD' → 그날 0시 (기기 시간대) */
const dayStart = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/**
 * 서버 모양 → 화면 모양. 열린 맵(maps)과 곧 열릴 맵(soon)으로 나눠요.
 * - hidden: 빼요 · locked / 공개일 전: soon · 모르는 프리셋: soon + 개발 경고
 * - 프리셋 정류장 수보다 장면이 많으면 넘는 장면은 빼고 경고
 */
export function toSituationMaps(rows: MapRow[], now: Date = new Date()): { maps: SituationMap[]; soon: SoonMap[] } {
  const maps: SituationMap[] = [];
  const soon: SoonMap[] = [];
  const seen = new Set<string>();
  for (const r of [...rows].sort((a, b) => a.order - b.order)) {
    if (r.hidden) continue;
    if (seen.has(r.id)) {
      warn(`같은 맵 id 가 두 번 있어요: '${r.id}' — 뒤의 것은 뺐어요`);
      continue;
    }
    seen.add(r.id);
    const lang = LANG_INDEX[r.lang] ?? 0;
    if (!isMapPreset(r.preset)) {
      warn(`'${r.id}' 맵의 모양 '${r.preset}' 이 이 앱에 없어요 — '업데이트하면 열려요' 칩으로 보여요`);
      soon.push({ id: r.id, title: r.title, when: '업데이트하면 열려요', lang });
      continue;
    }
    const opens = r.opensAt ? dayStart(r.opensAt) : null;
    if (r.locked || (opens && opens > now)) {
      soon.push({ id: r.id, title: r.title, when: opens && opens > now ? `${opens.getMonth() + 1}/${opens.getDate()} 열림` : '커밍순', lang });
      continue;
    }
    const stops = MAP_PRESETS[r.preset].stops;
    if (r.scenes.length > stops) warn(`'${r.id}' 맵 장면 ${r.scenes.length}개 > '${r.preset}' 정류장 ${stops}개 — 넘는 장면은 뺐어요`);
    const scenes = r.scenes.slice(0, stops).map((s): Scene => {
      const content = s.contentId ? (SCENE_CONTENT[s.contentId] ?? null) : null;
      if (s.contentId && !content) warn(`'${r.id}' ${s.no}번 장면 콘텐츠 '${s.contentId}' 가 없어요 — 커밍순으로 보여요`);
      return { no: s.no, title: s.title, sub: s.sub, icon: s.icon, content };
    });
    maps.push({ id: r.id, preset: r.preset, lang, title: r.title, series: r.series, c: r.color, about: r.about, ...(r.isNew ? { isNew: true } : null), scenes });
  }
  return { maps, soon };
}
