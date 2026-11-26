import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { mockProNote, type MyPageProNote } from '@/api/my-page';
import { ProNoteCard } from '@/components/account/pro-note-card';
import { markNoteRead } from '@/components/account/store';
import { PRO_NOTES } from '@/data/account';

import { padded } from '../_support/padded';
import { fresh } from '../my/_state';

/** 마이 PRO'S NOTE 카드 — 값은 마이 BFF proNote. 최신 노트 미리 보기 · 안 읽은 새 노트가 있으면 '새 노트 n'. */
const meta = {
  title: 'Account/ProNoteCard',
  component: ProNoteCard,
  decorators: [padded],
  beforeEach: fresh(),
  // 읽음 표시는 기기 상태라 그릴 때 가짜 서버 값을 만들어요
  args: { note: mockProNote(false, '나') },
  render: () => <ProNoteCard note={mockProNote(false, '나')} />,
} satisfies Meta<typeof ProNoteCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 안 읽은 새 노트 있음 */
export const WithNew: Story = {};
/** 모두 읽음 — '새 노트' 없음 */
export const AllRead: Story = { beforeEach: fresh({}, () => PRO_NOTES.forEach((n) => markNoteRead(n.id))) };
/** 프로 — [보낸 노트] [받은 노트] 탭 · n/m명 읽음 */
export const Pro: Story = { render: () => <ProNoteCard note={mockProNote(true, '나')} /> };

const EMPTY: MyPageProNote = { unreadCount: 0, received: { total: 0, latest: null }, sent: null };
/** 받은 노트가 아직 없음 */
export const Empty: Story = { render: () => <ProNoteCard note={EMPTY} /> };
/** 프로인데 보낸 노트도 받은 노트도 없음 */
export const ProEmpty: Story = { render: () => <ProNoteCard note={{ ...EMPTY, sent: { total: 0, latest: null } }} /> };
