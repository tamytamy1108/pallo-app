/**
 * 상황 맵 · 장면 — 가짜 데이터. 값은 프로토타입 SITS · SIT_SOON · STUDY_STEPS.situation · SITQ_PICK · ME.lvs 그대로예요.
 * 맞는 API: 16 `/library/maps` (맵 목록) · 17 `/library/books/:id/lessons` (장면 목록) · 18 `/lessons/:id` (장면 콘텐츠 → situation-content.ts).
 * 새 상황 맵 = SITUATION_MAPS 에 객체 하나, 새 장면 = scenes 에 한 줄(+ 콘텐츠). 콘텐츠가 없는 장면은 '커밍순'이에요.
 * 장면 id = '맵 id-장면 번호' (예: 'travel-1') — 라이브러리 지도 · 리스닝 룸과 같은 키예요.
 */
import { SCENE_CONTENT, type SceneContent } from './situation-content';

export type Scene = {
  no: number;
  title: string;
  sub: string;
  /** 지도 정류장 아이콘 이름 (프로토타입 ICO 키) */
  icon: string;
  /** 없으면 '커밍순' */
  content: SceneContent | null;
};

export type SituationMap = {
  id: string;
  title: string;
  /** 표지 · 머리 글자 (TRAVEL) */
  series: string;
  /** 맵 색 (표지 · 단계 번호) */
  c: string;
  about: string;
  /** 새 맵 표시 (NEW) */
  isNew?: boolean;
  scenes: Scene[];
};

/** 프로토타입 sc(title, sub, icon, data) — 콘텐츠는 장면 제목으로 찾아요 (없으면 커밍순) */
const sc = (title: string, sub: string, icon: string): Omit<Scene, 'no'> => ({ title, sub, icon, content: SCENE_CONTENT[title] ?? null });
const numbered = (list: Omit<Scene, 'no'>[]): Scene[] => list.map((x, i) => ({ no: i + 1, ...x }));

export const SITUATION_MAPS: SituationMap[] = [
  {
    id: 'travel',
    title: '여행',
    series: 'TRAVEL',
    c: '#D0798E',
    about: '공항부터 길 묻기까지 · 장면마다 표현 + 롤플레이',
    scenes: numbered([
      sc('공항 체크인', 'Check-in counter', 'plane'),
      sc('기내 주문', 'On the plane', 'seat'),
      sc('입국 심사', 'Immigration', 'pass'),
      sc('택시 타기', 'Taxi', 'taxi'),
      sc('호텔 체크인', 'Hotel', 'hotel'),
      sc('식당 주문', 'Restaurant', 'food'),
      sc('쇼핑 · 환불', 'Shopping', 'bag'),
      sc('길 묻기', 'Directions', 'map'),
    ]),
  },
  {
    id: 'biz',
    title: '비즈니스',
    series: 'BUSINESS',
    c: '#493087',
    about: '자기소개부터 회의 · 메일 · 협상까지',
    scenes: numbered([
      sc('첫 미팅 자기소개', 'Introductions', 'brief'),
      sc('회의에서 의견 말하기', 'Meetings', 'chat'),
      sc('메일 · 메신저', 'Email', 'mail'),
      sc('가격 협상', 'Negotiation', 'deal'),
      sc('발표 Q&A', 'Presentation', 'mic'),
    ]),
  },
  {
    id: 'cafe',
    title: '카페',
    series: 'CAFÉ',
    c: '#138A9E',
    about: '주문 · 변경 · 자리 찾기 · 컴플레인',
    isNew: true,
    scenes: numbered([sc('주문 바꾸기', 'Change my order', 'coffee'), sc('자리 찾기', 'Find a seat', 'seat'), sc('컴플레인', 'Complaint', 'chat')]),
  },
  {
    id: 'campus',
    title: '캠퍼스',
    series: 'CAMPUS',
    c: '#5EA35A',
    about: '수업 · 질문 · 조별 과제 · 동아리',
    scenes: numbered([
      sc('첫 수업 자기소개', 'First class', 'book'),
      sc('수업 중 질문', 'Asking in class', 'chat'),
      sc('조별 과제', 'Group project', 'group'),
      sc('도서관', 'Library', 'lib'),
      sc('동아리 가입', 'Joining a club', 'star'),
      sc('기숙사 생활', 'Dorm life', 'dorm'),
    ]),
  },
];

/** 곧 열릴 맵 (칩만 보이고 누르면 알림 안내) */
export const SITUATION_SOON = [{ id: 'next', title: '새 맵', when: '커밍순' }];

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
