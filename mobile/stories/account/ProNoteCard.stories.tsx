import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { ProNoteCard } from '@/components/account/pro-note-card';
import { markNoteRead } from '@/components/account/store';
import { PRO_NOTES } from '@/data/account';

import { padded } from '../_support/padded';
import { fresh } from '../my/_state';

/** 마이 PRO'S NOTE 카드 — 최신 노트 미리 보기 · 안 읽은 새 노트가 있으면 '새 노트 n'. */
const meta = {
  title: 'Account/ProNoteCard',
  component: ProNoteCard,
  decorators: [padded],
  beforeEach: fresh(),
} satisfies Meta<typeof ProNoteCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 안 읽은 새 노트 있음 */
export const WithNew: Story = {};
/** 모두 읽음 — '새 노트' 없음 */
export const AllRead: Story = { beforeEach: fresh({}, () => PRO_NOTES.forEach((n) => markNoteRead(n.id))) };
