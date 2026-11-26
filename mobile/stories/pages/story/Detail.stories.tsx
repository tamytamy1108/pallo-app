import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import StoryScreen from '@/app/(app)/story/[id]';
import { LG_C } from '@/data/lounge';
import { addStory, markSeen } from '@/data/lounge-store';
import { getMe } from '@/state/me';

import { photoUri, setup } from '../../lounge/_fixtures';

const at = (id: string) => ({ route: { params: { id }, pathname: `/story/${id}` } });
const mine = (img?: string) =>
  addStory({ id: 'sb-my1', who: getMe().name, av: LG_C.y, role: '', br: getMe().branch, cat: 'daily', time: '방금', h: 0, big: 'It’s on me\ntoday.', ds: '24시간 동안 내 스토리로 보여요', art: [LG_C.y, 'ON ME'], mine: true, img });

/**
 * 스토리 보기 (/story/[id]) — 사람 묶음(u:이름) · 카테고리 하이라이트(c:카테고리) · 내 스토리.
 * 5초마다 넘어가고 끝나면 닫힌다(스토리북에서는 이동 없음). 번개 · 파티 스토리는 [참여하기], 내 스토리는 [지우기], 매니저는 고정.
 */
const meta = {
  title: 'Pages/Story/Detail',
  component: StoryScreen,
  parameters: at('u:민준'),
  beforeEach: setup(),
} satisfies Meta<typeof StoryScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 사람 묶음 (민준 · 2개) */
export const Person: Story = {};
/** 이미 본 것 다음부터 (첫 장은 봄) */
export const ResumeUnseen: Story = { beforeEach: setup(() => markSeen('s12')) };
/** 이벤트 하이라이트 (매니저 고정 · 참여하기) */
export const EventHighlight: Story = { parameters: at('c:event') };
/** 매니저가 보는 이벤트 하이라이트 (고정 풀기) */
export const EventAsManager: Story = { parameters: at('c:event'), beforeEach: setup(undefined, { role: 'manager' }) };
/** 일상 하이라이트 */
export const DailyHighlight: Story = { parameters: at('c:daily') };
/** 내 스토리 (지우기) */
export const MyStory: Story = { parameters: at('u:__me'), beforeEach: setup(() => mine()) };
/** 내 스토리 · 사진 */
export const MyStoryPhoto: Story = { parameters: at('u:__me'), beforeEach: setup(() => mine(photoUri('#9FD8F5', 'MY STORY', 1080, 1920))) };
/** 없는 묶음 id — 맨 앞 묶음부터 */
export const UnknownId: Story = { parameters: at('u:nobody') };
/** 비회원 (댓글을 달면 회원 안내) */
export const AsGuest: Story = { globals: { userKind: 'guest' } };
