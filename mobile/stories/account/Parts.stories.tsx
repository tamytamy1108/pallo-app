import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { fn } from 'storybook/test';

import { AccountPage, Bar, Box, ChoiceChip, Head, Icon, Lift, TextLink, Toggle, UnderTabs, type IconName } from '@/components/account/parts';
import { Button } from '@/components/ui/button';
import { PText } from '@/components/ui/text';
import { Colors } from '@/constants/theme';

import { padded } from '../_support/padded';

/** 마이 B 화면 부품 — 아이콘 · 카드(Box) · 섹션 제목 · 글자 링크 · 켜고 끄기 · 고르는 칩 · 밑줄 탭 · 그림자 · 화면 틀. */
const meta = {
  title: 'Account/Parts',
  component: Toggle,
  args: { value: true },
  decorators: [padded],
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

const ICONS: IconName[] = ['back', 'clock', 'cal', 'pin', 'plus', 'save', 'heart', 'pen', 'search', 'edit', 'cmt', 'phone', 'tack', 'lock', 'refresh'];

/** 켜짐 (보라) */
export const ToggleOn: Story = {};
/** 꺼짐 */
export const ToggleOff: Story = { args: { value: false } };

export const Icons: Story = {
  render: () => (
    <View style={styles.wrap}>
      {ICONS.map((k) => (
        <View key={k} style={styles.cell}>
          <Icon name={k} />
          <PText variant="small">{k}</PText>
        </View>
      ))}
    </View>
  ),
};

/** 고르는 칩 — 고름 · 안 고름 · 못 누름 · 작게 */
export const Chips: Story = {
  render: () => (
    <View style={styles.wrap}>
      <ChoiceChip label="1주" on onPress={fn()} />
      <ChoiceChip label="2주" on={false} onPress={fn()} />
      <ChoiceChip label="자리 없음" on={false} disabled onPress={fn()} />
      <ChoiceChip label="작게 · 고름" on small onPress={fn()} />
      <ChoiceChip label="작게" on={false} small onPress={fn()} />
    </View>
  ),
};

function TabsDemo() {
  const [v, setV] = useState<'all' | 'a' | 'b'>('all');
  return (
    <UnderTabs
      tabs={[
        ['all', '전체'],
        ['a', '영어 월수 21:00'],
        ['b', '저장한 표현 3'],
      ]}
      value={v}
      onChange={setV}
    />
  );
}
/** 밑줄 탭 (눌러서 바꿀 수 있음) */
export const Tabs: Story = { render: () => <TabsDemo /> };

/** 카드 — 흰색 · 노랑 · 보라 · 누를 수 있는 카드 */
export const Boxes: Story = {
  render: () => (
    <View style={styles.col}>
      <Box>
        <PText>흰 카드 (기본)</PText>
      </Box>
      <Box color={Colors.yellow}>
        <PText>노랑 카드</PText>
      </Box>
      <Box color={Colors.purple}>
        <PText color={Colors.white}>보라 카드</PText>
      </Box>
      <Box onPress={fn()} label="눌러 보기">
        <PText>누를 수 있는 카드 ›</PText>
      </Box>
    </View>
  ),
};

/** 섹션 제목 · 글자 링크 · 그림자 */
export const HeadLinkLift: Story = {
  render: () => (
    <View style={styles.col}>
      <Head>다른 언어도 배우기</Head>
      <TextLink label="전체 보기" onPress={fn()} />
      <TextLink label="빨간 링크" color={Colors.rosePink} onPress={fn()} />
      <View style={styles.wrap}>
        <Lift radius={18}>
          <View style={styles.liftBox}>
            <PText>4 · 4</PText>
          </View>
        </Lift>
        <Lift radius={18} dx={0} dy={4}>
          <View style={styles.liftBox}>
            <PText>0 · 4</PText>
          </View>
        </Lift>
        <Lift radius={18} pressed>
          <View style={styles.liftBox}>
            <PText>눌림</PText>
          </View>
        </Lift>
      </View>
    </View>
  ),
};

/** 화면 틀 — 위 줄 · 스크롤 · 아래 버튼 바 */
export const Page: Story = {
  decorators: [],
  render: () => (
    <AccountPage title="화면 제목" right={<TextLink label="편집" onPress={fn()} />} footer={<Button label="저장하기" wide onPress={fn()} />}>
      {Array.from({ length: 12 }, (_, i) => (
        <Box key={i} style={styles.gap}>
          <PText>{`카드 ${i + 1}`}</PText>
        </Box>
      ))}
    </AccountPage>
  ),
};
/** 화면 틀 — 아래 바를 직접 배치 (Bar) · 스크롤 없음(plain) */
export const PagePlainWithBar: Story = {
  decorators: [],
  render: () => (
    <AccountPage
      title="스크롤 없는 화면"
      plain
      bottom={
        <Bar>
          <PText variant="small">버튼 위 한 줄 안내</PText>
          <Button label="신청하기" wide onPress={fn()} />
        </Bar>
      }>
      <View style={styles.plainBody}>
        <PText>안에서 따로 스크롤하는 화면</PText>
      </View>
    </AccountPage>
  ),
};

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' },
  col: { gap: 16 },
  cell: { width: 70, alignItems: 'center', gap: 4 },
  liftBox: { padding: 14, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  gap: { marginBottom: 12 },
  plainBody: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
