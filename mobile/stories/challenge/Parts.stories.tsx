import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { ChIcon } from '@/components/challenge/icons';
import { CapBar, Empty, Field, FieldLabel, IconLine, LgBtn, LgLink, Pills, SearchBox, Sec } from '@/components/challenge/parts';

import { padded } from '../_support/padded';

/** 챌린지 부품 — 버튼(LgBtn) 톤 · 흐림 · 아이콘 · 넓게 · 네모. 아래 스토리는 막대 · 제목 줄 · 링크 · 빈 안내 · 알약 · 입력칸 · 찾기 · 아이콘 줄. */
const meta = {
  title: 'Challenge/Parts',
  component: LgBtn,
  args: { label: '오늘 인증', onPress: fn() },
  decorators: [padded],
} satisfies Meta<typeof LgBtn>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BtnYellow: Story = {};
export const BtnPurple: Story = { args: { tone: 'purple', label: '참여하기' } };
export const BtnDone: Story = { args: { tone: 'done', label: '인증 완료' } };
export const BtnWhite: Story = { args: { tone: 'white', label: '나중에 할게요' } };
/** 흐림 (같은 표현이 있을 때) */
export const BtnOff: Story = { args: { off: true, label: '표현 챌린지 열기' } };
export const BtnIcon: Story = { args: { label: '문장 쓰기', padX: 11, icon: <ChIcon name="edit" size={15} /> } };
/** 아이콘만 네모 (찜 54 × 54) */
export const BtnSquare: Story = { args: { label: undefined, a11y: '찜', width: 54, height: 54, tone: 'white', icon: <ChIcon name="heart" size={22} /> } };
export const BtnWide: Story = { args: { label: '인증하기', wide: true, height: 52, fontSize: 15.5 } };
/** 긴 글자 — 한 줄로 잘린다 */
export const BtnLong: Story = { args: { label: '신청 완료 · 시작하면 알려 드려요 — 아주 긴 버튼 글자' } };

/** 진행 막대 — 0 · 반 · 꽉(분홍) · 넓게 */
export const CapBars: Story = {
  render: () => (
    <View style={{ gap: 10 }}>
      <CapBar cur={0} max={14} />
      <CapBar cur={7} max={14} />
      <CapBar cur={14} max={14} />
      <CapBar cur={5} max={14} width={200} />
    </View>
  ),
};

/** 묶음 제목 · 설명 · 오른쪽 링크 */
export const SectionTitle: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <Sec title="참여 중" />
      <Sec title="참여 중" sub="오늘 인증 2개 남았어요" />
      <Sec title="표현 챌린지" sub="나만의 문장 완성하기 · 3개" right={<LgLink label="모두 보기 ›" onPress={fn()} />} />
    </View>
  ),
};

export const EmptyText: Story = { render: () => <Empty>{'참여 중인 챌린지가 없어요.\n마음에 드는 챌린지에 참여해 보세요.'}</Empty> };

function PillsDemo({ multi }: { multi?: boolean }) {
  const [v, setV] = useState<string | string[]>(multi ? ['월', '수', '금'] : '7일');
  const opts = multi ? ['월', '화', '수', '목', '금', '토', '일'] : ['3일', '7일', '14일', '21일', '30일'];
  return (
    <Pills
      options={opts}
      value={v}
      multi={multi}
      onChange={(x) => setV((cur) => (Array.isArray(cur) ? (cur.includes(x) ? cur.filter((y) => y !== x) : [...cur, x]) : x))}
    />
  );
}
/** 알약 — 하나 고르기 · 여러 개 */
export const PillsSingle: Story = { render: () => <PillsDemo /> };
export const PillsMulti: Story = { render: () => <PillsDemo multi /> };

/** 입력칸 — 칸 이름 · 한 줄 · 여러 줄 */
export const Fields: Story = {
  render: () => (
    <View style={{ gap: 10 }}>
      <FieldLabel>챌린지 이름</FieldLabel>
      <Field placeholder="예) 하루 30분 걷기" />
      <Field value="매일 아침 일어나자마자 물 한 잔" onChangeText={fn()} />
      <FieldLabel>인증 안내</FieldLabel>
      <Field multiline placeholder="예) 걸음 수 캡처 + 한 줄" />
    </View>
  ),
};

function SearchDemo({ initial }: { initial: string }) {
  const [q, setQ] = useState(initial);
  return <SearchBox value={q} onChangeText={setQ} placeholder="표현 찾기" label="표현 찾기" />;
}
export const Search: Story = { render: () => <SearchDemo initial="" /> };
export const SearchFilled: Story = { render: () => <SearchDemo initial="on the fence" /> };

/** 아이콘 + 글 한 줄 */
export const IconLines: Story = {
  render: () => (
    <View style={{ gap: 6 }}>
      <IconLine icon="cal" text="14일 · 매일" />
      <IconLine icon="cam" text="사진 인증" />
      <IconLine icon="cmt" text="댓글 인증" />
      <IconLine icon="book" text="Lv.1 · 6챕터 No Spoilers! — 아주 긴 출처 글자가 들어가면 어떻게 되는지" />
    </View>
  ),
};
