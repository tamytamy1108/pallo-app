import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { StudyMap } from '@/components/home/study-map';
import { chestKey, markChestOpened } from '@/state/chest';
import { markDone, savePos, setLastStep, stepKey } from '@/state/progress';

import { padded } from '../_support/padded';
import { homeDevice, levelStepIds, unitStepKeys } from './_home';

const doneFirst = (n: number) => () => unitStepKeys(1, 1).slice(0, n).forEach((k) => markDone(k));

/**
 * 홈 스터디 맵 — 계절 장식(봄 · 여름 · 가을 · 겨울 · 크리스마스 11.22~12.31) · 진도(끝낸 정류장) · 지금 정류장(캐릭터) ·
 * 보상 상자(잠김 → 열 수 있음 → 열었음) · 비회원 잠긴 챕터. 진도는 라이브러리와 같은 기록(state/progress).
 */
const meta = {
  title: 'Home/StudyMap',
  component: StudyMap,
  decorators: [padded],
  globals: { userKind: 'member' },
} satisfies Meta<typeof StudyMap>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 처음 — Lv.1 1과 · 첫 정류장 · 계절은 기기 날짜 */
export const Default: Story = { beforeEach: homeDevice() };
export const Spring: Story = { beforeEach: homeDevice({ season: 'spring' }) };
export const Summer: Story = { beforeEach: homeDevice({ season: 'summer' }) };
export const Autumn: Story = { beforeEach: homeDevice({ season: 'autumn' }) };
export const Winter: Story = { beforeEach: homeDevice({ season: 'winter' }) };
/** 크리스마스 — 짙은 초록 · 별 · 전구 가랜드 · 눈 언덕 */
export const Christmas: Story = { beforeEach: homeDevice({ season: 'xmas' }) };

/** 3단계 끝냄 — 넷째 정류장에 캐릭터 */
export const InProgress: Story = { beforeEach: homeDevice({ season: 'spring' }, doneFirst(3)) };
/** 마지막으로 연 단계(대화문)에 멈춤 — 맵이 그 정류장에서 시작 */
export const ResumeLast: Story = {
  beforeEach: homeDevice({ season: 'spring' }, () => {
    doneFirst(1)();
    setLastStep(1, 1, 'dlg');
    savePos(stepKey(1, 1, 'dlg'), 3, 9);
  }),
};
/** 다 끝냄 — 보상 상자 '열 수 있어요' */
export const AllDone: Story = { beforeEach: homeDevice({ season: 'spring' }, doneFirst(99)) };
/** 상자까지 연 과 — 열린 상자 (상자 기록은 이 탭을 새로고침할 때까지 남음) */
export const ChestOpened: Story = {
  beforeEach: homeDevice({ season: 'spring' }, () => {
    doneFirst(99)();
    markChestOpened(chestKey(1, 1));
  }),
};
/** Lv.3 토픽형 (#101 칩) — 마지막으로 연 단계가 Lv.3 */
export const Level3: Story = { beforeEach: homeDevice({ season: 'autumn' }, () => setLastStep(3, 101, levelStepIds(3)[0])) };
/** Lv.4 토론형 (1회 · 2회 칩) */
export const Level4: Story = { beforeEach: homeDevice({ season: 'winter' }, () => setLastStep(4, 101, levelStepIds(4)[0])) };

/** 비회원 — 둘째 챕터부터 자물쇠 */
export const Guest: Story = { globals: { userKind: 'guest' }, beforeEach: homeDevice({ season: 'spring' }) };
