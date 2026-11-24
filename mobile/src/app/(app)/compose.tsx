import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { GrowInput } from '@/components/ui/grow-input';
import { Pressable } from '@/components/ui/pressable';
import { LgIcon } from '@/components/lounge/icons';
import { LgButton } from '@/components/lounge/lg-button';
import { RouteSheetScreen, useRouteSheet } from '@/components/lounge/route-sheet';
import { Pills } from '@/components/lounge/trip';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { LG_C, LG_PCAT } from '@/data/lounge';
import { addPost, getLounge, setLoungeTab } from '@/data/lounge-store';
import { useMe } from '@/state/me';

/*
 * 글쓰기 2단계 (프로토타입 lgPostNew · lgPostStep1 · lgPostStep2).
 * ① 새 게시물: 앨범(한 번에 최대 10장) · 사진 찍기 → 원본 비율로 미리 보기 (4:6 ~ 1.91:1 안으로 맞춤),
 *    두 손가락 확대(최대 4배) · 한 손가락 이동, ⤢ = 원본 비율 ↔ 1:1 (모든 사진 같은 비율), 아래 줄에서 사진 바꾸기 · + · 사진 빼기.
 * ② 글쓰기: 글 칸 → '어떤 글인가요?'. ‹ 로 돌아가도 사진 · 카테고리 · 글이 남아요.
 * 사진 올리기(긴 변 1080px로 줄여 업로드)는 백엔드 Q-T7 — 지금은 기기 안 주소 그대로 가짜 글에 붙여요.
 */
const MAX_N = 10;
const MAX_MB = 20;
const R_MIN = 4 / 6;
const R_MAX = 1.91;
const Z_MAX = 4;

type Draft = {
  uri: string;
  w: number;
  h: number;
  z: number;
  ox: number;
  oy: number;
};

export default function ComposeScreen() {
  const me = useMe();
  const { sheetProps, close } = useRouteSheet();
  const [step, setStep] = useState<1 | 2>(1);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [di, setDi] = useState(0);
  const [r, setR] = useState(1);
  const [rOrig, setROrig] = useState(1);
  const [cat, setCat] = useState('일상');
  const [text, setText] = useState('');

  const addAssets = (assets: ImagePicker.ImagePickerAsset[]) => {
    const room = MAX_N - drafts.length;
    const okAll = assets.filter((a) => !a.fileSize || a.fileSize <= MAX_MB * 1024 * 1024);
    const notes: string[] = [];
    if (okAll.length < assets.length) notes.push(`${assets.length - okAll.length}장은 빼고 넣었어요 (사진 파일 · ${MAX_MB}MB 이하만)`);
    if (okAll.length > room) notes.push(`최대 ${MAX_N}장까지라 ${okAll.length - room}장은 빼고 넣었어요`);
    const got = okAll.slice(0, Math.max(0, room)).map((a): Draft => ({
      uri: a.uri,
      w: a.width || 1,
      h: a.height || 1,
      z: 1,
      ox: 0,
      oy: 0,
    }));
    if (!got.length) return showToast(notes[0] ?? `사진은 ${MAX_N}장까지 넣을 수 있어요`);
    // 첫 사진의 원본 비율이 게시물 비율이 돼요 (한계 밖이면 한계로)
    if (!drafts.length) {
      const r0 = Math.min(R_MAX, Math.max(R_MIN, got[0].w / got[0].h));
      setR(r0);
      setROrig(r0);
      setDi(0);
    } else setDi(drafts.length);
    setDrafts([...drafts, ...got]);
    if (notes.length) showToast(notes.join(' · '));
  };
  const pickAlbum = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_N - drafts.length,
      quality: 1,
    });
    if (!res.canceled) addAssets(res.assets);
  };
  const pickCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return showToast('카메라를 쓸 수 있게 허용해 주세요');
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (!res.canceled) addAssets(res.assets);
  };
  const removeCur = () => {
    const L = drafts.filter((_, k) => k !== di);
    setDrafts(L);
    setDi(Math.min(di, Math.max(0, L.length - 1)));
  };
  // 비율을 바꾸면 모든 사진의 확대 · 위치를 처음으로
  const toggleRatio = () => {
    const alt = Math.abs(rOrig - 1) < 0.01 ? R_MIN : rOrig;
    setR(Math.abs(r - 1) < 0.01 ? alt : 1);
    setDrafts(drafts.map((d) => ({ ...d, z: 1, ox: 0, oy: 0 })));
  };
  const saveCrop = (i: number, z: number, ox: number, oy: number) => setDrafts((L) => L.map((d, k) => (k === i ? { ...d, z, ox, oy } : d)));

  const post = () => {
    const t = text.trim();
    if (!t) return showToast('내용을 적어 주세요');
    const pc = LG_PCAT.find((x) => x[1] === cat) ?? LG_PCAT[0];
    const imgs = drafts.map((d) => d.uri);
    addPost({
      id: `f${Date.now()}`,
      k: 'post',
      c0: 0,
      rec: true,
      cat: pc[0],
      club: pc[0] === 'club' ? '동아리' : undefined,
      who: me.name,
      av: LG_C.y,
      br: me.branch,
      role: '',
      time: '방금',
      imgs: imgs.length ? imgs : undefined,
      ratio: imgs.length ? r : undefined,
      n: Math.max(1, imgs.length),
      likes: 0,
      text: t,
      mine: true,
    });
    // 올린 글이 안 보이는 탭이면 커뮤니티로
    const tab = getLounge().tab;
    if (tab !== 'all' && tab !== 'com') setLoungeTab('com');
    close();
    showToast('커뮤니티에 올렸어요');
  };

  const cur = drafts[di];
  return (
    <>
      <RouteSheetScreen />
      <Sheet
        {...sheetProps}
        title={step === 1 ? '새 게시물' : undefined}
        label={step === 1 ? '새 게시물 · 사진' : '새 게시물 · 글쓰기'}
        scrollKey={step}
        footer={
          step === 1 ? (
            <LgButton label={drafts.length ? '다음' : '사진 없이 다음'} wide height={52} fontSize={15.5} onPress={() => setStep(2)} />
          ) : (
            <LgButton label="올리기" wide height={52} fontSize={15.5} onPress={post} />
          )
        }>
        {step === 1 ? (
          cur ? (
            <View>
              <CropFrame key={`${di}-${r}`} d={cur} r={r} onEnd={(z, ox, oy) => saveCrop(di, z, ox, oy)} onToggleRatio={toggleRatio} onRemove={removeCur} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
                {drafts.map((d, i) => (
                  <Pressable
                    key={d.uri + i}
                    onPress={() => setDi(i)}
                    accessibilityRole="button"
                    accessibilityLabel={`${i + 1}번째 사진 맞추기`}
                    accessibilityState={{ selected: i === di }}
                    style={[styles.sth, { width: 58 * r }, i === di && styles.sthOn]}>
                    <Image source={{ uri: d.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                    <PText style={styles.sthNo}>{i + 1}</PText>
                  </Pressable>
                ))}
                {drafts.length < MAX_N ? (
                  <Pressable onPress={pickAlbum} accessibilityRole="button" accessibilityLabel="사진 더 넣기" style={[styles.sth, styles.sthAdd, { width: 58 * r }]}>
                    <LgIcon name="plus" size={20} sw={2.8} />
                  </Pressable>
                ) : null}
                <PText style={styles.stn}>
                  {drafts.length}/{MAX_N}
                </PText>
              </ScrollView>
            </View>
          ) : (
            <View style={styles.photos}>
              <Pressable onPress={pickAlbum} accessibilityRole="button" style={({ pressed }) => [styles.photo, pressed && { transform: [{ scale: 0.97 }] }]}>
                <LgIcon name="image" size={26} />
                <PText style={styles.photoText}>앨범에서 고르기</PText>
              </Pressable>
              <Pressable onPress={pickCamera} accessibilityRole="button" style={({ pressed }) => [styles.photo, pressed && { transform: [{ scale: 0.97 }] }]}>
                <LgIcon name="cam" size={26} />
                <PText style={styles.photoText}>사진 찍기</PText>
              </Pressable>
            </View>
          )
        ) : (
          <>
            <View style={styles.shd}>
              <Pressable onPress={() => setStep(1)} accessibilityRole="button" accessibilityLabel="사진 다시 고르기" style={styles.ib}>
                <LgIcon name="back" size={22} sw={2.6} />
              </Pressable>
              <PText variant="title" accessibilityRole="header">
                글쓰기
              </PText>
            </View>
            {drafts.length ? (
              <View style={styles.pthumb}>
                <View>
                  <Image source={{ uri: drafts[0].uri }} style={[styles.pthumbImg, { aspectRatio: r }]} contentFit="cover" />
                  {drafts.length > 1 ? (
                    <View style={styles.pthumbN}>
                      <PText style={styles.pthumbNText}>{drafts.length}</PText>
                    </View>
                  ) : null}
                </View>
                <PText style={styles.pthumbText}>
                  {drafts.length > 1 ? `사진 ${drafts.length}장 · ` : ''}
                  {me.branch} 이름으로 커뮤니티 탭에 보여요
                </PText>
              </View>
            ) : (
              <PText style={styles.ds}>{me.branch} 이름으로 커뮤니티 탭에 보여요.</PText>
            )}
            <GrowInput
              value={text}
              onChangeText={setText}
              multiline
              placeholder="예) 오늘 세션에서 배운 표현, 카페에서 바로 써 봤어요!"
              placeholderTextColor="#8C8597"
              style={styles.ta}
              accessibilityLabel="글 내용"
            />
            <View style={styles.fl}>
              <PText style={styles.lb}>어떤 글인가요?</PText>
              <Pills opts={LG_PCAT.map((x) => x[1])} on={[cat]} onPick={setCat} />
            </View>
          </>
        )}
      </Sheet>
    </>
  );
}

/** 사진 맞추기 틀: 두 손가락 확대 · 축소(최대 4배) · 한 손가락 이동. 사진이 늘 틀을 다 덮어요 */
function CropFrame({ d, r, onEnd, onToggleRatio, onRemove }: { d: Draft; r: number; onEnd: (z: number, ox: number, oy: number) => void; onToggleRatio: () => void; onRemove: () => void }) {
  const FW = Math.min(300, 340 * r);
  const FH = FW / r;
  const s0 = Math.max(FW / d.w, FH / d.h);
  const W = d.w * s0;
  const H = d.h * s0;
  const z = useSharedValue(d.z);
  const ox = useSharedValue(d.ox);
  const oy = useSharedValue(d.oy);
  const start = useSharedValue({ z: d.z, ox: d.ox, oy: d.oy });
  const [drag, setDrag] = useState(false);
  const clampXY = (zz: number, x: number, y: number) => {
    'worklet';
    const mx = Math.max(0, (W * zz - FW) / 2);
    const my = Math.max(0, (H * zz - FH) / 2);
    return [Math.min(mx, Math.max(-mx, x)), Math.min(my, Math.max(-my, y))];
  };
  const begin = () => {
    'worklet';
    start.set({ z: z.get(), ox: ox.get(), oy: oy.get() });
    scheduleOnRN(setDrag, true);
  };
  const finish = () => {
    'worklet';
    scheduleOnRN(setDrag, false);
    scheduleOnRN(onEnd, z.get(), ox.get(), oy.get());
  };
  const pan = Gesture.Pan()
    .onBegin(begin)
    .onUpdate((e) => {
      const [x, y] = clampXY(z.get(), start.get().ox + e.translationX, start.get().oy + e.translationY);
      ox.set(x);
      oy.set(y);
    })
    .onFinalize(finish);
  const pinch = Gesture.Pinch()
    .onBegin(begin)
    .onUpdate((e) => {
      const zz = Math.min(Z_MAX, Math.max(1, start.get().z * e.scale));
      const [x, y] = clampXY(zz, ox.get(), oy.get());
      z.set(zz);
      ox.set(x);
      oy.set(y);
    })
    .onFinalize(finish);
  const img = useAnimatedStyle(() => ({
    transform: [{ translateX: ox.get() }, { translateY: oy.get() }, { scale: z.get() }],
  }));
  return (
    <View style={[styles.prev, { width: FW + 4, height: FH + 4 }]}>
      <GestureDetector gesture={Gesture.Simultaneous(pan, pinch)}>
        <View style={StyleSheet.absoluteFill} accessibilityLabel="올릴 사진 미리 보기 · 끌어서 위치 맞추기">
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: (FW - W) / 2,
                top: (FH - H) / 2,
                width: W,
                height: H,
              },
              img,
            ]}>
            <Image source={{ uri: d.uri }} style={StyleSheet.absoluteFill} contentFit="fill" />
          </Animated.View>
          {drag ? (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              {[1, 2].map((k) => (
                <View key={`v${k}`} style={[styles.gridV, { left: `${(k * 100) / 3}%` }]} />
              ))}
              {[1, 2].map((k) => (
                <View key={`h${k}`} style={[styles.gridH, { top: `${(k * 100) / 3}%` }]} />
              ))}
            </View>
          ) : null}
        </View>
      </GestureDetector>
      <Pressable onPress={onToggleRatio} accessibilityRole="button" accessibilityLabel="비율 바꾸기 · 원본 비율 ↔ 1:1 정사각형" style={styles.ratio}>
        <LgIcon name="ratio" size={16} color="#fff" sw={2.6} />
      </Pressable>
      <LgButton label="사진 빼기" tone="white" height={34} fontSize={12.5} onPress={onRemove} style={styles.unimg} />
    </View>
  );
}

const styles = StyleSheet.create({
  photos: { flexDirection: 'row', gap: 10 },
  photo: {
    flex: 1,
    height: 96,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.ink,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  photoText: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18 },
  prev: {
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: Colors.ink,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: Colors.ink,
  },
  gridV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  gridH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  ratio: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(30,26,43,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unimg: { position: 'absolute', right: 10, bottom: 10 },
  strip: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    paddingHorizontal: 2,
    paddingBottom: 4,
  },
  sth: {
    height: 58,
    borderWidth: 2,
    borderColor: Colors.line,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: Colors.ink,
  },
  sthOn: {
    borderColor: Colors.ink,
    boxShadow: `0px 0px 0px 2px ${Colors.yellow}`,
  },
  sthNo: {
    position: 'absolute',
    left: 4,
    top: 4,
    fontFamily: Font.display,
    fontSize: 10,
    lineHeight: 10,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sthAdd: {
    borderStyle: 'dashed',
    borderColor: Colors.ink,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stn: {
    marginLeft: 2,
    fontFamily: Font.body800,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.inkSub,
  },
  shd: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: -8 },
  ib: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pthumb: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pthumbImg: {
    width: 64,
    borderWidth: 2,
    borderColor: Colors.ink,
    borderRadius: 10,
  },
  pthumbN: {
    position: 'absolute',
    right: -6,
    top: -6,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.ink,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pthumbNText: {
    fontFamily: Font.display,
    fontSize: 11,
    lineHeight: 14,
    color: '#fff',
  },
  pthumbText: {
    flex: 1,
    fontFamily: Font.body700,
    fontSize: 13,
    lineHeight: 19.5,
    color: Colors.inkSub,
  },
  ds: {
    fontFamily: Font.body600,
    fontSize: 14,
    lineHeight: 22.4,
    color: Colors.inkSub,
  },
  ta: {
    minHeight: 110,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: Colors.ink,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontFamily: Font.body600,
    fontSize: 14,
    lineHeight: 22.4,
    color: Colors.ink,
    textAlignVertical: 'top',
  },
  fl: { gap: 6 },
  lb: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 17 },
});
