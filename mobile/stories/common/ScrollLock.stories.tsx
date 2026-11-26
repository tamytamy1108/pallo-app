import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ScrollLock } from '@/components/common/scroll-lock';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PText } from '@/components/ui/text';
import { Colors, Spacing } from '@/constants/theme';
import { resetLockHits } from '@/state/lock-hits';

function Feed() {
  return (
    <View style={styles.feed}>
      {Array.from({ length: 8 }, (_, i) => (
        <Card key={i}>
          <PText variant="bodyStrong">{`라운지 글 ${i + 1}`}</PText>
          <PText color={Colors.inkSub}>오늘 세션에서 배운 표현을 나눠요.</PText>
        </Card>
      ))}
    </View>
  );
}

/**
 * 스크롤 잠김 (라운지 · 이벤트 · 마이) — 회원은 그대로, 비회원은 peek 높이까지만 보이고 아래를 흐리게 덮은 뒤 잠김 칸.
 */
const meta = {
  title: 'Common/ScrollLock',
  component: ScrollLock,
  args: { screen: 'lounge', peek: 420, children: <Feed /> },
  render: (args) => (
    <ScrollView>
      <ScrollLock {...args} />
    </ScrollView>
  ),
  beforeEach: () => {
    resetLockHits();
    return resetLockHits;
  },
} satisfies Meta<typeof ScrollLock>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 회원 — 끝까지 */
export const Member: Story = { globals: { userKind: 'member' } };
/** 비회원 — 잠김 칸 [체험 신청하기] */
export const Guest: Story = { globals: { userKind: 'guest' } };
/** 연동 대기 */
export const Pending: Story = { globals: { userKind: 'pending' } };
/** 연동 안 됨 */
export const Rejected: Story = { globals: { userKind: 'rejected' } };
/** 체험 예약 */
export const Trial: Story = { globals: { userKind: 'trial' } };
/** 짧게 보이기 (peek 200) */
export const ShortPeek: Story = { globals: { userKind: 'guest' }, args: { peek: 200 } };
/** 잠김 칸을 직접 정하기 (panel) */
export const CustomPanel: Story = {
  globals: { userKind: 'guest' },
  args: {
    screen: 'event',
    panel: (
      <Card>
        <PText variant="title">이벤트는 회원 전용이에요</PText>
        <Button label="체험 신청하기" wide />
      </Card>
    ),
  },
};

const styles = StyleSheet.create({ feed: { padding: Spacing.gutter, gap: Spacing.stack } });
