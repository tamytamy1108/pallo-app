import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { fn } from 'storybook/test';

import { LgIcon } from '@/components/common/icons';
import { FieldLabel, SheetButton, SheetButtons, SheetDesc, SheetLink, SheetNote, SheetOptions, SheetPills, type SheetButtonSize, type SheetButtonTone } from '@/components/common/sheet-parts';
import { Colors, Spacing } from '@/constants/theme';

import { padded } from '../_support/padded';

const TONES: SheetButtonTone[] = ['yellow', 'white', 'purple', 'dark', 'bad'];
const SIZES: SheetButtonSize[] = ['inline', 'pair', 'foot'];
const MENU = [
  { key: 'link', label: '링크 복사' },
  { key: 'report', label: '신고하기', sub: '매니저가 24시간 안에 확인해요', bad: true },
  { key: 'block', label: '하나 차단하기', sub: '서로의 글이 더 이상 보이지 않아요', bad: true },
];
const BRANCHES = [
  { key: 'hanam', label: '하남점', sub: '경기 하남시 미사강변대로 · 2층' },
  { key: 'jamsil', label: '잠실점', sub: '서울 송파구 올림픽로 · 5층' },
  { key: 'hongdae', label: '홍대점', sub: '서울 마포구 양화로 · 3층' },
];
const LANGS = ['영어', '일본어', '중국어', '스페인어', '프랑스어', '독일어'] as const;

/**
 * 시트 안에서 자주 쓰는 조각 — 버튼(tone 5 × size 3 · 꺼짐) · 줄 목록(메뉴 · 하나 고르기) · 알약 줄 · 설명 · 링크.
 * 시트 밖에 그려서 모양만 봐요 (시트 안 모습은 UI/Sheet).
 */
const meta = {
  title: 'Common/SheetParts',
  component: SheetButton,
  args: { label: '신청하기', onPress: fn() },
  argTypes: { tone: { control: 'inline-radio', options: TONES }, size: { control: 'inline-radio', options: SIZES } },
  decorators: [padded],
} satisfies Meta<typeof SheetButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ButtonYellow: Story = {};
export const ButtonWhite: Story = { args: { tone: 'white', label: '닫기' } };
export const ButtonPurple: Story = { args: { tone: 'purple', label: '참여하기' } };
export const ButtonDark: Story = { args: { tone: 'dark', label: '완료' } };
export const ButtonBad: Story = { args: { tone: 'bad', label: '차단하기' } };
export const ButtonDisabled: Story = { args: { disabled: true } };
export const ButtonBadDisabled: Story = { args: { tone: 'bad', label: '차단하기', disabled: true } };
export const ButtonWithIcon: Story = { args: { label: '지점에 전화하기', tone: 'white', icon: <LgIcon name="phone" size={18} /> } };
export const ButtonLongLabel: Story = { args: { label: '아주 긴 버튼 글자는 한 줄에서 말줄임으로 잘려요 확인용 글자' } };

/** 색 × 크기 비교 (꺼짐 포함) */
export const ButtonMatrix: Story = {
  render: () => (
    <View style={styles.col}>
      {SIZES.map((size) => (
        <View key={size} style={styles.col}>
          <FieldLabel>{size}</FieldLabel>
          {TONES.map((tone) => (
            <SheetButton key={tone} label={`${tone} · ${size}`} tone={tone} size={size} onPress={fn()} />
          ))}
          <SheetButton label={`disabled · ${size}`} size={size} disabled onPress={fn()} />
        </View>
      ))}
    </View>
  ),
};

/** 두 개 나란히 */
export const ButtonPair: Story = {
  render: () => (
    <SheetButtons>
      <SheetButton label="나중에 할게요" tone="white" style={styles.flex} onPress={fn()} />
      <SheetButton label="체험 상담 신청" style={styles.flex} onPress={fn()} />
    </SheetButtons>
  ),
};

/** 줄 목록 · 메뉴 (신고 · 차단은 빨간 글씨) */
export const OptionsMenu: Story = { render: () => <SheetOptions items={MENU} onPick={fn()} /> };
/** 줄 목록 · 하나 고르기 — 아무것도 안 고름 */
export const OptionsRadioNone: Story = { render: () => <SheetOptions radio items={BRANCHES} selected={null} onPick={fn()} /> };
/** 줄 목록 · 하나 고르기 — 고른 줄은 연보라 */
export const OptionsRadioSelected: Story = { render: () => <SheetOptions radio items={BRANCHES} selected="jamsil" onPick={fn()} /> };
/** 작은 설명 굵게 (체험 지점 주소) */
export const OptionsSubStrong: Story = { render: () => <SheetOptions radio subStrong items={BRANCHES} selected="hanam" onPick={fn()} /> };
/** 눌러서 고르기 */
export const OptionsInteractive: Story = {
  render: function Render() {
    const [v, setV] = useState<string | null>(null);
    return <SheetOptions radio items={BRANCHES} selected={v} onPick={setV} />;
  },
};

/** 알약 줄 — 안 고름 */
export const PillsNone: Story = { render: () => <SheetPills options={LANGS} value={null} onChange={fn()} label="언어" /> };
/** 알약 줄 — 고름 (보라) */
export const PillsSelected: Story = { render: () => <SheetPills options={LANGS} value="일본어" onChange={fn()} label="언어" /> };
export const PillsInteractive: Story = {
  render: function Render() {
    const [v, setV] = useState<(typeof LANGS)[number] | null>(null);
    return <SheetPills options={LANGS} value={v} onChange={setV} label="언어" />;
  },
};

/** 설명 · 작은 안내 · 이름표 · 링크 */
export const Texts: Story = {
  render: () => (
    <View style={styles.col}>
      <FieldLabel>이름표 (FieldLabel)</FieldLabel>
      <SheetDesc>설명 한 줄 (SheetDesc) — 신고한 사람은 상대에게 알려지지 않아요. 길어지면 낱말 단위로 줄이 바뀌어요.</SheetDesc>
      <SheetDesc center>가운데 정렬 설명</SheetDesc>
      <SheetNote>작은 안내 (SheetNote) — 차단 · 신고 시 지점에도 보고돼요.</SheetNote>
      <SheetLink label="보라 링크 (SheetLink)" onPress={fn()} />
      <SheetLink label="회색 링크" color={Colors.inkSub} onPress={fn()} />
    </View>
  ),
};

const styles = StyleSheet.create({
  col: { gap: Spacing.tight },
  flex: { flex: 1 },
});
