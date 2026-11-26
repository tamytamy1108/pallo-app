import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FramedImage, PhotoFrame } from '@/components/ui/photo-frame';
import { PhotoReorderRow } from '@/components/ui/photo-reorder-row';
import { Pressable } from '@/components/ui/pressable';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { addCheckin, chCat, unitOf, type Challenge, type ChPhoto } from '@/data/challenge';
import { haptic, sfx } from '@/lib/feedback';
import { plainFraming, type PhotoFraming } from '@/lib/photo-framing';

import { ChIcon } from './icons';
import { Field, FieldLabel, LgBtn, SUB } from './parts';

/** 사진 인증 한 번에 넣을 수 있는 장 수 (LG_IMG_MAX_N) */
const MAX_PHOTOS = 10;

/** 고른 사진 · 맞춘 모양 (확대 · 위치 — 원본 비율은 framing.aspect) */
type Draft = { uri: string; framing: PhotoFraming };

/**
 * 오늘 인증 시트 (프로토타입 lgChkSheet · lgPostStep1 · lgChkStep2).
 * - 댓글 방식: 한 줄 소감 → [인증하기]
 * - 사진 + 댓글 방식: ① 앨범 · 촬영으로 사진 고르기(여러 장 · 원본 비율 ↔ 1:1) → [다음] ② 한 줄 소감(선택) → [인증하기]
 *   사진 없이는 다음으로 못 가요.
 * challenge 가 있으면 열려요. 하루 한 번만 — 이미 인증했으면 부르는 쪽에서 막아요.
 * onPosted: 올린 뒤 (상세 화면이 인증 탭의 내 글로 옮겨 줘요)
 */
export function CheckSheet({ challenge, onClose, onPosted }: { challenge: Challenge | null; onClose: () => void; onPosted?: () => void }) {
  // 닫히는 동안에도 내용이 남아 있게 마지막 챌린지를 들고 있어요
  const [held, setHeld] = useState<Challenge | null>(challenge);
  if (challenge && challenge !== held) setHeld(challenge);
  const p = challenge ?? held;
  const [text, setText] = useState('');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [cur, setCur] = useState(0);
  const [square, setSquare] = useState(true);
  const [step, setStep] = useState<1 | 2>(1);

  const reset = () => {
    setText('');
    setDrafts([]);
    setCur(0);
    setSquare(true);
    setStep(1);
  };
  if (!p) return null;
  const photo = p.way === 'photo';
  const study = chCat(p.cat).key === 'study';
  const ratio = square || !drafts[0] ? 1 : drafts[0].framing.aspect;

  const add = (assets: ImagePicker.ImagePickerAsset[]) => {
    const next = [...drafts, ...assets.map((a) => ({ uri: a.uri, framing: plainFraming(a.width, a.height) }))].slice(0, MAX_PHOTOS);
    if (!next.length) return;
    sfx('pick');
    setDrafts(next);
    setCur(drafts.length);
  };
  const pickAlbum = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: MAX_PHOTOS - drafts.length, quality: 0.85 });
    if (!r.canceled) add(r.assets);
  };
  const shoot = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      showToast('카메라를 쓰려면 권한을 허용해 주세요');
      return;
    }
    const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (!r.canceled) add(r.assets);
  };
  const reframe = (i: number, framing: PhotoFraming) => setDrafts((L) => L.map((x, k) => (k === i ? { ...x, framing } : x)));
  // 순서를 바꿔도 지금 맞추던 사진은 그대로 골라져 있어요
  const reorder = (next: typeof drafts) => {
    const now = drafts[cur];
    setDrafts(next);
    if (now) setCur(Math.max(0, next.indexOf(now)));
  };
  const unPick = () => {
    const next = drafts.filter((_, i) => i !== cur);
    setDrafts(next);
    setCur(Math.max(0, Math.min(cur, next.length - 1)));
    sfx('tap');
  };

  const done = () => {
    const v = text.trim();
    if (photo && !drafts.length) {
      showToast('인증 사진을 1장 이상 올려 주세요');
      return;
    }
    if (!photo && !v) {
      showToast('댓글 한 줄을 남겨 주세요');
      return;
    }
    const photos: ChPhoto[] = drafts.map((d) => ({ uri: d.uri, ratio, framing: d.framing }));
    addCheckin(p, { x: v || '오늘 인증!', photos });
    onPosted?.();
    sfx('save');
    haptic('success');
    onClose();
    showToast(`오늘 체크했어요 · ${p.day + 1}${unitOf(p)}째`);
  };

  const footBtn = (label: string, onPress: () => void) => <LgBtn label={label} onPress={onPress} height={52} fontSize={15.5} wide />;

  // 사진 방식 2단계: 고른 사진 + 한 줄 소감
  if (photo && step === 2) {
    return (
      <Sheet open={!!challenge} onClose={onClose} onClosed={reset} label="오늘 인증 · 소감" footer={footBtn('인증하기', done)}>
        <View style={styles.shd}>
          <Pressable onPress={() => setStep(1)} accessibilityRole="button" accessibilityLabel="사진 다시 고르기" hitSlop={8} style={styles.back}>
            <ChIcon name="back" size={22} width={2.6} />
          </Pressable>
          <PText variant="title">오늘 인증하기</PText>
        </View>
        <View style={styles.pthumb}>
          <View>
            <View style={[styles.thumb, { aspectRatio: ratio }]}>
              {drafts[0] ? <FramedImage uri={drafts[0].uri} framing={drafts[0].framing} accessibilityLabel={`인증 사진 ${drafts.length}장 중 첫 장`} /> : null}
            </View>
            {drafts.length > 1 ? (
              <View style={styles.thumbN}>
                <PText style={styles.thumbNT}>{drafts.length}</PText>
              </View>
            ) : null}
          </View>
          <PText style={styles.pthumbT}>{`${p.name}\n인증 탭에 사진이 먼저, 그 아래 소감이 보여요`}</PText>
        </View>
        <Field multiline value={text} onChangeText={setText} placeholder="한 줄 소감 (선택) · 예) 오늘은 오트밀이랑 바나나!" accessibilityLabel="한 줄 소감" />
      </Sheet>
    );
  }

  if (photo) {
    const d = drafts[cur];
    return (
      <Sheet
        open={!!challenge}
        onClose={onClose}
        onClosed={reset}
        title="오늘 인증하기"
        label="오늘 인증 · 사진"
        footer={footBtn(drafts.length ? '다음' : '인증 사진을 골라 주세요', () => (drafts.length ? setStep(2) : showToast('인증 사진을 1장 이상 골라 주세요')))}>
        <PText style={styles.ds}>{`${p.name}\n${p.guide || ''}`}</PText>
        {d ? (
          <View>
            {/* 사진 칸은 늘 같은 크기 — 사진 비율 · 비율 바꾸기에 따라 틀만 칸 가운데서 바뀌고 아래 줄 · 시트 높이는 그대로예요 */}
            <View style={styles.stage}>
              <PhotoFrame key={d.uri} uri={d.uri} framing={d.framing} onChange={(f) => reframe(cur, f)} style={[styles.prev, frameSize(ratio)]} accessibilityLabel="올릴 사진 맞추기">
                <Pressable onPress={() => setSquare((v) => !v)} accessibilityRole="button" accessibilityLabel="비율 바꾸기 · 원본 비율 ↔ 1:1 정사각형" style={styles.ratioTg}>
                  <ChIcon name="ratio" size={16} color={Colors.white} width={2.6} />
                </Pressable>
                <View style={styles.unPick}>
                  <LgBtn label="사진 빼기" tone="white" height={34} fontSize={12.5} onPress={unPick} />
                </View>
              </PhotoFrame>
            </View>
            {/* 고른 사진 줄: 눌러서 맞출 사진 고르기 · 끌어서 순서 바꾸기 (첫 장이 인증 목록에 먼저 보여요) */}
            <PhotoReorderRow
              items={drafts}
              keyOf={(x) => x.uri}
              itemWidth={58 * ratio}
              itemHeight={58}
              onReorder={reorder}
              contentContainerStyle={styles.strip}
              renderItem={(x, i, a11y) => (
                <Pressable
                  onPress={() => setCur(i)}
                  accessibilityRole="button"
                  accessibilityLabel={`${i + 1}번째 사진 맞추기`}
                  accessibilityState={{ selected: i === cur }}
                  {...a11y}
                  style={[styles.sth, { width: 58 * ratio }, i === cur && styles.sthOn]}>
                  <FramedImage uri={x.uri} framing={x.framing} />
                  <PText style={styles.sthN}>{i + 1}</PText>
                </Pressable>
              )}
              trailing={
                drafts.length < MAX_PHOTOS ? (
                  <Pressable onPress={pickAlbum} accessibilityRole="button" accessibilityLabel="사진 더 넣기" style={[styles.sth, styles.sthAdd, { aspectRatio: ratio }]}>
                    <ChIcon name="plus" size={20} width={2.8} />
                  </Pressable>
                ) : null
              }
            />
          </View>
        ) : (
          <View style={styles.photos}>
            <Pressable onPress={pickAlbum} accessibilityRole="button" style={({ pressed }) => [styles.photo, pressed && styles.photoOn]}>
              <ChIcon name="image" size={26} />
              <PText style={styles.photoT}>앨범에서 고르기</PText>
            </Pressable>
            <Pressable onPress={shoot} accessibilityRole="button" style={({ pressed }) => [styles.photo, pressed && styles.photoOn]}>
              <ChIcon name="cam" size={26} />
              <PText style={styles.photoT}>사진 찍기</PText>
            </Pressable>
          </View>
        )}
      </Sheet>
    );
  }

  return (
    <Sheet open={!!challenge} onClose={onClose} onClosed={reset} title="오늘 인증하기" label="오늘 인증" footer={footBtn('인증하기', done)}>
      <PText style={styles.ds}>
        {`${p.name}\n`}
        {study ? (
          <>
            오늘 <PText style={styles.dsB}>{p.hl}</PText>를 넣어 한 문장 써요
          </>
        ) : (
          p.guide || ''
        )}
      </PText>
      <View style={styles.fl}>
        <FieldLabel>댓글로 인증</FieldLabel>
        <Field multiline value={text} onChangeText={setText} placeholder={study ? 'I’d like to …' : '예) 오늘은 오트밀이랑 바나나!'} accessibilityLabel="인증 댓글" />
      </View>
    </Sheet>
  );
}

/** 인증 사진 칸 (테두리 포함) — 세로 사진은 높이 340, 정사각 · 가로 사진은 폭 260 에 맞춰요 */
const STAGE_W = 260;
const STAGE_H = 340;
const frameSize = (ratio: number) => {
  const w = Math.min(STAGE_W, STAGE_H * ratio);
  return { width: w, height: w / ratio };
};

const styles = StyleSheet.create({
  ds: { fontFamily: Font.body600, fontSize: 14, lineHeight: 22.4, color: SUB },
  dsB: { fontFamily: Font.body800, fontSize: 14, color: SUB },
  fl: { gap: 6 },
  photos: { flexDirection: 'row', gap: 10 },
  photo: { flex: 1, height: 100, borderRadius: 18, borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', gap: 6 },
  photoOn: { transform: [{ scale: 0.97 }] },
  photoT: { fontFamily: Font.body900, fontSize: 13, lineHeight: 19 },
  stage: { width: STAGE_W, height: STAGE_H, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  prev: { borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.ink, overflow: 'hidden' },
  ratioTg: { position: 'absolute', left: 10, bottom: 10, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(30,26,43,0.72)', alignItems: 'center', justifyContent: 'center' },
  unPick: { position: 'absolute', right: 7, bottom: 7 },
  strip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 12, paddingHorizontal: 2, paddingBottom: 4 },
  sth: { height: 58, borderRadius: 10, borderWidth: 2, borderColor: Colors.line, backgroundColor: Colors.ink, overflow: 'hidden' },
  sthOn: { borderColor: Colors.ink, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 2, color: Colors.yellow }] },
  sthAdd: { borderStyle: 'dashed', borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  sthN: { position: 'absolute', left: 4, top: 4, fontFamily: Font.display, fontSize: 10, lineHeight: 11, color: Colors.white, textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  shd: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: -6 },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  pthumb: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 64, borderRadius: 10, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.ink, overflow: 'hidden' },
  thumbN: { position: 'absolute', right: -6, top: -6, minWidth: 22, height: 22, borderRadius: 11, backgroundColor: Colors.ink, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  thumbNT: { fontFamily: Font.display, fontSize: 11, lineHeight: 22, color: Colors.white },
  pthumbT: { flex: 1, fontFamily: Font.body700, fontSize: 13, lineHeight: 19.5, color: SUB },
});
