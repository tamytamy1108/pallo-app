import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { C, hashId, type Club } from '@/data/meet';

import { AlbumThumb } from '../album-art';
import { Icon } from '../icons';
import { clubContent } from '../model';
import { Peek } from './club-parts';

/** 사진첩 탭 (3칸 격자 · 누르면 크게). 가입 전엔 6장만 흐리게 (프로토타입 .lg-album · lgAlbumView) */
export function ClubAlbum({ c, inC }: { c: Club; inC: boolean }) {
  const [w, setW] = useState(0);
  const [view, setView] = useState<number | null>(null);
  const { album, name } = clubContent(c);
  const h = hashId(c.id);
  const cell = w ? (w - 8) / 3 : 0;
  const grid = (L: typeof album, tap: boolean) => (
    <View style={styles.grid} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {cell
        ? L.map(([k, cap], i) => (
            <Pressable key={i} disabled={!tap} onPress={() => setView(i)} accessibilityRole={tap ? 'button' : undefined} accessibilityLabel={`${cap} 사진 크게 보기`} style={styles.ap}>
              <AlbumThumb k={k} size={cell - 2} />
              {tap ? (
                <View style={styles.lk}>
                  <Icon name="heart" size={11} fill={C.pk} strokeWidth={2} />
                  <PText style={styles.lkT}>{2 + ((h + i) % 7)}</PText>
                </View>
              ) : null}
            </Pressable>
          ))
        : null}
    </View>
  );
  if (!inC)
    return (
      <Peek icon="image" title={`사진 ${album.length}장 중 6장만 보여요`} desc="가입하면 정기 모임 사진을 모두 보고 크게 볼 수 있어요.">
        {grid(album.slice(0, 6), false)}
      </Peek>
    );
  return (
    <View style={{ marginTop: 14 }}>
      {grid(album, true)}
      <PText style={styles.hint}>멤버끼리만 보여요</PText>
      <AlbumViewer list={album} who={(i) => name(['H', 'A', 'B', 'C', 'D'][i % 5])} start={view} onClose={() => setView(null)} />
    </View>
  );
}

/** 크게 보기: 올린 사람 · 캡션 · 옆으로 넘기기 */
function AlbumViewer({ list, who, start, onClose }: { list: ReturnType<typeof clubContent>['album']; who: (i: number) => string; start: number | null; onClose: () => void }) {
  const [w, setW] = useState(0);
  const [i, setI] = useState(0);
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={start != null} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.pv} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        <View style={[styles.pvTop, { paddingTop: insets.top + 10 }]}>
          <PText style={styles.pvN}>{`${i + 1} / ${list.length}`}</PText>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="닫기" style={styles.pvX} hitSlop={8}>
            <Icon name="x" size={22} color="#fff" strokeWidth={2.6} />
          </Pressable>
        </View>
        {w ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} contentOffset={{ x: (start ?? 0) * w, y: 0 }} onLayout={() => setI(start ?? 0)} onMomentumScrollEnd={(e) => setI(Math.round(e.nativeEvent.contentOffset.x / w))}>
            {list.map(([k, cap], j) => (
              <View key={j} style={{ width: w, paddingHorizontal: 20, justifyContent: 'center', gap: 12 }}>
                <AlbumThumb k={k} size={w - 40} style={styles.big} />
                <PText style={styles.cap}>
                  <PText style={styles.capB}>{who(j)}</PText> {cap}
                </PText>
              </View>
            ))}
          </ScrollView>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  ap: { borderWidth: 1, borderColor: Colors.ink, borderRadius: 8, overflow: 'hidden' },
  lk: { position: 'absolute', left: 6, bottom: 5, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.9)' },
  lkT: { fontFamily: Font.body900, fontSize: 11, lineHeight: 14 },
  hint: { marginTop: 6, textAlign: 'center', fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  pv: { flex: 1, backgroundColor: 'rgba(20,17,30,0.94)', justifyContent: 'center' },
  pvTop: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', paddingBottom: 10, zIndex: 2 },
  pvN: { fontFamily: Font.display, fontSize: 13, lineHeight: 18, color: '#fff' },
  pvX: { position: 'absolute', right: 14, bottom: 4, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  big: { borderRadius: 18, borderWidth: 2, borderColor: '#fff' },
  cap: { fontFamily: Font.body700, fontSize: 14, lineHeight: 20, color: '#fff' },
  capB: { fontFamily: Font.body900, fontSize: 14, color: Colors.yellow },
});
