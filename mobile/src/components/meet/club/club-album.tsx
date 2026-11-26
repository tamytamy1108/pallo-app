import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { C, hashId, type AlbumArt, type Club } from '@/data/meet';
import { LayerModal } from '@/components/ui/sheet-stack';

import { AlbumThumb } from '../album-art';
import { Icon } from '../icons';
import { addPhotos, removePhoto, useMeetStore } from '../meet-store';
import { clubContent } from '../model';
import { showToast } from '@/components/ui/toast';
import { sfx } from '@/lib/feedback';
import { Peek } from './club-parts';

/** 사진첩 한 칸: 멤버가 올린 사진(uri) 또는 예시 그림(art) */
type Shot = { uri?: string; art?: AlbumArt; cap: string; who: string; mine?: boolean };

/**
 * 사진첩 탭 (3칸 격자 · 누르면 크게). 가입 안 한 사람만 6장 흐리게 (inC = 잠금 없이 보기 · model clubOpen, 프로토타입 .lg-album · lgAlbumView).
 * 멤버 · 호스트는 [사진 올리기]로 여러 장을 올려요 (최근 것이 먼저). 내 동아리는 예시 사진 없이 올린 사진만. 맞는 API: 67 `/clubs/:id/photos`
 */
export function ClubAlbum({ c, inC, myName }: { c: Club; inC: boolean; myName: string }) {
  const [w, setW] = useState(0);
  const [view, setView] = useState<number | null>(null);
  const ups = useMeetStore((s) => s.photos[c.id]);
  const { album, name } = clubContent(c);
  const h = hashId(c.id);
  const cell = w ? (w - 8) / 3 : 0;
  const shots: Shot[] = [
    ...(ups ?? []).map((p) => ({ uri: p.uri, cap: p.cap ?? '', who: p.w, mine: p.w === myName })),
    ...album.map(([k, cap], i) => ({ art: k, cap, who: name(['H', 'A', 'B', 'C', 'D'][i % 5]) })),
  ];
  const upload = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 10, quality: 0.8 });
    if (r.canceled || !r.assets.length) return;
    addPhotos(
      c.id,
      r.assets.map((a) => ({ uri: a.uri, w: myName, at: Date.now() })),
    );
    sfx('save');
    showToast(`사진 ${r.assets.length}장을 올렸어요 · 멤버끼리만 보여요`);
  };
  const grid = (L: Shot[], tap: boolean) => (
    <View style={styles.grid} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {cell
        ? L.map((x, i) => (
            <Pressable key={x.uri ?? i} disabled={!tap} onPress={() => setView(i)} accessibilityRole={tap ? 'button' : undefined} accessibilityLabel={`${x.cap || '사진'} 크게 보기`} style={styles.ap}>
              {x.uri ? <Image source={{ uri: x.uri }} style={{ width: cell - 2, height: cell - 2 }} contentFit="cover" cachePolicy="memory-disk" /> : <AlbumThumb k={x.art ?? 'cafe'} size={cell - 2} />}
              {tap && !x.uri ? (
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
    return shots.length ? (
      <Peek icon="image" title={`사진 ${shots.length}장 중 ${Math.min(6, shots.length)}장만 보여요`} desc="가입하면 정기 모임 사진을 모두 보고 크게 볼 수 있어요.">
        {grid(shots.slice(0, 6), false)}
      </Peek>
    ) : (
      <PText style={[styles.hint, { marginTop: 20 }]}>아직 올라온 사진이 없어요.</PText>
    );
  return (
    <View style={{ marginTop: 14 }}>
      <Pressable onPress={upload} accessibilityRole="button" style={styles.up}>
        <Icon name="plus" size={16} strokeWidth={2.8} />
        <PText style={styles.upT}>사진 올리기</PText>
      </Pressable>
      {shots.length ? grid(shots, true) : <PText style={[styles.hint, { marginTop: 14 }]}>아직 올라온 사진이 없어요. 정기 모임 사진을 첫 번째로 올려 보세요.</PText>}
      <PText style={styles.hint}>멤버끼리만 보여요</PText>
      <AlbumViewer
        list={shots}
        start={view}
        onClose={() => setView(null)}
        onRemove={(x) => {
          if (!x.uri) return;
          removePhoto(c.id, x.uri);
          setView(null);
          showToast('사진을 지웠어요');
        }}
      />
    </View>
  );
}

/** 크게 보기: 올린 사람 · 캡션 · 옆으로 넘기기 · 내가 올린 사진은 지우기 */
function AlbumViewer({ list, start, onClose, onRemove }: { list: Shot[]; start: number | null; onClose: () => void; onRemove: (x: Shot) => void }) {
  const [w, setW] = useState(0);
  const [i, setI] = useState(0);
  const insets = useSafeAreaInsets();
  const cur = list[i];
  return (
    <LayerModal visible={start != null} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.pv} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        <View style={[styles.pvTop, { paddingTop: insets.top + 10 }]}>
          <PText style={styles.pvN}>{`${i + 1} / ${list.length}`}</PText>
          {cur?.mine ? (
            <Pressable onPress={() => onRemove(cur)} accessibilityRole="button" style={styles.pvDel} hitSlop={8}>
              <PText style={styles.pvDelT}>지우기</PText>
            </Pressable>
          ) : null}
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="닫기" style={styles.pvX} hitSlop={8}>
            <Icon name="x" size={22} color="#fff" strokeWidth={2.6} />
          </Pressable>
        </View>
        {w ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} contentOffset={{ x: (start ?? 0) * w, y: 0 }} onLayout={() => setI(start ?? 0)} onMomentumScrollEnd={(e) => setI(Math.round(e.nativeEvent.contentOffset.x / w))}>
            {list.map((x, j) => (
              <View key={x.uri ?? j} style={{ width: w, paddingHorizontal: 20, justifyContent: 'center', gap: 12 }}>
                {x.uri ? <Image source={{ uri: x.uri }} style={[styles.big, { width: w - 40, height: w - 40 }]} contentFit="contain" /> : <AlbumThumb k={x.art ?? 'cafe'} size={w - 40} style={styles.big} />}
                <PText style={styles.cap}>
                  <PText style={styles.capB}>{x.who}</PText> {x.cap}
                </PText>
              </View>
            ))}
          </ScrollView>
        ) : null}
      </View>
    </LayerModal>
  );
}

const styles = StyleSheet.create({
  up: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, marginBottom: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.ink, borderRadius: 14, backgroundColor: Colors.white },
  upT: { fontFamily: Font.body900, fontSize: 14, lineHeight: 19 },
  pvDel: { position: 'absolute', left: 16, bottom: 12 },
  pvDelT: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18, color: '#fff', textDecorationLine: 'underline' },
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
