import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { userEvent, within } from 'storybook/test';

import ListeningScreen from '@/app/(app)/listening';
import { setListenPrefs } from '@/components/library/listen-prefs';
import { setNoListen } from '@/state/learn-prefs';

import { LOADING_FOREVER } from '../../_support/api';
import { freshDevice } from '../../_support/fresh-device';

const at = (params: Record<string, string>) => ({ route: { pathname: '/listening', params } });

/**
 * 리스닝 룸 (/listening) — 붙어 있는 보라 재생 카드 · 설정 칩 · 재생 목록 칩 · 문장 줄.
 * 주소로 무엇을 들을지 고른다: ?unit=1-1 (과) · ?level=1 (레벨 전체) · ?map=travel (상황 맵 전체) · ?key=travel-1 (장면).
 * 제목은 책장 · 맵 응답에서, 문장은 앱에 든 값에서 와서 — 불러오는 중 · 오류여도 문장은 보이고 제목만 빈다.
 */
const meta = {
  title: 'Pages/Listening',
  component: ListeningScreen,
  parameters: at({ unit: '1-1' }),
  beforeEach: freshDevice(),
} satisfies Meta<typeof ListeningScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Lv.1 1과 (패턴 예문 · 대화문 · Bank) */
export const Unit: Story = {};
/** Lv.3 토픽 #101 */
export const UnitLevel3: Story = { parameters: at({ unit: '3-101' }) };
/** Lv.1 전체 (데이터가 든 과만) */
export const Level: Story = { parameters: at({ level: '1' }) };
/** 상황 맵 '여행' 전체 */
export const Map: Story = { parameters: at({ map: 'travel' }) };
/** 상황 장면 하나 (공항 체크인) */
export const Scene: Story = { parameters: at({ key: 'travel-1' }) };
/** 문장이 없는 과 — '문장이 없어요' · 0/0 */
export const NoItems: Story = { parameters: at({ unit: '1-9' }) };
/** 주소 값 없음 — 제목 · 문장 모두 빔 */
export const NoSource: Story = { parameters: at({}) };

/** 설정: 영어 가리기 — 문장이 흐려지고 눌러서 보기 */
export const Blind: Story = { beforeEach: freshDevice(() => setListenPrefs({ blind: true })) };
/** 설정을 모두 바꾼 모습 — 자동 재생 끔 · 영어만 · 따라 말하기 4초 · 3번 · 빠르게 · 섞기 */
export const CustomPrefs: Story = {
  beforeEach: freshDevice(() => setListenPrefs({ auto: false, order: 'en', gap: 4, rep: 3, rate: 1.15, shuf: true })),
};
/** 소리 끄기(15분) — 위 스피커 꺼짐 · 영어 가리기가 풀림 */
export const SoundOff: Story = {
  beforeEach: freshDevice(() => {
    setListenPrefs({ blind: true });
    setNoListen(true);
    return () => setNoListen(false);
  }),
};
/** 재생 목록 '저장한 문장' 칩을 고른 모습 */
export const SavedFilter: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('button', { name: /저장한 문장/ }));
  },
};

/** 책장 불러오는 중 — 제목이 빈 채 (문장은 그대로) */
export const Loading: Story = { parameters: { ...at({ unit: '1-1' }), api: { delayMs: LOADING_FOREVER } } };
/** 책장 · 맵 오류 — 제목 · 상황 맵 문장이 빔 */
export const Error: Story = { parameters: { ...at({ map: 'travel' }), api: { fail: ['books', 'maps'] } } };
