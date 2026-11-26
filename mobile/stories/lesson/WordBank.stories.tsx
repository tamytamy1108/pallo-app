import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { AnswerCards, Chip, WordBank, type WordBankState } from '@/components/lesson/word-bank';
import { PText } from '@/components/ui/text';

import { padded } from '../_support/padded';
import { tap } from './_support';

/** 섞지 않은 카드 묶음 — 스토리마다 같은 모양으로 보이게 (실제 앱은 makeWordBank 로 섞어요) */
const SENT = "I'd like to return this.";
const TOKS = ['to', 'this.', 'like', "I'd", 'order', 'return', 'menu'].map((w, id) => ({ w, id }));
const wb = (picked: number[]): WordBankState => ({ toks: TOKS, picked });
const RIGHT = [3, 2, 0, 5, 1];

function Demo({ initial, strict = false, hint = false, locked = false }: { initial: number[]; strict?: boolean; hint?: boolean; locked?: boolean }) {
  const [s, setS] = useState(() => wb(initial));
  const [shake, setShake] = useState<{ id: number; n: number } | null>(null);
  // 바로 채점(응대 대화): 다음 자리 낱말이면 true, 아니면 흔들기
  const onTap = strict
    ? (id: number) => {
        const ok = id === RIGHT[s.picked.length];
        if (!ok) setShake((x) => ({ id, n: (x?.n ?? 0) + 1 }));
        return ok;
      }
    : undefined;
  const hintId = hint ? RIGHT[s.picked.length] ?? null : null;
  return (
    <View style={{ gap: 12 }}>
      <WordBank wb={s} onChange={setS} onTap={onTap} hintId={hintId} shake={shake} locked={locked} />
      <PText>지금 문장: {s.picked.map((id) => TOKS[id].w).join(' ') || '(비었음)'}</PText>
    </View>
  );
}

/** 단어 카드 묶음 — 누르면 위 줄에 쌓이고, 쌓인 카드를 누르면 빠져요. 바로 채점 · 힌트 · 잠김. */
const meta = {
  title: 'Lesson/WordBank',
  component: Demo,
  args: { initial: [] },
  decorators: [padded],
} satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 아직 안 고름 — 안내 글 */
export const Empty: Story = {};
/** 몇 개 고름 — '모두 지우기' 보임 */
export const Partial: Story = { args: { initial: [3, 2] } };
/** 다 고름 */
export const Full: Story = { args: { initial: RIGHT } };
/** 채점 뒤 잠김 */
export const Locked: Story = { args: { initial: RIGHT, locked: true } };
/** 바로 채점(응대 대화) — 빼기 · 모두 지우기 없음. 틀린 카드를 눌러 흔들림을 봐요 */
export const Strict: Story = {
  args: { initial: [3], strict: true },
  play: async ({ canvasElement }) => {
    await tap('order', canvasElement);
  },
};
/** 3번 틀리면 다음 카드가 노랗게 통통 (힌트) */
export const Hint: Story = { args: { initial: [3, 2], strict: true, hint: true } };
/** 눌러서 쌓기 (play) */
export const PickByTap: Story = {
  play: async ({ canvasElement }) => {
    for (const w of ["I'd", 'like', 'to']) await tap(w, canvasElement);
  },
};

/** 카드 한 장 모양 — 놓기 전 · 줄에 놓임 · 힌트 · 쓴 자리 · 누름 · 분홍 · 보라 */
export const Chips: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      <Chip w="pool" />
      <Chip w="in" state="in" />
      <Chip w="hint" state="hint" />
      <Chip w="used" state="used" />
      <Chip w="pressed" pressed />
      <Chip w="pink" tone="pink" />
      <Chip w="purple" tone="purple" />
    </View>
  ),
};
/** 정답 카드 (두 번째도 틀렸을 때) — 듣기 · 소리 끄기 */
export const Answer: Story = { render: () => <AnswerCards sentence={SENT} soundOff={false} onSay={fn()} /> };
export const AnswerSoundOff: Story = { render: () => <AnswerCards sentence={SENT} label="정답 문장" soundOff onSay={fn()} /> };
