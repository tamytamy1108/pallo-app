import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { BrandIcon, type BrandIconName } from '@/components/lesson/brand-icons';
import {
  BookmarkIcon,
  BulbIcon,
  CardsIcon,
  CheckIcon,
  ClockIcon,
  CloseIcon,
  GripIcon,
  HomeIcon,
  KeyboardIcon,
  MicIcon,
  MicOffIcon,
  ResetIcon,
  SendIcon,
  SparkIcon,
  SpeakerIcon,
  XIcon,
} from '@/components/lesson/icons';
import { PText } from '@/components/ui/text';

import { padded } from '../_support/padded';

/** 레슨 아이콘 모음 — 변형이 있는 것(스피커 꺼짐 · 책갈피 채움)은 둘 다. 완료 화면 숫자 카드 아이콘(BrandIcon) 4종. */
const meta = {
  title: 'Lesson/Icons',
  decorators: [padded],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const Cell = ({ name, children }: { name: string; children: ReactNode }) => (
  <View style={{ width: 96, alignItems: 'center', gap: 6, paddingVertical: 8 }}>
    {children}
    <PText style={{ fontSize: 11, lineHeight: 15 }}>{name}</PText>
  </View>
);

export const LessonIcons: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      <Cell name="Close"><CloseIcon /></Cell>
      <Cell name="Speaker"><SpeakerIcon /></Cell>
      <Cell name="Speaker off"><SpeakerIcon off /></Cell>
      <Cell name="Mic"><MicIcon /></Cell>
      <Cell name="MicOff"><MicOffIcon /></Cell>
      <Cell name="Cards"><CardsIcon /></Cell>
      <Cell name="Bookmark"><BookmarkIcon /></Cell>
      <Cell name="Bookmark on"><BookmarkIcon filled /></Cell>
      <Cell name="Keyboard"><KeyboardIcon /></Cell>
      <Cell name="Bulb"><BulbIcon /></Cell>
      <Cell name="Send"><SendIcon /></Cell>
      <Cell name="Check"><CheckIcon /></Cell>
      <Cell name="X"><XIcon /></Cell>
      <Cell name="Grip"><GripIcon /></Cell>
      <Cell name="Reset"><ResetIcon /></Cell>
      <Cell name="Clock"><ClockIcon /></Cell>
      <Cell name="Home"><HomeIcon /></Cell>
      <Cell name="Spark"><SparkIcon /></Cell>
    </View>
  ),
};

const BRAND: BrandIconName[] = ['coin', 'target', 'bolt', 'flag'];
export const BrandIcons: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {BRAND.map((n) => (
        <Cell key={n} name={n}>
          <BrandIcon name={n} size={40} />
        </Cell>
      ))}
    </View>
  ),
};
