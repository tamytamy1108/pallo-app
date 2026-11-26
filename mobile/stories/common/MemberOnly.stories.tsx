import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { StyleSheet, View } from 'react-native';

import { MemberOnly } from '@/components/common/member-lock';
import { PText } from '@/components/ui/text';
import { Colors, Spacing } from '@/constants/theme';
import { resetLockHits } from '@/state/lock-hits';

function RealContent({ label }: { label: string }) {
  return (
    <View style={styles.real}>
      <PText variant="headline">{label}</PText>
      <PText color={Colors.inkSub}>회원에게만 보이는 실제 화면이에요.</PText>
    </View>
  );
}

/**
 * 회원 전용 화면 틀 — 회원이면 그대로, 아니면 위 줄 + '지점 회원이 되면 열려요' 칸.
 * 막힌 채 열리면 체험 안내 시트를 한 번 띄우려 하는데, 스토리에는 안내 시트(TrialGuideHost)가 없어 칸만 보여요.
 */
const meta = {
  title: 'Common/MemberOnly',
  component: MemberOnly,
  args: { feature: 'pass', title: '이용권', children: <RealContent label="이용권" /> },
  argTypes: { feature: { control: 'select', options: ['pass', 'myStudy', 'proNote', 'allChapters', 'fullScroll'] } },
  beforeEach: () => {
    resetLockHits();
    return resetLockHits;
  },
} satisfies Meta<typeof MemberOnly>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 회원 — 실제 화면 */
export const Member: Story = { globals: { userKind: 'member' } };
/** 비회원 — 잠김 칸 [체험 신청하기] */
export const Guest: Story = { globals: { userKind: 'guest' } };
/** 연동 대기 — 안내만 */
export const Pending: Story = { globals: { userKind: 'pending' } };
/** 연동 안 됨 — [다시 요청하기] */
export const Rejected: Story = { globals: { userKind: 'rejected' } };
/** 체험 예약 — [체험 예약 보기] */
export const Trial: Story = { globals: { userKind: 'trial' } };
/** 프로 노트 · 비회원 */
export const ProNoteGuest: Story = { globals: { userKind: 'guest' }, args: { feature: 'proNote', title: '프로 노트', children: <RealContent label="프로 노트" /> } };

const styles = StyleSheet.create({ real: { flex: 1, padding: Spacing.gutter, gap: Spacing.tight } });
