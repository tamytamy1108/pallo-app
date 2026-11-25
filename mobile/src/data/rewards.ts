/**
 * 시즌 · 기간 보상 규칙 (스파크로 못 사는 '시즌' 아이템). 서버가 조건을 세다가 채우면 자동으로 넣어 줘요.
 * 맞는 API (제안 · docs/frontend/api-additions.md '시즌 보상 자동 지급'):
 *   GET /me/rewards — 규칙마다 진행(n/need) · 받았는지 · 아직 안 본 보상
 *   POST /me/rewards/{id}/seen — 받은 보상 창을 본 뒤
 * 아이템 키는 가진 것 목록(own)과 같아요: 아이템 id · 배경은 'bg:' + id.
 */
export type RewardRule = {
  id: string;
  /** 보상 이름 (세트면 '산타 세트') */
  name: string;
  /** 들어오는 아이템 키 */
  items: string[];
  /** 조건 한 줄 (잠긴 칸 · 알림 · 받은 창에 같이 써요) */
  rule: string;
  /** 채워야 하는 수 · 단위 */
  need: number;
  unit: string;
  /** 기간 (없으면 늘) */
  window?: string;
};

export const REWARDS: RewardRule[] = [
  { id: 'santa', name: '산타 세트', items: ['h-santa', 'f-beard', 'w-santa', 's-snow', 'bg:snow'], rule: '12월 출석 7일', need: 7, unit: '일', window: '12.1 ~ 12.31' },
  { id: 'crown', name: '황금 왕관', items: ['h-crown'], rule: '주간 랭킹 TOP 3', need: 1, unit: '번' },
  { id: 'medal', name: '금메달', items: ['a-medal'], rule: '지점 대항전 우승', need: 1, unit: '번' },
];

export const REWARD: Record<string, RewardRule> = Object.fromEntries(REWARDS.map((r) => [r.id, r]));

/** 아이템 키로 그 아이템을 주는 보상 찾기 (꾸미기 잠긴 칸) */
export const rewardOfItem = (key: string) => REWARDS.find((r) => r.items.includes(key));
