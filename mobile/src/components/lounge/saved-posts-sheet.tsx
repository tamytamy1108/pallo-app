import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { FramedImage } from '@/components/ui/photo-frame';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { type Abroad, LG_C, type Post } from '@/data/lounge';
import { toggleSave, useLounge } from '@/data/lounge-store';
import { whenLabel } from '@/lib/when';

import { LgIcon } from './icons';
import { PIC_BG } from './pics';

type Saved = Post | Abroad;

/** 라운지 저장함에 모은 글 (최근에 저장한 게 위) — 없어진 글 · 글이 아닌 것은 빼요 */
export function useSavedPosts(): Saved[] {
  const saved = useLounge((s) => s.saved);
  const feed = useLounge((s) => s.feed);
  const byId = new Map(feed.map((p) => [p.id, p]));
  return Object.keys(saved)
    .filter((id) => saved[id])
    .reverse()
    .map((id) => byId.get(id))
    .filter((p): p is Saved => !!p && (p.k === 'post' || p.k === 'abroad'));
}

/** 저장함 화면 위 줄 제목 ('라운지 저장함 3개') */
export const useSavedPostsTitle = () => `라운지 저장함 ${useSavedPosts().length}개`;

/**
 * 라운지 저장함 목록 몸통: 글 아래 책갈피(저장)로 모은 글. 누르면 그 글 하나 보기(/post/[id]) — 지금 화면 위에 쌓여요.
 * 토스트 '라운지 저장함에 담았어요' [보러가기] 는 저장함 화면(/me/saved?box=posts)을 열어요 (lib/see) — 그 화면의 몸통이에요.
 */
export function SavedPostsList() {
  const list = useSavedPosts();
  const go = (id: string) => router.push({ pathname: '/post/[id]', params: { id } });
  if (!list.length) return <PText style={styles.empty}>{'라운지 글 아래 책갈피를 누르면 여기 모여요.'}</PText>;
  return (
    <>
      {list.map((p, i) => (
        <View key={p.id} style={[styles.row, i > 0 && styles.line]}>
          <Pressable onPress={() => go(p.id)} accessibilityRole="button" accessibilityLabel={`${p.who}의 글 열기`} style={styles.main}>
            <Thumb p={p} />
            <View style={styles.tx}>
              <PText numberOfLines={1} style={styles.t}>
                {p.k === 'abroad' ? p.title : p.text || `${p.who}의 사진`}
              </PText>
              <PText numberOfLines={1} style={styles.sub}>
                {`${p.who} · ${p.br} · ${whenLabel(p.time, p.at)}`}
              </PText>
            </View>
          </Pressable>
          <Pressable onPress={() => toggleSave(p.id)} accessibilityRole="button" accessibilityLabel="저장 취소" accessibilityState={{ selected: true }} hitSlop={6} style={styles.save}>
            <LgIcon name="save" size={21} fill={LG_C.y} />
          </Pressable>
        </View>
      ))}
    </>
  );
}

/** 작은 사진 칸: 올린 사진 · 그림 글은 그 바탕색 · 해외살이 글은 나라 도장 */
function Thumb({ p }: { p: Saved }) {
  if (p.k === 'abroad') {
    return (
      <View style={[styles.thumb, { backgroundColor: LG_C.lsky }]}>
        <PText style={styles.cc}>{p.cc}</PText>
      </View>
    );
  }
  const img = p.imgs?.[0];
  return (
    <View style={[styles.thumb, { backgroundColor: img ? Colors.line : PIC_BG[p.pic ?? 'party'] }]}>
      {img ? <FramedImage uri={img} framing={p.frames?.[0]} /> : <LgIcon name="image" size={20} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  line: { borderTopWidth: 1.5, borderColor: Colors.line },
  main: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  thumb: { width: 42, height: 42, borderRadius: 12, borderWidth: 2, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cc: { fontFamily: Font.body900, fontSize: 12, lineHeight: 16 },
  tx: { flex: 1, minWidth: 0, gap: 2 },
  t: { fontFamily: Font.body900, fontSize: 14.5, lineHeight: 20 },
  sub: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  save: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', paddingVertical: 30, paddingHorizontal: 10, fontFamily: Font.body700, fontSize: 14, lineHeight: 22, color: Colors.inkSub },
});
