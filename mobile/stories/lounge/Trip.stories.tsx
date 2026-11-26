import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { AbroadRegSheet, CheckBoxList, CheckRow, Field, PeopleRow, PersonSheet, Pills, TripCard, TripMakeSheet, WorldMapCard } from '@/components/lounge/trip';
import { LG_C, LG_PEOPLE, LG_SAFE, LG_STY, type Trip } from '@/data/lounge';
import { closeTrip, setCountry, setTripState } from '@/data/lounge-store';
import { getMe } from '@/state/me';

import { padded } from '../_support/padded';
import { feedItem, isoDay, setup } from './_fixtures';

const t1 = feedItem('t1', 'trip');
/** 날짜를 오늘 기준으로 (D-n 이 늘 같게) */
const trip = (patch: Partial<Trip> = {}, from = 5): Trip => ({ ...t1, from: isoDay(from), to: isoDay(from + 3), ...patch });
const mine = (patch: Partial<Trip> = {}) => trip({ id: 'sb-mine', who: getMe().name, av: LG_C.y, br: getMe().branch, mine: true, ...patch });

/**
 * 해외 동행 탭 부품. TripCard = 여행 동행 탑승권 — 버튼이 상태마다 바뀐다:
 * 동행 신청 · 수락 기다리는 중 · 오픈채팅 열기 · 모집 마감(꽉 참) · 모집 닫기(내 글) · 모집 닫음(내 글 닫음).
 */
const meta = {
  title: 'Lounge/Trip',
  component: TripCard,
  args: { p: trip() },
  decorators: [padded],
  beforeEach: setup(),
} satisfies Meta<typeof TripCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 모집 중 — 동행 신청 */
export const CardOpen: Story = {};
export const CardDDay: Story = { args: { p: trip({}, 0) } };
/** 신청함 — 수락 기다리는 중 */
export const CardWaiting: Story = { beforeEach: setup(() => setTripState('t1', 'wait')) };
/** 수락됨 — 오픈채팅 · 인원 +1 */
export const CardAccepted: Story = { beforeEach: setup(() => setTripState('t1', 'ok')) };
/** 꽉 참 — 모집 마감 · 흑백 */
export const CardFull: Story = { args: { p: trip({ id: 't4', cur: 3, cap: 3 }) } };
/** 꽉 찼지만 내가 수락됨 — 흐리지 않고 오픈채팅 */
export const CardFullAccepted: Story = { args: { p: trip({ cur: 2, cap: 3 }) }, beforeEach: setup(() => setTripState('t1', 'ok')) };
/** 내 동행 글 — 모집 닫기 */
export const CardMine: Story = { args: { p: mine() } };
/** 내 글 닫음 — 모집 닫음(끔) · 흑백 */
export const CardMineClosed: Story = { args: { p: mine({ closed: true }) } };
/** 글쓴이가 닫음 */
export const CardClosed: Story = { args: { p: trip({ closed: true }) }, beforeEach: setup(() => closeTrip('t1', true)) };
/** 긴 제목 · 스타일 많음 */
export const CardLong: Story = { args: { p: trip({ title: '도쿄 라멘 투어하고 시부야 야경까지 같이 볼 동행 구해요 (일본어 연습 환영)', styles: [...LG_STY] }) } };

/** 세계 지도 — 해외살이 (보라 스파크) */
export const MapLive: Story = { render: () => <WorldMapCard mode="live" /> };
/** 세계 지도 — 여행 동행 (분홍 스파크) */
export const MapTrip: Story = { render: () => <WorldMapCard mode="trip" /> };
/** 나라를 고르면 그 나라로 확대 */
export const MapCountry: Story = { beforeEach: setup(() => setCountry('JP')), render: () => <WorldMapCard mode="trip" /> };

/** 해외 사람 줄 — 맨 앞 '나도 해외에 있어요' */
export const People: Story = { render: () => <PeopleRow people={LG_PEOPLE} onAdd={fn()} onPick={fn()} /> };
/** 내 카드가 있으면 '나도 해외에 있어요' 칸이 없고 '나' 표시 */
export const PeopleWithMe: Story = {
  render: () => <PeopleRow people={[{ n: getMe().name, cc: 'AU', city: '브리즈번', since: '2개월째', job: '워홀 · 카페', br: getMe().branch, av: LG_C.y, me: true }, ...LG_PEOPLE]} onAdd={fn()} onPick={fn()} />,
};
export const PeopleEmpty: Story = { render: () => <PeopleRow people={[]} onAdd={fn()} onPick={fn()} /> };

/** 사람 카드 시트 — 질문 보내기 */
export const PersonOther: Story = { render: () => <PersonSheet p={LG_PEOPLE[0]} onClose={fn()} /> };
/** 내 카드 시트 — 내 카드 내리기 */
export const PersonMe: Story = { render: () => <PersonSheet p={{ ...LG_PEOPLE[0], n: getMe().name, me: true }} onClose={fn()} /> };

/** 동행 구하기 시트 */
export const MakeTrip: Story = { render: () => <TripMakeSheet open onClose={fn()} /> };
/** 나도 해외에 있어요 시트 */
export const RegAbroad: Story = { render: () => <AbroadRegSheet open onClose={fn()} /> };

function PillsDemo({ multi }: { multi?: boolean }) {
  const [on, setOn] = useState<string[]>(multi ? ['맛집', '사진'] : ['맛집']);
  return <Pills multi={multi} opts={LG_STY} on={on} onPick={(v) => setOn((L) => (multi ? (L.includes(v) ? L.filter((x) => x !== v) : [...L, v]) : [v]))} />;
}
/** 알약 고르기 — 하나 · 여러 개 */
export const PillsSingle: Story = { render: () => <PillsDemo /> };
export const PillsMulti: Story = { render: () => <PillsDemo multi /> };

/** 입력칸 — 비었음 · 채움 · 긴 글(줄 바뀜) */
export const Fields: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <Field label="도시" value="" onChange={fn()} placeholder="예) 브리즈번" />
      <Field label="제목" value="오사카 맛집 투어 같이 가요" onChange={fn()} />
      <Field label="제목" value="오사카 맛집 투어 같이 가요. 도톤보리에서 저녁 먹고 신세카이까지 걸어가요. 일본어로 주문해 봐요!" onChange={fn()} />
    </View>
  ),
};

/** 체크 줄 상자 (안전 약속) — 일부 체크 */
export const CheckRows: Story = {
  render: () => (
    <CheckBoxList>
      {LG_SAFE.map((t, i) => (
        <CheckRow key={t} text={t} on={i < 2} onPress={fn()} first={i === 0} />
      ))}
    </CheckBoxList>
  ),
};
