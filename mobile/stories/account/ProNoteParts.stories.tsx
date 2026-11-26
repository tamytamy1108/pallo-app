import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { View } from 'react-native';

import { DiaryCard, NoteRow } from '@/components/account/pro-note-parts';
import { saveDiary } from '@/components/account/store';
import { PRO_NOTES } from '@/data/account';

import { padded } from '../_support/padded';
import { fresh } from '../my/_state';

const note = (id: string) => PRO_NOTES.find((n) => n.id === id) ?? PRO_NOTES[0];

/** PRO'S NOTE 부품 — 노트 한 줄(NEW · 첫 줄) · 오늘의 스터디 일기 카드(쓰기 · 저장됨). */
const meta = {
  title: 'Account/ProNoteParts',
  component: NoteRow,
  args: { n: PRO_NOTES[0], fresh: true, first: true, onPress: fn() },
  decorators: [padded],
  beforeEach: fresh(),
} satisfies Meta<typeof NoteRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 노트 한 줄 — NEW */
export const RowNew: Story = {};
/** 노트 한 줄 — 읽음 · 위 선 있음 */
export const RowRead: Story = { args: { fresh: false, first: false, n: PRO_NOTES[1] } };
/** 노트 목록 */
export const RowList: Story = {
  render: (args) => (
    <View>
      {PRO_NOTES.map((n, i) => (
        <NoteRow key={n.id} n={n} fresh={!!n.isNew} first={i === 0} onPress={args.onPress} />
      ))}
    </View>
  ),
};

/** 일기 — 아직 안 씀 (스티커 · 질문 · 쓰기 칸) */
export const DiaryEmpty: Story = { render: () => <DiaryCard n={note('pn4')} /> };
/** 일기 — 예시로 저장됨 (고른 스티커만 · 글) */
export const DiarySavedExample: Story = { render: () => <DiaryCard n={note('pn2')} /> };
/** 일기 — 내가 쓴 긴 글 */
export const DiarySavedLong: Story = {
  beforeEach: fresh({}, () =>
    saveDiary('pn4', { st: ['new', 'fun', 'ask', 'friend'], q: 2, t: '오늘은 처음으로 프로님께 질문을 세 번이나 했다. 다음 수업에서는 새로 배운 표현을 꼭 써 보고 싶다. 같은 팀 멤버들과 번개도 잡았다!', at: '11.10 22:40' }),
  ),
  render: () => <DiaryCard n={note('pn4')} />,
};
