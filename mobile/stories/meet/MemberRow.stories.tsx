import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { MemberRow } from '@/components/meet/detail/detail-parts';
import { C } from '@/data/meet';

import { padded } from '../_support/padded';

/** 멤버 한 줄 — 얼굴(왕관) · 이름 · 역할 · 지점 · 인사말. 내 줄은 누를 수 없고, 인사가 없으면 '아직 인사를 안 남겼어요'. */
const meta = {
  title: 'Meet/MemberRow',
  component: MemberRow,
  args: { m: { n: '민준', c: C.sky, b: '잠실점', t: '', hi: '반가워요! 영어로 수다 떨어요.' }, first: true },
  decorators: [padded],
} satisfies Meta<typeof MemberRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Member: Story = {};
export const NoGreeting: Story = { args: { m: { n: '민준', c: C.sky, b: '잠실점', t: '', hi: '' } } };
export const Host: Story = { args: { m: { n: '소라', c: C.pk, b: '영등포', t: '호스트', hi: '처음 오는 분도 환영이에요. 입구에서 손 흔들게요!' } } };
export const SubHost: Story = { args: { m: { n: '태오', c: C.lpu, b: '분당점', t: '서브 호스트', hi: '편하게 와서 편하게 말해요.' } } };
export const MeWithGreeting: Story = { args: { m: { n: '태미', c: C.y, b: '영등포', t: '나', hi: '잘 부탁드려요!', me: true } } };
export const MeNoGreeting: Story = { args: { m: { n: '태미', c: C.y, b: '영등포', t: '나', hi: '', me: true } } };
export const LongGreeting: Story = { args: { m: { n: '민준', c: C.sky, b: '잠실점 · 영등포', t: '', hi: '안녕하세요! 영어로 말하는 시간을 꾸준히 만들고 싶어서 들어왔어요. 매주 빠지지 않고 나올게요. 잘 부탁드려요!' } } };
export const List: Story = {
  render: () => (
    <View>
      <MemberRow first m={{ n: '태미', c: C.y, b: '영등포', t: '나', hi: '', me: true }} />
      <MemberRow m={{ n: '소라', c: C.pk, b: '영등포', t: '호스트', hi: '반가워요!' }} />
      <MemberRow m={{ n: '태오', c: C.lpu, b: '분당점', t: '서브 호스트', hi: '' }} />
      <MemberRow m={{ n: '민준', c: C.sky, b: '잠실점', t: '', hi: '영어로 수다 떨어요.' }} />
    </View>
  ),
};
