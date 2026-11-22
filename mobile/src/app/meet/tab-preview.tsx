// 임시 미리보기 (번개 · 동아리 탭 본문만 따로 보기) — 라운지 화면이 MeetTab 을 넣으면 지워요
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BranchSelect } from '@/components/lounge/branch-select';
import { MeetTab } from '@/components/meet/meet-tab';
import { Colors } from '@/constants/theme';

export default function MeetTabPreview() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 160 }}>
        <MeetTab branch="전체" header={<BranchSelect value="전체" onChange={() => {}} />} />
      </ScrollView>
    </SafeAreaView>
  );
}
