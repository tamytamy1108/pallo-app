import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { StyleSheet, View } from 'react-native';

import { ChapterGate } from '@/components/common/member-lock';
import { PText } from '@/components/ui/text';
import { Colors, Spacing } from '@/constants/theme';
import { resetLockHits } from '@/state/lock-hits';

function Chapter({ label }: { label: string }) {
  return (
    <View style={styles.real}>
      <PText variant="headline">{label}</PText>
      <PText color={Colors.inkSub}>챕터 내용이 그대로 보여요.</PText>
    </View>
  );
}

/** 챕터 화면 틀 — 비회원은 맵마다 첫 챕터만. 둘째부터는 위 줄 + '○○는 지점 회원이 되면 열려요'. */
const meta = {
  title: 'Common/ChapterGate',
  component: ChapterGate,
  args: { no: 2, label: '2과', children: <Chapter label="2과" /> },
  beforeEach: () => {
    resetLockHits();
    return resetLockHits;
  },
} satisfies Meta<typeof ChapterGate>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 비회원 · 첫 챕터 — 열려 있어요 */
export const GuestFreeChapter: Story = { globals: { userKind: 'guest' }, args: { no: 1, label: '1과', children: <Chapter label="1과" /> } };
/** 비회원 · 둘째 챕터 — 잠겨요 */
export const GuestLocked: Story = { globals: { userKind: 'guest' } };
/** 연동 대기 · 둘째 챕터 */
export const PendingLocked: Story = { globals: { userKind: 'pending' } };
/** 체험 예약 · 둘째 챕터 */
export const TrialLocked: Story = { globals: { userKind: 'trial' } };
/** 상황 장면 이름 */
export const SceneLocked: Story = { globals: { userKind: 'guest' }, args: { no: 2, label: '장면 2', children: <Chapter label="장면 2" /> } };
/** 회원 — 모든 챕터 */
export const Member: Story = { globals: { userKind: 'member' } };
/** 앱 구독 — 비회원과 같이 잠겨요 (앱 구독만 여는 예외는 없어요) */
export const AppOnly: Story = { globals: { userKind: 'app' } };

const styles = StyleSheet.create({ real: { flex: 1, padding: Spacing.gutter, gap: Spacing.tight } });
