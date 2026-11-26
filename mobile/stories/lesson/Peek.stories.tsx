import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Peek } from '@/components/lesson/peek';
import { PText } from '@/components/ui/text';

/**
 * 보라 팔로 빼꼼 — n 이 바뀔 때마다 오른쪽에서 나와 한마디 하고 2.8초 뒤 들어가요.
 * 스토리에선 3.5초마다 다시 나오게 n 을 올려요.
 */
function Looping({ line }: { line: [string, string] | null }) {
  const [n, setN] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setN((x) => x + 1), 3500);
    return () => clearInterval(t);
  }, []);
  return (
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <PText style={{ padding: 20 }}>레슨 화면 (n = {n})</PText>
      <Peek n={n} line={line} bottom={120} />
    </View>
  );
}

const meta = {
  title: 'Lesson/Peek',
  component: Looping,
  args: { line: ['So close!', '아깝다, 거의 맞았어요!'] },
} satisfies Meta<typeof Looping>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 영어 + 뜻 두 줄 (틀렸을 때) */
export const TwoLines: Story = {};
/** 한 줄 응원 (두 번 연속 맞혔을 때) */
export const Cheer: Story = { args: { line: ['잘하고 있어요!', ''] } };
/** 긴 말 */
export const Long: Story = { args: { line: ["No worries, you'll get it next time!", '괜찮아요, 다음엔 맞힐 거예요!'] } };
/** 말이 없으면 안 나와요 */
export const NoLine: Story = { args: { line: null } };
