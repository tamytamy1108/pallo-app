import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { StyleSheet, View } from 'react-native';
import { fn } from 'storybook/test';

import { SheetButton, SheetDesc, SheetOptions } from '@/components/common/sheet-parts';
import { Sheet, SheetBottom } from '@/components/ui/sheet';
import { TextField } from '@/components/ui/field';
import { PText } from '@/components/ui/text';
import { Colors, Spacing } from '@/constants/theme';

import { behindSheet } from './_overlay';

const styles = StyleSheet.create({ flex: { flex: 1 } });

const OPTIONS = [
  { key: 'a', label: '이번 주 금요일 20:00', sub: '하남점 · 3자리 남음' },
  { key: 'b', label: '이번 주 토요일 14:00', sub: '하남점 · 마감 임박' },
  { key: 'c', label: '다음 주 화요일 19:30', sub: '하남점 · 여유 있음' },
];

const LONG = Array.from({ length: 14 }, (_, i) => (
  <PText key={i}>{`${i + 1}. 길게 이어지는 내용이에요 — 시트는 최대 92% 까지 커지고 안에서 스크롤해요.`}</PText>
));

/**
 * 아래에서 올라오는 시트 — 크림 · 위 모서리 28 · 손잡이. 아래 고정 버튼(footer)은 버튼마다 칸을 똑같이 나눠요.
 * tall 은 화면 84% 고정, scroll=false 는 안쪽 목록이 따로 스크롤하는 시트(댓글 창).
 */
const meta = {
  title: 'UI/Sheet',
  component: Sheet,
  args: {
    open: true,
    onClose: fn(),
    title: '언제 올까요?',
    children: (
      <>
        <SheetDesc>고른 시간에 자리를 맡아 둘게요.</SheetDesc>
        <SheetOptions radio items={OPTIONS} selected="a" onPick={fn()} />
      </>
    ),
  },
  decorators: [behindSheet],
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 제목 · 내용만 (버튼 없음) */
export const Default: Story = {};
/** 아래 고정 버튼 하나 */
export const FooterOne: Story = { args: { footer: <SheetButton label="신청하기" size="foot" onPress={fn()} /> } };
/** 아래 고정 버튼 둘 — 칸을 반씩 */
export const FooterTwo: Story = {
  args: {
    footer: (
      <>
        <SheetButton label="닫기" tone="white" onPress={fn()} />
        <SheetButton label="신청하기" onPress={fn()} />
      </>
    ),
  },
};
/** 고정 칸 안 버튼이 꺼지면 흐려요 */
export const FooterDisabled: Story = { args: { footer: <SheetButton label="신청하기" size="foot" disabled onPress={fn()} /> } };
/** 제목 없이 */
export const NoTitle: Story = { args: { title: undefined, label: '안내' } };
/** 내용이 길면 시트 안에서 스크롤 */
export const LongContent: Story = { args: { title: '이용 규칙', children: <>{LONG}</>, footer: <SheetButton label="확인했어요" size="foot" onPress={fn()} /> } };
/** 키 큰 시트 (84% 고정) */
export const Tall: Story = { args: { tall: true, title: '새 글 쓰기', children: <TextField label="내용" multiline placeholder="무슨 이야기를 할까요?" /> } };
/** 스크롤 없이 + 아래 붙은 입력 줄 (댓글 창 모양 · SheetBottom) */
export const TallNoScroll: Story = {
  args: {
    tall: true,
    scroll: false,
    title: '댓글',
    children: (
      <View style={styles.flex}>
        <View style={styles.flex}>
          <PText color={Colors.inkSub}>안쪽 목록이 따로 스크롤해요.</PText>
        </View>
        <SheetBottom base={14}>
          <TextField variant="round" placeholder="대화에 참여하세요…" />
        </SheetBottom>
      </View>
    ),
  },
};
/** 바깥 누르기 · 끌어내리기로 안 닫혀요 (모양은 같아요) */
export const NotDismissible: Story = { args: { dismissible: false, footer: <SheetButton label="확인" size="foot" onPress={fn()} /> } };
/** 내용 간격 넓게 (gap 24) */
export const WideGap: Story = { args: { gap: Spacing.feed + 2 } };
