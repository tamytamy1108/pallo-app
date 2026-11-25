import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import { Linking, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LgIcon } from '@/components/lounge/icons';
import { LgButton } from '@/components/lounge/lg-button';
import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { LG_C, LG_SCAT, type StoryCat } from '@/data/lounge';

/** 찍거나 고른 사진 (원본 크기는 맞추기 틀의 비율로 써요) */
export type StoryShot = { uri: string; width: number; height: number };

const isWeb = Platform.OS === 'web';
/** 앨범 칸 미리 보기: 이번에 앱을 켠 뒤 마지막으로 고른 사진 (사진 보관함 전체를 읽는 권한은 따로 받지 않아요) */
const recent: { uri?: string } = {};
const rememberPick = (uri: string) => {
  recent.uri = uri;
};
const lastPick = () => recent.uri;

/** 스토리 카테고리 칩 색 — 이벤트(잉크)는 어두운 화면에서 안 보이니 노랑으로 */
export function storyChipColors(cat: StoryCat) {
  const c = LG_SCAT[cat];
  const bg = c.color === LG_C.ink ? LG_C.y : c.color;
  return { bg, fg: bg === LG_C.pu ? Colors.white : Colors.ink };
}

type Props = {
  cats: StoryCat[];
  cat: StoryCat;
  onCat: (c: StoryCat) => void;
  onShot: (s: StoryShot) => void;
  onClose: () => void;
};

/**
 * 스토리 1단계 — 카메라 (인스타그램처럼 바로 찍기).
 * 위: 닫기 · '스토리 · 24시간 동안 보여요' · 플래시. 화면 아래: 카테고리 칩. 그 아래: 앨범 · 셔터 · 앞뒤 바꾸기.
 * 카메라 권한이 없으면 허용 안내를 보여 주고, 앨범에서 고르기는 그대로 돼요. 웹은 카메라 없이 앨범만.
 */
export function StoryCamera({ cats, cat, onCat, onShot, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [perm, requestPerm] = useCameraPermissions();
  const cam = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState(false);
  const [thumb, setThumb] = useState(lastPick);
  const live = !isWeb && !!perm?.granted;

  const pickAlbum = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.86 });
    const a = r.canceled ? undefined : r.assets[0];
    if (!a) return;
    rememberPick(a.uri);
    setThumb(a.uri);
    onShot({ uri: a.uri, width: a.width, height: a.height });
  };
  const shoot = async () => {
    if (!cam.current || !ready || busy) return;
    setBusy(true);
    try {
      const p = await cam.current.takePictureAsync({ quality: 0.86 });
      onShot({ uri: p.uri, width: p.width, height: p.height });
    } catch {
      showToast('사진을 못 찍었어요 · 한 번 더 눌러 주세요');
    } finally {
      setBusy(false);
    }
  };
  const allow = () => {
    if (perm && !perm.canAskAgain) Linking.openSettings();
    else requestPerm();
  };

  return (
    <View style={styles.root}>
      <View style={styles.finder}>
        {live ? (
          <CameraView
            ref={cam}
            style={StyleSheet.absoluteFill}
            facing={facing}
            flash={flash ? 'on' : 'off'}
            mirror={facing === 'front'}
            onCameraReady={() => setReady(true)}
            onMountError={() => showToast('카메라를 못 켰어요 · 앨범에서 골라 주세요')}
          />
        ) : (
          <View style={styles.ask}>
            <View style={styles.askIcon}>
              <LgIcon name={isWeb ? 'image' : 'cam'} size={30} color={Colors.ink} />
            </View>
            {isWeb ? (
              <>
                <PText style={styles.askT}>웹에서는 앨범에서 골라요</PText>
                <PText style={styles.askD}>앱에서는 여기서 바로 사진을 찍을 수 있어요.</PText>
                <LgButton label="앨범에서 사진 고르기" height={44} fontSize={14} onPress={pickAlbum} style={styles.askBtn} />
              </>
            ) : perm ? (
              <>
                <PText style={styles.askT}>카메라를 허용해 주세요</PText>
                <PText style={styles.askD}>{perm.canAskAgain ? '스토리 사진을 여기서 바로 찍을 수 있어요.\n앨범에서 골라도 돼요.' : '설정에서 카메라를 켜면 바로 찍을 수 있어요.\n앨범에서 골라도 돼요.'}</PText>
                <LgButton label={perm.canAskAgain ? '카메라 허용하기' : '설정 열기'} height={44} fontSize={14} onPress={allow} style={styles.askBtn} />
              </>
            ) : null}
          </View>
        )}

        <View style={[styles.top, { paddingTop: Math.max(insets.top, 12) + 4 }]} pointerEvents="box-none">
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="닫기" hitSlop={6} style={styles.round}>
            <LgIcon name="x" size={22} color={Colors.white} sw={2.6} />
          </Pressable>
          <View style={styles.pill}>
            <PText style={styles.pillT}>스토리 · 24시간 동안 보여요</PText>
          </View>
          {live ? (
            <Pressable
              onPress={() => setFlash(!flash)}
              accessibilityRole="switch"
              accessibilityLabel="플래시"
              accessibilityState={{ checked: flash }}
              hitSlop={6}
              style={[styles.round, flash && styles.roundOn]}>
              <LgIcon name="bolt" size={20} color={flash ? Colors.ink : Colors.white} fill={flash ? Colors.ink : 'none'} />
            </Pressable>
          ) : (
            <View style={styles.roundGhost} />
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsWrap} contentContainerStyle={styles.chips} accessibilityRole="radiogroup">
          {cats.map((k) => {
            const on = cat === k;
            const { bg, fg } = storyChipColors(k);
            return (
              <Pressable
                key={k}
                onPress={() => onCat(k)}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${LG_SCAT[k].name} · ${LG_SCAT[k].desc}`}
                style={[styles.chip, on && { backgroundColor: bg, borderColor: bg }]}>
                <LgIcon name={LG_SCAT[k].icon} size={14} color={on ? fg : Colors.white} sw={2.4} />
                <PText style={[styles.chipT, { color: on ? fg : Colors.white }]}>{LG_SCAT[k].name}</PText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 14) + 8 }]}>
        <Pressable onPress={pickAlbum} accessibilityRole="button" accessibilityLabel="앨범에서 사진 고르기" style={styles.album}>
          <View style={styles.albumTile}>{thumb ? <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <LgIcon name="image" size={22} color={Colors.white} />}</View>
          <View style={styles.plus}>
            <LgIcon name="plus" size={12} color={Colors.ink} sw={3.4} />
          </View>
        </Pressable>
        {live ? (
          <Pressable onPress={shoot} disabled={!ready || busy} accessibilityRole="button" accessibilityLabel="사진 찍기" accessibilityState={{ disabled: !ready || busy }} style={styles.shutter}>
            {({ pressed }) => <View style={[styles.shutterIn, (pressed || busy) && styles.shutterDown]} />}
          </Pressable>
        ) : (
          <Pressable onPress={isWeb ? pickAlbum : allow} accessibilityRole="button" accessibilityLabel={isWeb ? '앨범에서 사진 고르기' : '카메라 허용하기'} style={[styles.shutter, styles.shutterOff]} />
        )}
        {live ? (
          <Pressable onPress={() => setFacing(facing === 'back' ? 'front' : 'back')} accessibilityRole="button" accessibilityLabel={facing === 'back' ? '앞 카메라로 바꾸기' : '뒤 카메라로 바꾸기'} style={styles.side}>
            <LgIcon name="flip" size={24} color={Colors.white} sw={2.3} />
          </Pressable>
        ) : (
          <View style={styles.sideGhost} />
        )}
      </View>
    </View>
  );
}

const DARK = '#0E0C14';
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DARK },
  finder: { flex: 1, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden', backgroundColor: Colors.ink },
  ask: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 32 },
  askIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.yellow, borderWidth: 2, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  askT: { fontFamily: Font.body900, fontSize: 18, lineHeight: 25, color: Colors.white, textAlign: 'center' },
  askBtn: { alignSelf: 'center' },
  askD: { fontFamily: Font.body600, fontSize: 13.5, lineHeight: 20, color: 'rgba(255,255,255,0.72)', textAlign: 'center', marginBottom: 8 },
  top: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
  round: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(14,12,20,0.42)', alignItems: 'center', justifyContent: 'center' },
  roundOn: { backgroundColor: Colors.yellow },
  roundGhost: { width: 42, height: 42 },
  pill: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: 'rgba(14,12,20,0.42)' },
  pillT: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 17, color: Colors.white },
  chipsWrap: { position: 'absolute', left: 0, right: 0, bottom: 16, flexGrow: 0 },
  chips: { gap: 8, paddingHorizontal: 16 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 36, paddingHorizontal: 13, borderRadius: 18, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(14,12,20,0.4)' },
  chipT: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18 },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 18, paddingHorizontal: 34 },
  album: { width: 48, height: 48 },
  albumTile: { width: 46, height: 46, borderRadius: 12, borderWidth: 2, borderColor: Colors.white, backgroundColor: 'rgba(255,255,255,0.14)', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  plus: { position: 'absolute', right: -6, bottom: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.yellow, borderWidth: 2, borderColor: DARK, alignItems: 'center', justifyContent: 'center' },
  shutter: { width: 82, height: 82, borderRadius: 41, borderWidth: 5, borderColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  shutterIn: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.white },
  shutterDown: { transform: [{ scale: 0.9 }], opacity: 0.8 },
  shutterOff: { opacity: 0.28 },
  side: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  sideGhost: { width: 48, height: 48 },
});
