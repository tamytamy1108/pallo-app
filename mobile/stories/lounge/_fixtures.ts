/**
 * 라운지 · 챌린지 스토리가 같이 쓰는 상태 맞추기 도구.
 * 라운지(data/lounge-store) · 챌린지(data/challenge) 가게는 기기(localStorage)에 남아서 앞 스토리 값이 이어진다 —
 * 스토리마다 `fresh()` 로 처음 값으로 돌린 뒤, 보고 싶은 상태만 공개 함수(toggleLike · toggleJoin …)로 만든다.
 */
import { userEvent, within } from 'storybook/test';

import { CHALLENGES, type Challenge, type ChView } from '@/data/challenge';
import type { FeedItem, Post, RecMeet } from '@/data/lounge';
import { FEED } from '@/data/lounge';
import { clearSavedData } from '@/lib/store';
import { type Me, updateMe } from '@/state/me';

import { personaOf, USER_KIND_PATCH } from '../../.storybook/user-kinds';

type Ctx = { globals: Record<string, unknown> };

/**
 * 기기에 남은 내 기록(라운지 · 챌린지 · 차단 · 표현함 등)을 모두 처음 값으로 돌리고, 툴바의 회원 유형을 다시 넣는다.
 * (clearSavedData 가 나(state/me)도 처음 값으로 돌려서 preview 가 넣은 유형을 다시 넣어야 한다)
 * me: 리더 · 매니저처럼 유형 말고 더 바꿀 것.
 */
export function fresh(ctx: Ctx, me: Partial<Me> = {}) {
  clearSavedData();
  updateMe({ ...USER_KIND_PATCH[personaOf(ctx.globals)], ...me });
}

/** beforeEach 로 바로 쓰는 모양 — `beforeEach: setup((ctx) => { toggleLike('p1'); })` */
export const setup =
  (more?: () => void, me?: Partial<Me>) =>
  (ctx: Ctx) => {
    fresh(ctx, me);
    more?.();
  };

/** 예시 피드에서 id 로 하나 (없으면 스토리 작성 실수라 바로 알게 던진다) */
export function feedItem<K extends FeedItem['k']>(id: string, k: K): Extract<FeedItem, { k: K }> {
  const x = FEED.find((p) => p.id === id);
  if (!x || x.k !== k) throw new Error(`예시 피드에 ${k} ${id} 가 없어요`);
  return x as Extract<FeedItem, { k: K }>;
}

/** 예시 챌린지 하나 */
export function challenge(id: string): Challenge {
  const x = CHALLENGES.find((p) => p.id === id);
  if (!x) throw new Error(`예시 챌린지 ${id} 가 없어요`);
  return x;
}

/** 챌린지 가게 처음 값과 같은 모양 (DailyCard · ExprCard · HotBox 는 s 를 props 로 받는다) */
export function chView(patch: Partial<ChView> = {}): ChView {
  return {
    created: [],
    joined: { c1: true, c5: true, c7: true, c8: true, c11: true },
    joinedNew: {},
    checked: {},
    xJoined: {},
    saved: {},
    checkins: {},
    entries: {},
    replies: {},
    liked: {},
    flash: null,
    ...patch,
  };
}

const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const WD = ['일', '월', '화', '수', '목', '금', '토'];

/** 오늘에서 n 일 뒤 날짜를 번개 카드 모양으로 (D-n 이 늘 같게 — 예시 데이터 날짜는 이미 지났을 수 있다) */
export function meetDay(n: number): Pick<RecMeet, 'mon' | 'day' | 'wd'> {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return { mon: MON[d.getMonth()], day: String(d.getDate()), wd: `${WD[d.getDay()]} 19:30` };
}

/** 오늘에서 n 일 뒤 'YYYY-MM-DD' (동행 카드 날짜) */
export function isoDay(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 내가 올린 사진 대신 쓰는 그림 주소 (네트워크 없이 그려지게 SVG 를 글자 주소로) */
export function photoUri(color: string, label: string, w = 1080, h = 1080) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="${color}"/><circle cx="${w * 0.7}" cy="${h * 0.3}" r="${Math.min(w, h) * 0.18}" fill="#FFE14D" stroke="#1F1B2E" stroke-width="8"/><text x="50%" y="62%" font-family="sans-serif" font-size="${Math.min(w, h) * 0.12}" font-weight="700" text-anchor="middle" fill="#1F1B2E">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** 아주 긴 글 (줄바꿈 · 넘침 확인용) */
export const LONG_TEXT =
  '이번 주 세션 주제는 주말 이야기였어요. 다들 20분 동안 주말 얘기만 했는데, 처음엔 어색하다가 나중엔 서로 질문하느라 시간이 모자랐어요. 다음 주에는 여행 이야기로 해 보기로 했고, 각자 사진 한 장씩 가져오기로 했어요. 오늘 배운 표현은 꼭 다시 써 볼게요!';

/** 예시 글을 조금 바꿔 새 글로 (id 를 바꿔야 좋아요 · 댓글이 예시 글과 섞이지 않는다) */
export const postOf = (base: Post, patch: Partial<Post>): Post => ({ ...base, ...patch });

/** play 도우미: 이 접근성 이름의 버튼을 눌러요 (시트처럼 canvas 밖에 그려지는 것도 찾게 body 에서) */
export async function tap(name: string | RegExp, role: 'button' | 'checkbox' | 'radio' | 'tab' = 'button') {
  await userEvent.click(await within(document.body).findByRole(role, { name }, { timeout: 4000 }));
}

/** play 도우미: 글자로 찾아 눌러요 */
export async function tapText(text: string | RegExp) {
  await userEvent.click(await within(document.body).findByText(text, undefined, { timeout: 4000 }));
}
