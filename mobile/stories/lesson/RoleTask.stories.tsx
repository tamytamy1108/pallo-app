import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { RoleTask } from '@/components/lesson/role-task';
import type { RoleTask as RoleTaskData } from '@/data/lessons';

import { DLG, freshLesson, withTask } from './_support';

/** 역할 셋 (가짜) — 카드가 셋일 때 */
const THREE: RoleTaskData = { ...DLG.role, cast: ['Lily', 'Sonya', 'Logan'], roles: { ...DLG.role.roles, Logan: '옆 손님' } };

/**
 * 역할 고르기 — 인물 카드(얼굴 = 목소리 듣기, 카드 = 고르기). 고르면 내 대사 따라 말하기 문제가 뒤에 끼워져요(Actions: insertAfter · next).
 */
const meta = {
  title: 'Lesson/RoleTask',
  component: RoleTask,
  args: { task: DLG.role },
  decorators: [withTask],
  beforeEach: freshLesson(),
} satisfies Meta<typeof RoleTask>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** 소리 끄기 — 얼굴을 눌러도 고르기 */
export const SoundOff: Story = { parameters: { task: { soundOff: true } } };
/** 말하기가 어려워요 켜짐 */
export const NoSpeak: Story = { parameters: { task: { noSpeak: true } } };
/** 역할 셋 */
export const ThreeRoles: Story = { args: { task: THREE } };
