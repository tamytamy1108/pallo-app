import { router } from 'expo-router';

import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';

export default function MyScreen() {
  return (
    <Screen title="마이">
      {/* 개발용 입구: 출시 전에 빼요 */}
      <Button label="디자인 부품 보기" variant="secondary" onPress={() => router.push('/design')} />
    </Screen>
  );
}
