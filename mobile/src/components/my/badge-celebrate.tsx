import { router, useSegments } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useMarkBadgesSeen, useUnseenBadges } from '@/api/use-badges';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import type { Badge } from '@/data/my';
import { haptic, sfx } from '@/lib/feedback';

import { BadgeArt } from './my-blocks';

/**
 * 새 배지 축하 시트 — 서버가 준 '안 본 배지'(GET /me/badges/unseen)가 있으면 탭 화면 위에 띄워요.
 * 앱을 열 때 · 앞으로 돌아올 때 · 배지 푸시가 왔을 때 다시 물어요 (푸시는 꺼 두었을 수 있어서 이 시트가 확실한 길이에요).
 * 탭 화면을 보고 있을 때만 띄워요 — 레슨 · 글쓰기처럼 위에 겹친 화면 도중이면 그 화면을 닫고 탭으로 돌아왔을 때 떠요.
 * 닫으면(확인 · 끌어내리기) 띄웠던 배지만 본 것으로 보내요 — 그 사이 새로 받은 배지는 다음에 또 떠요.
 * [배지 보기] 를 누르면 닫힌 뒤 배지 모두 보기로 가요 (다음 배지까지 얼마나 남았는지).
 * 본 것으로 보내기가 실패해도 이번에는 다시 띄우지 않고, 다음에 앱을 열 때 다시 떠요.
 */
export function BadgeCelebrateHost() {
  const unseen = useUnseenBadges(true);
  const markSeen = useMarkBadgesSeen();
  const [shown, setShown] = useState<Badge[] | null>(null);
  const onTab = (useSegments() as string[]).includes('(tabs)');
  // 이번에 띄웠던 코드 — 본 것으로 보내기 전에 다시 받아도 같은 배지를 또 띄우지 않게
  const handled = useRef(new Set<string>());
  // [배지 보기] — 시트가 다 닫힌 뒤 옮겨요
  const goAll = useRef(false);

  useEffect(() => {
    if (shown || !onTab || !unseen.data) return;
    const fresh = unseen.data.filter((b) => !handled.current.has(b.code));
    if (!fresh.length) return;
    fresh.forEach((b) => handled.current.add(b.code));
    setShown(fresh);
    sfx('fanfare');
    haptic('success');
  }, [shown, onTab, unseen.data]);

  const close = () => {
    if (shown) markSeen.mutate(shown.map((b) => b.code));
    setShown(null);
  };

  const title = shown && shown.length > 1 ? `새 배지 ${shown.length}개를 받았어요` : '새 배지를 받았어요';
  return (
    <Sheet
      open={!!shown}
      onClose={close}
      onClosed={() => {
        if (goAll.current) router.push('/me/badges');
        goAll.current = false;
      }}
      title={title}
      label="새 배지"
      footer={
        <>
          <Button
            label="배지 보기"
            variant="secondary"
            wide
            onPress={() => {
              goAll.current = true;
              close();
            }}
          />
          <Button label="좋아요" wide onPress={close} />
        </>
      }>
      <View style={styles.list}>
        {(shown ?? []).map((b) => (
          <View key={b.code} style={styles.row} accessible accessibilityLabel={`${b.name} 배지 · ${b.desc}`}>
            {/* 칸 · 상세와 같은 배지 그림 (서버 그림이면 그림 그대로, 없으면 입체 동그라미 · 방패) */}
            <BadgeArt b={b} bg={Colors.yellow} size={128} iconSize={54} />
            <PText style={styles.name}>{b.name}</PText>
            <PText style={styles.desc}>{b.desc}</PText>
          </View>
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: 18, paddingVertical: 8 },
  row: { alignItems: 'center', gap: 6 },
  name: { fontFamily: Font.display, fontSize: 18, lineHeight: 24, textAlign: 'center' },
  desc: { fontFamily: Font.body700, fontSize: 13, lineHeight: 19, color: Colors.inkSub, textAlign: 'center' },
});
