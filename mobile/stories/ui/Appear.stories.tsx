import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { StyleSheet, View } from 'react-native';

import { Appear } from '@/components/ui/appear';
import { Card } from '@/components/ui/card';
import { PText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { APPEAR, type AppearKind } from '@/lib/motion';

import { padded } from '../_support/padded';

const KINDS = Object.keys(APPEAR) as AppearKind[];

/** 처음 나타날 때 한 번 움직이는 틀 — 종류마다 움직임이 달라요. 다시 보려면 스토리를 새로 열어요. */
const meta = {
  title: 'UI/Appear',
  component: Appear,
  args: { kind: 'rise', delay: 0, children: null },
  argTypes: { kind: { control: 'select', options: KINDS } },
  decorators: [padded],
  render: (args) => (
    <Appear {...args}>
      <Card>
        <PText variant="bodyStrong">{args.kind}</PText>
      </Card>
    </Appear>
  ),
} satisfies Meta<typeof Appear>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rise: Story = {};
export const PopIn: Story = { args: { kind: 'popIn' } };
export const LinkUp: Story = { args: { kind: 'linkUp' } };
export const TkRise: Story = { args: { kind: 'tkRise' } };
export const ReactHop: Story = { args: { kind: 'reactHop' } };
export const ReactWord: Story = { args: { kind: 'reactWord' } };
/** 늦게 시작 (0.6초 뒤) */
export const Delayed: Story = { args: { delay: 600 } };

/** 모든 종류를 0.15초씩 늦춰 한 화면에서 비교 */
export const AllKinds: Story = {
  render: () => (
    <View style={styles.col}>
      {KINDS.map((k, i) => (
        <Appear key={k} kind={k} delay={i * 150}>
          <Card>
            <PText variant="bodyStrong">{k}</PText>
          </Card>
        </Appear>
      ))}
    </View>
  ),
};

const styles = StyleSheet.create({ col: { gap: Spacing.stack } });
