import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { noteExpression } from '@/components/account/pro-note-parts';
import { markNoteRead } from '@/components/account/store';
import ProNotesScreen from '@/app/(app)/me/notes/index';
import { PRO_NOTES } from '@/data/account';
import { saveExpression } from '@/state/expressions';

import { fresh } from '../../../my/_state';

/**
 * PRO'S NOTE 목록 (/me/notes) — 회원만. 팀 탭 · 저장한 표현 탭 · 일기 · 노트 목록(NEW). ?view=diary 면 나의 스터디 일기.
 */
const meta = {
  title: 'Pages/Me/Notes/Index',
  component: ProNotesScreen,
  parameters: { route: { pathname: '/me/notes' } },
  beforeEach: fresh(),
} satisfies Meta<typeof ProNotesScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 안 읽은 노트 있음 · 저장한 표현 0 */
export const Default: Story = {};
/** 모두 읽음 */
export const AllRead: Story = { beforeEach: fresh({}, () => PRO_NOTES.forEach((n) => markNoteRead(n.id))) };
/** 노트 항목을 표현함에 저장해 둠 — '저장한 표현 n' */
export const WithSaved: Story = {
  beforeEach: fresh({}, () => {
    saveExpression(noteExpression(PRO_NOTES[0], 0));
    saveExpression(noteExpression(PRO_NOTES[1], 1));
  }),
};
/** 저장한 표현 탭 (비었음) */
export const SavedTabEmpty: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole('tab', { name: /저장한 표현/ }));
  },
};
/** 나의 스터디 일기 (?view=diary) */
export const DiaryView: Story = { parameters: { route: { pathname: '/me/notes', params: { view: 'diary' } } } };

export const Guest: Story = { globals: { userKind: 'guest' } };
export const Pending: Story = { globals: { userKind: 'pending' } };
export const AppOnly: Story = { globals: { userKind: 'app' } };
