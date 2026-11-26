import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { MonthCalendar, MultiPills, PlacePicker, PosterPicker, TimeChips, type Place } from '@/components/event/form-parts';
import { PLACE_SPOTS } from '@/data/events';
import { WEEK } from '@/data/meet';

import { padded } from '../_support/padded';
import { sampleImage } from './_fixtures';

/*
 * 만들기 · 제안 폼 조각 — 상태를 들고 그려서 눌러 볼 수 있다.
 */

function Posters({ initial, max }: { initial: string[]; max?: number }) {
  const [u, setU] = useState(initial);
  return <PosterPicker uris={u} onChange={setU} max={max} />;
}

const PICS = [sampleImage('#FFE200', 'ONE'), sampleImage('#8FA6DC', 'TWO'), sampleImage('#D0798E', 'THREE')];

/** 포스터 여러 장 — 첫 장이 대표 · 누르면 대표로 · × 빼기 · 다 차면 + 칸이 사라진다 */
const meta = {
  title: 'Event/FormParts',
  component: Posters,
  args: { initial: [] },
  decorators: [padded],
} satisfies Meta<typeof Posters>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PostersEmpty: Story = {};
export const PostersSome: Story = { args: { initial: PICS } };
/** 최대 장수 다 참 (+ 칸 없음) */
export const PostersFull: Story = { args: { initial: PICS, max: 3 } };
/** 사진 한 장만 (max 1 · 대표 표시 없음) */
export const PhotoSingle: Story = { args: { initial: PICS.slice(0, 1), max: 1 } };

function Places({ region, initial }: { region: string; initial: Place | null }) {
  const [p, setP] = useState(initial);
  return <PlacePicker region={region} value={p} onChange={setP} />;
}
const SEOUL0 = PLACE_SPOTS['서울'][0];

/** 장소 · 닫힘 (아직 안 고름) */
export const PlaceEmpty: Story = { render: () => <Places region="서울" initial={null} /> };
/** 장소 · 닫힘 (고름 → '바꾸기') */
export const PlaceChosen: Story = { render: () => <Places region="서울" initial={{ name: SEOUL0[0], addr: SEOUL0[2] }} /> };
/** 장소 · 지도 열림 (물가 있는 지역) — 눌러서 연다 */
export const PlaceMapOpen: Story = {
  render: () => <Places region="서울" initial={null} />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByText('지도에서 장소 고르기'));
    await expect(within(canvasElement).getByText('서울 지도')).toBeTruthy();
  },
};
/** 장소 · 지도 열림 + 고른 핀 (이름표) — 물 없는 지역 */
export const PlaceMapSelected: Story = {
  render: () => <Places region="대전" initial={{ name: PLACE_SPOTS['대전'][1][0], addr: PLACE_SPOTS['대전'][1][2] }} />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByText('바꾸기'));
  },
};

function Calendar({ initial }: { initial: string }) {
  const [d, setD] = useState(initial);
  return <MonthCalendar value={d} onChange={setD} minDays={7} maxDays={90} hint="1주 뒤부터 3달 안에서 골라요" pick={(x) => `${x.getMonth() + 1}월 ${x.getDate()}일 (${WEEK[x.getDay()]}) 희망`} />;
}
const iso = (days: number) => {
  const t = new Date();
  t.setDate(t.getDate() + days);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
};

/** 달력 · 안 고름 (오늘이 있는 달부터 · 오늘은 고를 수 없어도 연보라 테두리로 표시 · 1주 안 날짜는 흐림 · 이전 달 막힘) */
export const CalendarEmpty: Story = { render: () => <Calendar initial="" /> };
/** 달력 · 고름 */
export const CalendarPicked: Story = { render: () => <Calendar initial={iso(10)} /> };

function Pills({ initial }: { initial: string[] }) {
  const [v, setV] = useState(initial);
  return <MultiPills options={['영어', '일본어', '중국어', '스페인어', '프랑스어', '독일어']} value={v} onChange={setV} label="언어" />;
}
/** 여러 개 고르는 알약 · 없음 / 몇 개 */
export const MultiPillsNone: Story = { render: () => <Pills initial={[]} /> };
export const MultiPillsSome: Story = { render: () => <Pills initial={['영어', '중국어']} /> };

function Times({ initial }: { initial: string }) {
  const [t, setT] = useState(initial);
  return <TimeChips times={['10:00', '11:30', '13:00', '14:30', '17:00', '19:00', '19:30', '21:00']} value={t} onChange={setT} />;
}
/** 시간 칩 · 안 고름 / 고름 (가운데로) */
export const TimesNone: Story = { render: () => <Times initial="" /> };
export const TimesPicked: Story = { render: () => <Times initial="19:30" /> };
