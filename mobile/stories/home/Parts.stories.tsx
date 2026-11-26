import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { StyleSheet, View } from 'react-native';
import { fn } from 'storybook/test';

import { CHECK_PATH, QR_PATH } from '@/components/home/icons';
import { Hard, SumRow, WideButton } from '@/components/home/parts';
import { PText } from '@/components/ui/text';
import { Colors } from '@/constants/theme';

import { padded } from '../_support/padded';

/** 홈 시트 · 팝업이 같이 쓰는 작은 부품 — 노랑 큰 버튼(WideButton) · 점선 요약 줄(SumRow) · 흐림 없는 그림자(Hard). */
const meta = {
  title: 'Home/Parts',
  component: WideButton,
  args: { label: '20:00 · 영어 참석 알리기', icon: CHECK_PATH, onPress: fn() },
  decorators: [padded],
} satisfies Meta<typeof WideButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Button: Story = {};
export const ButtonNoIcon: Story = { args: { label: '좋아요, 다녀올게요', icon: undefined } };
/** 잠김 — 회색 · 그림자 없음 */
export const ButtonDisabled: Story = { args: { label: '언어를 골라주세요', disabled: true } };
/** 긴 글자 — 한 줄 말줄임 */
export const ButtonLong: Story = { args: { label: '20:00 · 스페인어 QR 찍고 출석하고 포인트 받기', icon: QR_PATH } };

export const Summary: Story = {
  render: () => (
    <View style={styles.col}>
      <SumRow label="도착하면 QR만 찍으면 돼요" value="20:00 · 영어" />
      <SumRow label="③ 입구 QR 찍기" value="20:00 · 언어 선택 전" />
    </View>
  ),
};

/** Hard 그림자 — 어긋남(x · y) · 색 */
export const HardShadow: Story = {
  render: () => (
    <View style={styles.row}>
      {[
        { x: 4, y: 4, color: Colors.ink },
        { x: 0, y: 6, color: Colors.ink },
        { x: 3, y: 3, color: Colors.purple },
        { x: 0, y: 0, color: 'transparent' },
      ].map((h, i) => (
        <Hard key={i} x={h.x} y={h.y} radius={18} color={h.color}>
          <View style={styles.box}>
            <PText variant="label">
              {h.x},{h.y}
            </PText>
          </View>
        </Hard>
      ))}
    </View>
  ),
};

const styles = StyleSheet.create({
  col: { gap: 4 },
  row: { flexDirection: 'row', gap: 16 },
  box: { width: 64, height: 64, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
});
