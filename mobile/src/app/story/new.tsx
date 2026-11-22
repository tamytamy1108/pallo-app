import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { LgIcon } from '@/components/lounge/icons';
import { LgButton } from '@/components/lounge/lg-button';
import { RouteSheetScreen, useRouteSheet } from '@/components/lounge/route-sheet';
import { CheckBoxList, CheckRow } from '@/components/lounge/trip';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { LG_C, LG_SCAT, STORY_CATS, type StoryCat } from '@/data/lounge';
import { addPost, addStory } from '@/data/lounge-store';
import { useMe } from '@/state/me';

/**
 * 스토리 올리기 (프로토타입 lgStNew): 카테고리(이벤트는 리더 · 매니저만) · 한 줄 이야기 · 사진(선택) · 체크 옵션.
 * 24시간 동안 내 얼굴 동그라미로 보이고, 그다음엔 고른 카테고리 하이라이트로 옮겨져요.
 * 사진은 기기 안에서만 보여요 — 올리기(업로드)는 백엔드 Q-T7.
 */
export default function StoryNewScreen() {
  const me = useMe();
  const { sheetProps, close } = useRouteSheet();
  const staff = me.role === 'leader' || me.role === 'manager';
  const cats = STORY_CATS.filter((k) => k !== 'event' || staff);
  const [cat, setCat] = useState<StoryCat>(cats[0]);
  const [text, setText] = useState('');
  const [img, setImg] = useState<string | null>(null);
  const [feed, setFeed] = useState(false);
  const [pin, setPin] = useState(false);

  const pick = async () => {
    if (img) return setImg(null);
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.86 });
    if (!r.canceled && r.assets[0]) setImg(r.assets[0].uri);
  };
  const submit = () => {
    const t = text.trim();
    if (!t) return showToast('한 줄 이야기를 적어 주세요');
    const c = LG_SCAT[cat];
    const role = me.role === 'leader' ? '리더' : me.role === 'manager' ? '매니저' : '';
    addStory({
      id: `my${Date.now()}`,
      who: me.name,
      av: LG_C.y,
      role,
      br: me.branch,
      cat,
      time: '방금',
      h: 0,
      big: t,
      ds: feed ? '커뮤니티 피드에도 올렸어요' : '24시간 동안 내 스토리로 보여요',
      art: [c.color === LG_C.ink ? LG_C.y : c.color, c.name],
      mine: true,
      pin: pin || undefined,
      img: img ?? undefined,
    });
    if (feed)
      addPost({
        id: `f${Date.now()}`,
        k: 'post',
        c0: 0,
        rec: true,
        cat: 'daily',
        who: me.name,
        av: LG_C.y,
        br: me.branch,
        role: '',
        time: '방금',
        pic: img ? undefined : cat === 'rev' ? 'run' : cat === 'event' ? 'party' : 'cafe',
        imgs: img ? [img] : undefined,
        n: 1,
        likes: 0,
        text: t,
      });
    close();
    showToast(pin ? `고정 스토리로 올렸어요 · ${c.name} 하이라이트 맨 앞에 남아요` : `스토리를 올렸어요 · 24시간 뒤 ${c.name} 하이라이트로 옮겨져요`);
  };

  return (
    <>
      <RouteSheetScreen />
      <Sheet {...sheetProps} title="스토리 올리기" footer={<LgButton label="스토리 올리기" wide height={50} onPress={submit} />}>
        <PText style={styles.ds}>24시간 동안 내 얼굴 동그라미로 보이고, 그다음엔 고른 카테고리 하이라이트에 자동으로 모여요.</PText>
        <View style={styles.grid} accessibilityRole="radiogroup">
          {cats.map((k) => {
            const c = LG_SCAT[k];
            const bg = k === 'event' ? '#fff' : c.color;
            const fg = c.color === LG_C.pu ? '#fff' : Colors.ink;
            const on = cat === k;
            return (
              <Pressable key={k} onPress={() => setCat(k)} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={`${c.name} · ${c.desc}`} style={[styles.cell, on && styles.cellOn]}>
                <View style={styles.plate} />
                <View style={[styles.tile, { backgroundColor: bg }]}>
                  <LgIcon name={c.icon} size={22} color={fg} />
                  <PText style={[styles.b, { color: fg }]}>{c.name}</PText>
                  <PText style={[styles.small, { color: fg }]}>{c.desc}</PText>
                </View>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.fl}>
          <PText style={styles.lb}>한 줄 이야기</PText>
          <TextInput value={text} onChangeText={setText} placeholder="예) 오늘 세션 끝! 영어로만 20분 버텼어요" placeholderTextColor="#8C8597" style={styles.input} accessibilityLabel="한 줄 이야기" />
        </View>
        <Pressable onPress={pick} accessibilityRole="button" style={[styles.photo, img ? styles.photoOn : null]}>
          {img ? <Image source={{ uri: img }} style={styles.thumb} contentFit="cover" /> : <LgIcon name="image" size={26} />}
          <PText style={styles.photoText}>{img ? '사진 1장 넣었어요 · 다시 누르면 빼요' : '사진 넣기 (선택)'}</PText>
        </Pressable>
        <CheckBoxList>
          <CheckRow first text="커뮤니티 피드에도 올리기 · 24시간 뒤에도 남아요" on={feed} onPress={() => setFeed(!feed)} />
          {me.role === 'manager' ? <CheckRow text="매니저 고정 · 사라지지 않고 맨 앞에 보여요" on={pin} onPress={() => setPin(!pin)} /> : null}
        </CheckBoxList>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  ds: { fontFamily: Font.body600, fontSize: 14, lineHeight: 22.4, color: Colors.inkSub },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: { width: '47.5%', borderRadius: 21, marginRight: 3, marginBottom: 3 },
  cellOn: { outlineWidth: 3, outlineColor: Colors.purple, outlineStyle: 'solid', outlineOffset: 2 },
  plate: { position: 'absolute', left: 3, top: 3, right: -3, bottom: -3, borderRadius: 18, backgroundColor: Colors.ink },
  tile: { minHeight: 98, borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, padding: 14, gap: 6 },
  b: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  small: { fontFamily: Font.body600, fontSize: 12, lineHeight: 16.8 },
  fl: { gap: 6 },
  lb: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 17 },
  input: { height: 46, backgroundColor: '#fff', borderWidth: 2, borderColor: Colors.ink, borderRadius: 14, paddingHorizontal: 14, fontFamily: Font.body700, fontSize: 14, color: Colors.ink },
  photo: { height: 96, borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.ink, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', gap: 6, flexDirection: 'row' },
  photoOn: { borderStyle: 'solid', backgroundColor: Colors.lavender },
  thumb: { width: 56, height: 56, borderRadius: 10, borderWidth: 2, borderColor: Colors.ink },
  photoText: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18 },
});
