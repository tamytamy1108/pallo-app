import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { sendNoteMessage, toggleNoteThanks } from '@/components/account/store';
import ProNoteScreen from '@/app/(app)/me/notes/[id]';

import { fresh } from '../../../my/_state';

const at = (id: string, from?: string) => ({ route: { pathname: `/me/notes/${id}`, params: from ? { id, from } : { id } } });

/**
 * PRO'S NOTE 상세 (/me/notes/[id]) — 회원만. 노트 항목 · 일기 · 고마워요 · 보낸 인사.
 * 목록 · 일기에서 왔으면(from) 위 줄 '전체 보기' 없음. 없는 id 면 '노트를 찾을 수 없어요'.
 */
const meta = {
  title: 'Pages/Me/Notes/Detail',
  component: ProNoteScreen,
  parameters: at('pn4'),
  beforeEach: fresh(),
} satisfies Meta<typeof ProNoteScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 오늘 노트 · 알림 등에서 바로 (위 줄 '전체 보기') · 일기 아직 안 씀 */
export const Latest: Story = {};
/** 목록에서 옴 — '전체 보기' 없음 */
export const FromList: Story = { parameters: at('pn4', 'list') };
/** 일기 예시가 있는 노트 */
export const WithDiary: Story = { parameters: at('pn3', 'diary') };
/** 고마워요 보냄 · 질문 · 감사 인사 남김 */
export const ThankedWithMessages: Story = {
  beforeEach: fresh({}, () => {
    toggleNoteThanks('pn4');
    sendNoteMessage('pn4', { kind: '감사 인사', text: '오늘 수업 정말 재밌었어요!' });
    sendNoteMessage('pn4', { kind: '질문', text: 'exhausted 랑 tired 는 어떻게 달라요? 언제 어떤 걸 쓰면 좋을지 알려 주세요.' });
  }),
};
/** 없는 노트 */
export const NotFound: Story = { parameters: at('nope') };

export const Guest: Story = { globals: { userKind: 'guest' } };
export const Pending: Story = { globals: { userKind: 'pending' } };
