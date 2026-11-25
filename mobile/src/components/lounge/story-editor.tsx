import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { BackHandler, Keyboard, StyleSheet, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LgIcon } from '@/components/lounge/icons';
import { CheckBox, LgButton } from '@/components/lounge/lg-button';
import { storyChipColors } from '@/components/lounge/story-camera';
import { DraggableSticker, StickerColors, StickerLabel, stickerColor } from '@/components/lounge/story-sticker';
import { PhotoFrame } from '@/components/ui/photo-frame';
import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { LG_SCAT, type StickerSpot, type StoryCat } from '@/data/lounge';
import { useKeyboardLiftStyle } from '@/lib/keyboard';
import { isPlainFraming, type PhotoFraming } from '@/lib/photo-framing';

type Props = {
  img: { uri: string; framing: PhotoFraming };
  onFraming: (f: PhotoFraming) => void;
  cat: StoryCat;
  branch: string;
  /** 사진 위 글 (안 적어도 올릴 수 있어요) */
  text: string;
  onText: (t: string) => void;
  /** 글 스티커 자리 · 색 */
  spot: StickerSpot;
  onSpot: (s: StickerSpot) => void;
  /** 글 적기 칸을 열어 둘지 */
  typing: boolean;
  onTyping: (on: boolean) => void;
  feed: boolean;
  onFeed: () => void;
  /** 매니저만: 고정 스토리 */
  pin: boolean | null;
  onPin: () => void;
  onRetake: () => void;
  onSubmit: () => void;
};

/** 글 길이 (넘으면 다 적은 뒤 잘라요 — maxLength 는 한글 조합을 깨뜨려서 안 써요) */
const MAX_TEXT = 60;

/**
 * 스토리 2단계 — 사진 다듬고 올리기.
 * 사진은 두 손가락으로 키우고 끌어서 맞춰요 (PhotoFrame). 'Aa' 를 누르면 (원할 때만) 글을 적고 스티커 색을 골라요.
 * 사진 위 스티커는 끌어서 옮기고, 누르면 다시 고쳐요.
 * 왼쪽 아래 카테고리 · 지점 칩, 그 아래 '라운지 피드에도 올리기' · [스토리 올리기].
 */
export function StoryEditor({ img, onFraming, cat, branch, text, onText, spot, onSpot, typing, onTyping, feed, onFeed, pin, onPin, onRetake, onSubmit }: Props) {
  const insets = useSafeAreaInsets();
  // 글 쓰는 칸: 키보드와 같은 프레임에 올라가요 (아이폰 · UI 스레드)
  const kbLift = useKeyboardLiftStyle(24);
  const top = Math.max(insets.top, 12) + 4;
  const { bg, fg } = storyChipColors(cat);
  // 적는 글은 입력칸이 들고 있어요 (value 로 다시 넣지 않아요 — 한글 조합 중에 덮어쓰면 'ㅏ안녕'처럼 자모가 남아요)
  const draft = useRef(text);
  // 적는 동안 고르는 색 (미리 보기) — 다 적으면 스티커에 넣어요
  const [col, setCol] = useState(spot.c);
  const openTyping = () => {
    draft.current = text;
    setCol(spot.c);
    onTyping(true);
  };
  const finish = () => {
    onText(draft.current.trim().slice(0, MAX_TEXT));
    if (col !== spot.c) onSpot({ ...spot, c: col });
    onTyping(false);
  };
  const doneTyping = () => {
    finish();
    Keyboard.dismiss();
  };

  // 안드로이드 뒤로: 적는 중이면 적기만 닫고, 아니면 다시 찍기로 (스토리 창 전체를 닫지 않게)
  const onBack = useEffectEvent(() => {
    if (typing) finish();
    else onRetake();
  });
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => sub.remove();
  }, []);

  return (
    <View style={styles.root}>
      <PhotoFrame uri={img.uri} framing={img.framing} onChange={onFraming} hint={false} style={styles.photo} accessibilityLabel="스토리 사진 맞추기">
        <View style={[styles.top, { paddingTop: top }]} pointerEvents="box-none">
          <Pressable onPress={onRetake} accessibilityRole="button" accessibilityLabel="뒤로 · 다시 찍기" hitSlop={6} style={styles.round}>
            <LgIcon name="back" size={22} color={Colors.white} sw={2.6} />
          </Pressable>
          <Pressable onPress={openTyping} accessibilityRole="button" accessibilityLabel={text ? '사진 위 글 고치기' : '사진 위에 글 적기 (선택)'} hitSlop={6} style={styles.round}>
            <PText style={styles.aa}>Aa</PText>
          </Pressable>
        </View>
        {isPlainFraming(img.framing) ? (
          <View style={[styles.hint, { top: top + 52 }]} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <PText style={styles.hintT}>두 손가락으로 키우고 · 끌어서 맞춰요</PText>
          </View>
        ) : null}
        {text && !typing ? <DraggableSticker text={text} spot={spot} onMove={onSpot} onPress={openTyping} /> : null}
        <View style={styles.tags} pointerEvents="none">
          <View style={[styles.tag, { backgroundColor: bg }]}>
            <LgIcon name={LG_SCAT[cat].icon} size={13} color={fg} sw={2.4} />
            <PText style={[styles.tagT, { color: fg }]}>{LG_SCAT[cat].name}</PText>
          </View>
          {branch ? (
            <View style={[styles.tag, styles.tagBr]}>
              <LgIcon name="pin" size={13} color={Colors.white} sw={2.2} />
              <PText style={[styles.tagT, { color: Colors.white }]}>{branch}</PText>
            </View>
          ) : null}
        </View>
      </PhotoFrame>

      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 14) + 6 }]}>
        <Pressable onPress={onFeed} accessibilityRole="checkbox" accessibilityState={{ checked: feed }} accessibilityLabel="라운지 피드에도 올리기 · 24시간 뒤에도 남아요" style={styles.check}>
          <CheckBox on={feed} />
          <PText style={styles.checkT}>라운지 피드에도 올리기</PText>
          <PText style={styles.checkD}>24시간 뒤에도 남아요</PText>
        </Pressable>
        {pin !== null ? (
          <Pressable onPress={onPin} accessibilityRole="checkbox" accessibilityState={{ checked: pin }} accessibilityLabel="매니저 고정 · 사라지지 않고 맨 앞에 보여요" style={styles.check}>
            <CheckBox on={pin} />
            <PText style={styles.checkT}>매니저 고정</PText>
            <PText style={styles.checkD}>사라지지 않고 맨 앞에 보여요</PText>
          </Pressable>
        ) : null}
        <LgButton label="스토리 올리기" wide height={52} fontSize={15.5} onPress={onSubmit} style={styles.go} />
      </View>

      {typing ? (
        <Animated.View style={[styles.typing, { paddingTop: top + 50, paddingBottom: 24 }, kbLift]}>
          <Pressable onPress={doneTyping} accessibilityRole="button" accessibilityLabel="다 적었어요" hitSlop={8} style={[styles.done, { top }]}>
            <PText style={styles.doneT}>완료</PText>
          </Pressable>
          <View style={styles.labelEdit}>
            <StickerLabel c={col}>
              <TextInput
                defaultValue={text}
                onChangeText={(t) => {
                  draft.current = t;
                }}
                autoFocus
                multiline
                returnKeyType="done"
                submitBehavior="blurAndSubmit"
                onSubmitEditing={doneTyping}
                placeholder="사진 위에 적을 글 (안 적어도 돼요)"
                placeholderTextColor={stickerColor(col).fg === Colors.ink ? 'rgba(30,26,43,0.45)' : 'rgba(255,255,255,0.6)'}
                selectionColor={stickerColor(col).fg}
                accessibilityLabel="사진 위에 적을 글"
                style={[styles.input, { color: stickerColor(col).fg }]}
              />
            </StickerLabel>
          </View>
          <View style={styles.colorRow}>
            <StickerColors c={col} onPick={setCol} />
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

const DARK = '#0E0C14';
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DARK },
  photo: { flex: 1, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  top: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
  round: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(14,12,20,0.42)', alignItems: 'center', justifyContent: 'center' },
  aa: { fontFamily: Font.body900, fontSize: 16, lineHeight: 21, color: Colors.white },
  hint: { position: 'absolute', alignSelf: 'center', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(30,26,43,0.72)' },
  hintT: { fontFamily: Font.body800, fontSize: 11, lineHeight: 15, color: Colors.white },
  tags: { position: 'absolute', left: 14, bottom: 14, flexDirection: 'row', gap: 6 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 28, paddingHorizontal: 10, borderRadius: 14 },
  tagBr: { backgroundColor: 'rgba(14,12,20,0.55)' },
  tagT: { fontFamily: Font.body900, fontSize: 12, lineHeight: 16 },
  bottom: { paddingTop: 12, paddingHorizontal: 18, gap: 4 },
  check: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  checkT: { fontFamily: Font.body800, fontSize: 14, lineHeight: 19, color: Colors.white },
  checkD: { flex: 1, fontFamily: Font.body600, fontSize: 12, lineHeight: 17, color: 'rgba(255,255,255,0.6)' },
  go: { marginTop: 8 },
  typing: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(14,12,20,0.66)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  done: { position: 'absolute', right: 16, height: 42, paddingHorizontal: 16, borderRadius: 21, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  doneT: { fontFamily: Font.body900, fontSize: 14, lineHeight: 19, color: Colors.ink },
  labelEdit: { alignSelf: 'stretch' },
  colorRow: { marginTop: 18 },
  input: { minHeight: 34, padding: 0, fontFamily: Font.body900, fontSize: 19, lineHeight: 26, color: Colors.ink, textAlign: 'center', includeFontPadding: false, outlineWidth: 0 },
});
