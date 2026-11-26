import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { LangList, LangRow } from '@/components/onboarding/app-langs';
import { ONB_LANGS } from '@/components/onboarding/app-parts';
import { Field } from '@/components/onboarding/parts';
import type { StudyLang } from '@/state/me';

import { padded } from '../_support/padded';

const [EN] = ONB_LANGS;

function ListDemo({ initial }: { initial: StudyLang[] }) {
  const [on, setOn] = useState<StudyLang[]>(initial);
  return (
    <LangList label="궁금한 언어">
      {ONB_LANGS.map((l) => (
        <LangRow key={l.key} lang={l} on={on.includes(l.key)} onPress={() => setOn((p) => (p.includes(l.key) ? p.filter((x) => x !== l.key) : [...p, l.key]))} />
      ))}
    </LangList>
  );
}

/** 희망 언어 한 줄 (굵은 알약) — 고르면 무대 분홍 바탕 · 잉크 체크, 인사말은 그 언어 색 → 잉크 */
const meta = {
  title: 'Onboarding/LangRow',
  component: LangRow,
  args: { lang: EN, on: false, onPress: fn() },
  decorators: [padded],
} satisfies Meta<typeof LangRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {};
export const On: Story = { args: { on: true } };
/** 안 고르고 넘어가려 할 때 — 빨간 테두리 */
export const Invalid: Story = {
  render: (args) => (
    <Field error="궁금한 언어를 하나 이상 골라 주세요">
      <LangRow {...args} />
    </Field>
  ),
};
/** 네 언어 꺼짐 · 켜짐 비교 */
export const AllLangs: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      {ONB_LANGS.map((l) => (
        <LangRow key={`off-${l.key}`} lang={l} on={false} onPress={fn()} />
      ))}
      {ONB_LANGS.map((l) => (
        <LangRow key={`on-${l.key}`} lang={l} on onPress={fn()} />
      ))}
    </View>
  ),
};
/** 목록 — 하나도 안 고름 (눌러서 골라 보기) */
export const ListNone: Story = { render: () => <ListDemo initial={[]} /> };
export const ListSome: Story = { render: () => <ListDemo initial={['en', 'ja']} /> };
export const ListAll: Story = { render: () => <ListDemo initial={['en', 'ja', 'zh', 'es']} /> };
