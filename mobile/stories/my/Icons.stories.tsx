import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import type { ReactElement, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { DecoIcon, GearIcon, IC, LgIcon, PfIcon, SparkIcon, type IcName } from '@/components/my/icons';
import { PText } from '@/components/ui/text';
import { Colors } from '@/constants/theme';

import { padded } from '../_support/padded';

const Cell = ({ label, children }: { label: string; children: ReactNode }) => (
  <View style={styles.cell}>
    {children}
    <PText variant="small">{label}</PText>
  </View>
);

/** 마이 아이콘 모음 — 선 아이콘(LgIcon) 전부 · 톱니 · 꾸미기 붓 · 스파크 · 프로필 아이콘. */
const meta = {
  title: 'My/Icons',
  component: LgIcon,
  args: { name: 'flame' },
  decorators: [padded],
} satisfies Meta<typeof LgIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {};
/** 채움 · 색 · 크기 · 굵기 */
export const FilledPurple: Story = { args: { name: 'heart', fill: Colors.rosePink, stroke: Colors.purple, size: 32, sw: 2.6 } };

export const All: Story = {
  render: () => (
    <View style={styles.grid}>
      {(Object.keys(IC) as IcName[]).map((k) => (
        <Cell key={k} label={k}>
          <LgIcon name={k} />
        </Cell>
      ))}
      <Cell label="Gear">
        <GearIcon />
      </Cell>
      <Cell label="Deco">
        <DecoIcon />
      </Cell>
      <Cell label="Spark">
        <SparkIcon size={22} />
      </Cell>
      {(Object.keys(PfIcon) as (keyof typeof PfIcon)[]).map((k) => {
        const I = PfIcon[k] as () => ReactElement;
        return (
          <Cell key={k} label={`pf.${k}`}>
            <I />
          </Cell>
        );
      })}
    </View>
  ),
};

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  cell: { width: 76, alignItems: 'center', gap: 6 },
});
