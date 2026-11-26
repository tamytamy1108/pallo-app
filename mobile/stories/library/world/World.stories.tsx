import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { View } from 'react-native';

import { levelProgress } from '@/components/library/lib-panel';
import { LibraryWorld, type LibWorld } from '@/components/library/library-world';
import { FocusCard } from '@/components/library/world/focus-card';
import { MAP_PRESETS } from '@/components/library/world/presets';
import type { WorldSC } from '@/components/library/world/scenes';
import { LabelBody } from '@/components/library/world/world-labels';
import { WorldFlat } from '@/components/library/world/world-flat';
import { bookTag } from '@/data/library';

import { padded } from '../../_support/padded';
import { EN_BOOKS, sitMap } from '../_fixtures';

/** 스터디 맵 섬 줄 (라이브러리 탭과 같은 계산) — sel 은 팔로가 서는 섬 */
const studySC = (sel = 1): WorldSC =>
  Object.assign(
    EN_BOOKS.map((b): [string, string, string] => [bookTag(b), b.study ? levelProgress(b.study) : '커밍순', !b.study ? 'soon' : b.mine ? 'cur' : 'open']),
    { sel },
  );
/** 상황 맵 정류장 줄 — done 개 끝냄 · 다음이 지금 · lockFrom 번째부터 흐림 */
const sitSC = (id: string, done = 0, lockFrom = 99): WorldSC =>
  sitMap(id).scenes.map((s, i): [string, string, string] => [s.title, s.icon, !s.contentId || i + 1 >= lockFrom ? 'soon' : i < done ? 'done' : i === done ? 'cur' : 'open']);

const studyWorld: LibWorld = { slot: 'study', id: MAP_PRESETS['island-study'].build, sc: studySC(), order: -1 };
const travelWorld: LibWorld = { slot: 'sit:travel', id: MAP_PRESETS['island-travel'].build, sc: sitSC('travel', 1), order: 0 };

/**
 * 라이브러리 섬 지도 칸. 웹은 WebGL 이 있으면 3D(three.js)로 그리고, 없으면 2D 사진판(WorldFlat)으로 바뀐다 —
 * 헤드리스 · GPU 없는 브라우저에서는 2D 로 보인다. 2D 모양은 아래 Flat* 스토리에서 바로 본다.
 */
const meta = {
  title: 'Library/World',
  component: LibraryWorld,
  args: { world: studyWorld, warm: [], onOpen: fn(), visible: true },
  decorators: [padded],
} satisfies Meta<typeof LibraryWorld>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 3D 스터디 맵 (교재 섬) */
export const Study3D: Story = {};
/** 3D 상황 맵 (여행) */
export const Travel3D: Story = { args: { world: travelWorld } };

/** 2D 스터디 맵 사진판 — 지금 섬(노랑) · 커밍순 섬 */
export const FlatStudy: Story = { render: () => <WorldFlat id="study2" sc={studySC()} onOpen={fn()} /> };
/** 2D 상황 맵 사진판 — 여행 · 장면 1 끝냄, 2 지금 */
export const FlatTravel: Story = { render: () => <WorldFlat id="travel" sc={sitSC('travel', 1)} onOpen={fn()} /> };
/** 2D · 비회원 (둘째 장면부터 흐림) */
export const FlatTravelGuest: Story = { render: () => <WorldFlat id="travel" sc={sitSC('travel', 0, 2)} onOpen={fn()} /> };
/** 2D · 다른 맵 모양 (비즈니스 · 카페 · 캠퍼스) */
export const FlatBiz: Story = { render: () => <WorldFlat id="biz" sc={sitSC('biz', 2)} onOpen={fn()} /> };
export const FlatCafe: Story = { render: () => <WorldFlat id="cafe" sc={sitSC('cafe')} onOpen={fn()} /> };
export const FlatCampus: Story = { render: () => <WorldFlat id="campus" sc={sitSC('campus', 3)} onOpen={fn()} /> };
/** 사진이 없는 맵 · 정류장이 사진보다 많을 때 — 그린 2D 지도(예비) */
export const FlatDrawnFallback: Story = {
  render: () => <WorldFlat id="unknown" sc={[['Check-in', 'flag', 'done'], ['Lounge', 'cup', 'cur'], ['Boarding', 'run', 'open'], ['Duty Free', 'heart', 'soon'], ['Arrival', 'book', 'soon']]} onOpen={fn()} />,
};

/** 섬을 눌렀을 때 아래 카드 — 지금 · 끝낸 장면(다시 하기) · 곧 열림 · 교재 섬(버튼 글자 지정) */
export const Focus: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      {[
        { n: 'Hotel Check-in', st: 'cur', no: 2 },
        { n: 'Airport Lounge', st: 'done', no: 1 },
        { n: 'Night Market', st: 'soon', no: 5 },
        { n: 'Lv.2 DAILY', st: 'open', no: 3, k: '영어 교재', goT: '교재 보기' },
      ].map((info) => (
        <View key={info.n} style={{ height: 90 }}>
          <FocusCard info={info} onGo={fn()} onClose={fn()} />
        </View>
      ))}
    </View>
  ),
};

/** 지도 이름표 — 레벨(지금 · 열림 · 커밍순) · 지금 장면 태그 · 정류장 번호(멀리 / 확대 · 흐림) · '여기' */
export const Labels: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      <LabelBody spec={{ kind: 'lv', title: 'Lv.1', sub: '3/20과', st: 'cur' }} zoomed={false} />
      <LabelBody spec={{ kind: 'lv', title: 'Lv.2', sub: '0/20과', st: 'open' }} zoomed={false} />
      <LabelBody spec={{ kind: 'lv', title: 'Lv.0', sub: '커밍순', st: 'soon' }} zoomed={false} />
      <LabelBody spec={{ kind: 'tag', text: 'Hotel Check-in' }} zoomed={false} />
      <LabelBody spec={{ kind: 'min', num: 3, text: 'Night Market', soon: false }} zoomed={false} />
      <LabelBody spec={{ kind: 'min', num: 3, text: 'Night Market', soon: false }} zoomed />
      <LabelBody spec={{ kind: 'min', num: 6, text: 'Farewell', soon: true }} zoomed={false} />
      <LabelBody spec={{ kind: 'min', num: 6, text: 'Farewell', soon: true }} zoomed />
      <LabelBody spec={{ kind: 'here', text: 'HERE' }} zoomed={false} />
    </View>
  ),
};
