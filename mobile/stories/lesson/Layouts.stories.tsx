import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { YellowButton } from '@/components/lesson/lesson-ui';
import { StudyLayout } from '@/components/lesson/study-layout';
import { TaskLayout } from '@/components/lesson/task-layout';
import { PText } from '@/components/ui/text';

import { DLG, withTask } from './_support';

/**
 * 화면 틀 둘 — 단계 화면 StudyLayout · 문제 화면 TaskLayout(진행기 안에서만).
 * 위는 스크롤(아래 흐리게), 아래 버튼 자리 고정. 긴 내용에서 흐림 · 고정 버튼을 본다.
 */
const meta = {
  title: 'Lesson/Layouts',
  args: { task: DLG.build },
} satisfies Meta<{ task: typeof DLG.build }>;

export default meta;
type Story = StoryObj<typeof meta>;

const Lines = ({ n }: { n: number }) => (
  <>
    {Array.from({ length: n }, (_, i) => (
      <View key={i} style={{ padding: 14, borderRadius: 16, borderWidth: 2, backgroundColor: 'white' }}>
        <PText>본문 칸 {i + 1}</PText>
      </View>
    ))}
  </>
);

export const StudyWithFoot: Story = { render: () => <StudyLayout foot={<YellowButton label="완료하기" onPress={fn()} />}><Lines n={4} /></StudyLayout> };
/** 아래 버튼 없음 — 흐림도 없어요 */
export const StudyNoFoot: Story = { render: () => <StudyLayout><Lines n={4} /></StudyLayout> };
/** 긴 내용 — 아래가 흐려지고 버튼은 고정 */
export const StudyLong: Story = { render: () => <StudyLayout foot={<YellowButton label="완료하기" onPress={fn()} />}><Lines n={20} /></StudyLayout> };
export const TaskWithFoot: Story = { decorators: [withTask], render: () => <TaskLayout foot={<YellowButton label="확인" onPress={fn()} />}><Lines n={3} /></TaskLayout> };
export const TaskLong: Story = { decorators: [withTask], render: () => <TaskLayout foot={<YellowButton label="확인" onPress={fn()} />}><Lines n={20} /></TaskLayout> };
export const TaskNoFoot: Story = { decorators: [withTask], render: () => <TaskLayout><Lines n={3} /></TaskLayout> };
