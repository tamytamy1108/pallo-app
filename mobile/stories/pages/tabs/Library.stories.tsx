import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { bookShelfQuery, situationMapsQuery } from '@/api/queries';
import LibraryScreen from '@/app/(app)/(tabs)/library';
import { setLib } from '@/components/library/library-state';
import { updateMe } from '@/state/me';

import { LOADING_FOREVER } from '../../_support/api';
import { freshDevice } from '../../_support/fresh-device';
import { doneScene, doneSteps, level } from '../../library/_fixtures';

/** 스터디 맵 / 상황 맵 · 언어(0 영어 · 1 일본어 · 2 중국어) · 고른 상황 맵으로 시작 — 화면은 처음 열 때 내 공부 언어(state/me lang)로 맞춘다 */
const start = (opts: { sit?: boolean; lang?: 'en' | 'ja' | 'zh' | 'es'; map?: string; seen?: Record<string, true> } = {}, more?: () => void) =>
  freshDevice(() => {
    const lang = opts.lang ?? 'en';
    updateMe({ lang });
    setLib({ lang: { en: 0, ja: 1, zh: 2, es: 3 }[lang], sitMode: !!opts.sit, map: opts.map ?? null, seen: opts.seen ?? {} });
    more?.();
  });

/**
 * 라이브러리 탭 (/library) — 언어 · [스터디 맵 | 상황 맵] · 3D 섬 지도 · 아래 카드.
 * 3D 지도는 WebGL 이 없는 브라우저(헤드리스 등)에서 2D 사진판으로 바뀐다.
 */
const meta = {
  title: 'Pages/Tabs/Library',
  component: LibraryScreen,
  parameters: { route: { pathname: '/library' } },
  beforeEach: start(),
} satisfies Meta<typeof LibraryScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 영어 스터디 맵 · 내 레벨 섬 · 과 목록 */
export const Default: Story = {};
/** 1과를 조금 한 뒤 */
export const StudyInProgress: Story = { beforeEach: start({}, () => doneSteps(level(1), 1, 5)) };
/** 비회원 — 첫 과만 열림 */
export const StudyGuest: Story = { globals: { userKind: 'guest' } };
/** 상황 맵 · 첫 맵(여행) — NEW 칩이 남아 있음 */
export const Situation: Story = { beforeEach: start({ sit: true, map: 'travel' }) };
/** 상황 맵 · 장면 진도 */
export const SituationProgress: Story = {
  beforeEach: start({ sit: true, map: 'travel' }, () => {
    doneScene('travel', 1);
    doneScene('travel', 2);
  }),
};
/** 상황 맵 · NEW 맵(카페)을 연 때 */
export const SituationNewMap: Story = { beforeEach: start({ sit: true, map: 'cafe' }) };
/** 상황 맵 · 비회원 */
export const SituationGuest: Story = { globals: { userKind: 'guest' }, beforeEach: start({ sit: true, map: 'travel' }) };
/** 일본어 — 표지만 있는 교재(과 목록 없음) */
export const Japanese: Story = { beforeEach: start({ lang: 'ja' }) };
/** 일본어 상황 맵 — 맵 없음 '커밍순' */
export const JapaneseSituation: Story = { beforeEach: start({ lang: 'ja', sit: true }) };
/** 중국어 — 교재 없음: 빈 섬 + '열리면 알림 받기' */
export const ChineseEmpty: Story = { beforeEach: start({ lang: 'zh' }) };
/** 책장이 통째로 빈 응답 */
export const EmptyShelf: Story = { parameters: { queries: [[bookShelfQuery().queryKey, [[], [], [], []]]] } };
/** 상황 맵이 하나도 없는 응답 */
export const EmptyMaps: Story = { beforeEach: start({ sit: true }), parameters: { queries: [[situationMapsQuery().queryKey, []]] } };
export const Loading: Story = { parameters: { api: { delayMs: LOADING_FOREVER } } };
export const Error: Story = { parameters: { api: { fail: ['books'] } } };
/** 상황 맵만 못 받음 */
export const SituationError: Story = { beforeEach: start({ sit: true }), parameters: { api: { fail: ['maps'] } } };
