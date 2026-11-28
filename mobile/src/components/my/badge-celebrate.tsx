import { Image } from 'expo-image';
import { useSegments } from 'expo-router';
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

import { BadgeIc } from './my-blocks';

/**
 * 새 배지 축하 시트 — 서버가 준 '안 본 배지'(GET /me/badges/unseen)가 있으면 탭 화면 위에 띄워요.
 * 앱을 열 때 · 앞으로 돌아올 때 · 배지 푸시가 왔을 때 다시 물어요 (푸시는 꺼 두었을 수 있어서 이 시트가 확실한 길이에요).
 * 탭 화면을 보고 있을 때만 띄워요 — 레슨 · 글쓰기처럼 위에 겹친 화면 도중이면 그 화면을 닫고 탭으로 돌아왔을 때 떠요.
 * 닫으면(확인 · 끌어내리기) 띄웠던 배지만 본 것으로 보내요 — 그 사이 새로 받은 배지는 다음에 또 떠요.
 * 본 것으로 보내기가 실패해도 이번에는 다시 띄우지 않고, 다음에 앱을 열 때 다시 떠요.
 */
export function BadgeCelebrateHost() {
  const unseen = useUnseenBadges(true);
  const markSeen = useMarkBadgesSeen();
  const [shown, setShown] = useState<Badge[] | null>(null);
  const onTab = (useSegments() as string[]).includes('(tabs)');
  // 이번에 띄웠던 코드 — 본 것으로 보내기 전에 다시 받아도 같은 배지를 또 띄우지 않게
  const handled = useRef(new Set<string>());

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
      title={title}
      label="새 배지"
      footer={
        <View>
          <Button label="좋아요" wide onPress={close} />
        </View>
      }>
      <View style={styles.list}>
        {(shown ?? []).map((b) => (
          <View key={b.code} style={styles.row} accessible accessibilityLabel={`${b.name} 배지 · ${b.desc}`}>
            <View style={styles.art}>
              {b.imageUrl ? <Image source={b.imageUrl} style={styles.img} contentFit="contain" accessible={false} /> : <BadgeIc ic={b.ic} size={40} />}
            </View>
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
  art: { width: 128, height: 128, borderRadius: 64, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow, alignItems: 'center', justifyContent: 'center' },
  img: { width: 108, height: 108 },
  name: { fontFamily: Font.display, fontSize: 18, lineHeight: 24, textAlign: 'center' },
  desc: { fontFamily: Font.body700, fontSize: 13, lineHeight: 19, color: Colors.inkSub, textAlign: 'center' },
});
