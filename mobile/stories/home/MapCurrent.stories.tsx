import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { CurrentFx, NodeHop, Rider } from '@/components/home/map-current';
import { TreasureChest } from '@/components/home/treasure-chest';
import { Colors } from '@/constants/theme';

import { padded } from '../_support/padded';

/** 정류장 가운데(0, 0)를 기준으로 놓이는 꾸밈이라, 가운데에 점 하나를 둔 칸에 그린다 */
function Stage({ children }: { children: ReactNode }) {
  return (
    <View style={styles.stage}>
      <View style={styles.center}>{children}</View>
    </View>
  );
}

/** 지금 할 정류장 꾸밈 (스포트라이트 · 빛살 · 통통 · 내 캐릭터) — 1.4초 박자를 맞춰 움직인다. 움직임 줄이기면 멈춤. */
const meta = {
  title: 'Home/MapCurrent',
  component: CurrentFx,
  decorators: [padded],
} satisfies Meta<typeof CurrentFx>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 지금 정류장 — 스포트라이트 + 통통 뛰는 정류장 + 내 캐릭터 */
export const CurrentStop: Story = {
  render: () => (
    <Stage>
      <CurrentFx />
      <NodeHop on style={styles.node}>
        <View style={styles.nodeFace} />
      </NodeHop>
      <Rider />
    </Stage>
  ),
};
/** 열 수 있는 보상 상자 뒤 (조금 작게 · 바닥 그림자 없이) */
export const ChestFx: Story = {
  render: () => (
    <Stage>
      <CurrentFx chest />
      <View style={styles.chest}>
        <TreasureChest width={88} />
      </View>
    </Stage>
  ),
};
/** 꺼진 정류장 (NodeHop on=false — 가만히) */
export const IdleNode: Story = {
  render: () => (
    <Stage>
      <NodeHop on={false} style={styles.node}>
        <View style={styles.nodeFace} />
      </NodeHop>
    </Stage>
  ),
};

const styles = StyleSheet.create({
  stage: { height: 220, borderRadius: 20, backgroundColor: Colors.white, overflow: 'hidden' },
  center: { position: 'absolute', left: '50%', top: '55%', width: 0, height: 0 },
  node: { position: 'absolute', left: -39, top: -39, width: 78, height: 78 },
  nodeFace: { flex: 1, borderRadius: 39, borderWidth: 2.5, borderColor: Colors.ink, backgroundColor: Colors.yellow },
  chest: { position: 'absolute', left: -44, top: -39 },
});
