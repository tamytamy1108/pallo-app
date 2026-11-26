import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { fn, userEvent, within } from 'storybook/test';

import type { BranchOption, LatLng } from '@/api/onboarding';
import { branchOptionsQuery } from '@/api/queries';
import { BranchPicker, BranchSheet, type BranchPurpose } from '@/components/onboarding/branch-sheet';

import { LOADING_FOREVER } from '../_support/api';
import { padded } from '../_support/padded';

function PickerDemo({ initial, purpose = 'trial', near = null }: { initial: string | null; purpose?: BranchPurpose; near?: LatLng | null }) {
  const [value, setValue] = useState(initial);
  return <BranchPicker value={value} purpose={purpose} near={near} onPick={(b) => setValue(b.code)} />;
}

/** 내 위치 (서울시청) */
const ME: LatLng = { lat: 37.5665, lng: 126.978 };
const NEAR_KEY = branchOptionsQuery(ME).queryKey;

const KEY = branchOptionsQuery().queryKey;
const b = (code: string, name: string, region: string | null, over: Partial<BranchOption> = {}): BranchOption => ({ code, name, region, status: 'ACTIVE', linkStatus: null, distanceMeters: null, direction: null, ...over });

/** 서버가 가까운 순으로 준 목록 — 바로 옆(방위 없음) · 1km 안 · 10km 안 · 멀리 · 쉬는 지점 · 좌표 없는 지점(맨 뒤) */
const NEAREST: BranchOption[] = [
  b('CITYHALL', '시청점', '서울', { distanceMeters: 40, direction: null }),
  b('JONGNO', '종로점', '서울', { distanceMeters: 640, direction: 'NE' }),
  b('HONGDAE', '홍대점', '서울', { distanceMeters: 5320, direction: 'W' }),
  b('GANGNAM', '강남점', '서울', { distanceMeters: 8793, direction: 'SE' }),
  b('PANGYO', '판교점', '경기', { distanceMeters: 18210, direction: 'SE', status: 'PAUSED' }),
  b('HANAM', '하남점', '경기', { distanceMeters: 20021, direction: 'E' }),
  b('BUSAN', '부산서면점', '부산', { distanceMeters: 325400, direction: 'SE' }),
  b('POPUP', '팝업 스튜디오 경기 남양주 다산신도시 현대프리미어캠퍼스점', '경기'),
];

/** 서버 지점 — 연동됨 · 확인 중 · 휴업이 섞이고, 지역이 여섯 개 + 지역 없는 지점 */
const MIXED: BranchOption[] = [
  b('GANGNAM', '강남점', '서울', { linkStatus: 'linked' }),
  b('HONGDAE', '홍대점', '서울', { linkStatus: 'pending' }),
  b('JAMSIL', '잠실점', '서울'),
  b('HANAM', '하남점', '경기'),
  b('PANGYO', '판교점', '경기', { status: 'PAUSED' }),
  b('CHEONAN', '천안점', '충남'),
  b('DAEJEON', '대전둔산점', '대전'),
  b('DAEGU', '대구동성로점', '대구'),
  b('BUSAN', '부산서면점', '부산'),
  b('POPUP', '팝업 스튜디오 경기 남양주 다산신도시 현대프리미어캠퍼스점', null),
];

/** 지점 목록 시트 — 검색 · 지역 탭 · 지역별 묶음 카드 (GET /branches). 고르면 닫혀요 (가입 연동 · 체험 예약) */
const meta = {
  title: 'Onboarding/BranchSheet',
  component: BranchSheet,
  args: { open: true, onClose: fn(), title: '체험할 지점을 골라요', value: '', onPick: fn(), purpose: 'trial' },
} satisfies Meta<typeof BranchSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};
/** 이미 고른 지점 — 라벤더 줄 · 보라 체크 */
export const OpenWithValue: Story = { args: { value: '하남점', title: '다니는 지점을 골라요', purpose: 'link' } };

/** 시트 없이 본문만 (눌러서 골라 보기) */
export const Picker: Story = { decorators: [padded], render: () => <PickerDemo initial={null} /> };
export const PickerSelected: Story = { decorators: [padded], render: () => <PickerDemo initial="하남점" /> };
/** 지역 탭 '경기' */
export const PickerRegionTab: Story = {
  decorators: [padded],
  render: () => <PickerDemo initial={null} />,
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('tab', { name: /경기/ }));
  },
};
/** 검색 — 일부만 남음 */
export const PickerSearch: Story = {
  decorators: [padded],
  render: () => <PickerDemo initial={null} />,
  play: async ({ canvasElement }) => {
    await userEvent.type(await within(canvasElement).findByLabelText('지점 이름으로 찾기'), '천안');
  },
};
/** 검색 결과 없음 */
export const PickerNoResult: Story = {
  decorators: [padded],
  render: () => <PickerDemo initial={null} />,
  play: async ({ canvasElement }) => {
    await userEvent.type(await within(canvasElement).findByLabelText('지점 이름으로 찾기'), '없는지점');
  },
};
/** 연동 요청 시트 — 이미 연동된 · 확인 중인 지점은 흐리게 막고 이유. 지역 탭이 많아 옆으로 밀어요, 지역 없는 지점은 '기타' */
export const LinkBlocked: Story = { decorators: [padded], parameters: { queries: [[KEY, MIXED]] }, render: () => <PickerDemo initial={null} purpose="link" /> };
/** 체험 시트 — 같은 목록에서 쉬는 지점만 막아요 (연동 상태는 상관없어요) */
export const TrialBlocked: Story = { decorators: [padded], parameters: { queries: [[KEY, MIXED]] }, render: () => <PickerDemo initial={null} purpose="trial" /> };
/** 내 위치를 받음 — 전체 탭은 '가까운 순' 한 묶음, 지점마다 방향 화살표 · '남동쪽 8.8km'. 좌표 없는 지점은 맨 뒤 빈 동그라미 */
export const PickerNearest: Story = { decorators: [padded], parameters: { queries: [[NEAR_KEY, NEAREST]] }, render: () => <PickerDemo initial="강남점" near={ME} /> };
/** 내 위치 + 지역 탭 '경기' — 그 지역 안에서 가까운 순 */
export const PickerNearestRegion: Story = {
  decorators: [padded],
  parameters: { queries: [[NEAR_KEY, NEAREST]] },
  render: () => <PickerDemo initial={null} near={ME} />,
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('tab', { name: /경기/ }));
  },
};
/** 내 위치 — 가짜 서버(이름으로 정한 수도권 좌표)가 거리를 계산 */
export const PickerNearestMock: Story = { decorators: [padded], render: () => <PickerDemo initial={null} near={ME} /> };
/** 지점이 하나도 없음 */
export const PickerEmpty: Story = { decorators: [padded], parameters: { queries: [[KEY, []]] }, render: () => <PickerDemo initial={null} /> };
export const PickerLoading: Story = { decorators: [padded], parameters: { api: { delayMs: LOADING_FOREVER } }, render: () => <PickerDemo initial={null} /> };
export const PickerError: Story = { decorators: [padded], parameters: { api: { fail: ['branchOptions'] } }, render: () => <PickerDemo initial={null} /> };
