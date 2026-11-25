import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { C, CLUB_ACT, CLUB_CATS, type Club, type ClubCat } from '@/data/meet';
import { ChipScroll } from '@/components/ui/chip-scroll';
import { CardArt } from '@/components/ui/card-art';
import type { CardDesign } from '@/data/poster-colors';

import { Icon, type IconName } from './icons';
import { useMeetStore } from './meet-store';
import { clubCat, clubDesc, clubX } from './model';
import { isDarkBg, posterSlides } from './poster';

/** 동아리 목록 썸네일 (64 · 포스터 첫 줄만 · 사진이면 사진) — 카드 만들기 미리보기도 이걸 써요 */
export function ClubThumb({ words, bg, uri, design }: { words: string[]; bg: string; uri?: string; /** 만든 카드면 그 디자인 */ design?: CardDesign }) {
  const w0 = words[0] ?? '';
  const fs = w0.length <= 4 ? 13 : w0.length <= 6 ? 10.5 : 8.5;
  if (design && !uri)
    return (
      <View style={styles.th}>
        <CardArt design={design} color={bg} words={[w0]} />
      </View>
    );
  return (
    <View style={[styles.th, { backgroundColor: bg }]}>
      {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
      <PText style={{ width: 200, fontFamily: Font.display, fontSize: fs, lineHeight: fs, color: isDarkBg(bg) ? C.y : C.ink }}>{uri ? '' : w0}</PText>
    </View>
  );
}

/** 동아리 한 줄 (프로토타입 lgClubRow · .lg-cr): 포스터 썸네일 · 이름 · 한 줄 소개 · 카테고리 · 지점 · 멤버 수 · 최근 대화 */
/** onOpen: 시트 안 등에서 열 때 (안 주면 바로 상세로) */
export function ClubRow({ c, first, onOpen }: { c: Club; first?: boolean; onOpen?: () => void }) {
  const inC = useMeetStore((s) => s.club[c.id] === 'in');
  const { words, bg, uri, made, design } = posterSlides(c.id, true, c.posters, c.card)[0];
  const x = clubX(c);
  const cat = clubCat(c);
  return (
    <Pressable onPress={onOpen ?? (() => router.push(`/club/${c.id}`))} accessibilityRole="button" accessibilityLabel={`${c.name} 자세히 보기`} style={({ pressed }) => [styles.row, !first && styles.rowLine, pressed && { opacity: 0.7 }]}>
      <ClubThumb words={words} bg={bg} uri={uri} design={made ? (design ?? 'circle') : undefined} />
      <View style={styles.tx}>
        <View style={styles.tRow}>
          <PText numberOfLines={1} style={styles.t}>
            {c.name}
          </PText>
          {x.fresh ? <PText style={styles.nw}>NEW</PText> : null}
        </View>
        <PText numberOfLines={1} style={styles.d}>
          {clubDesc(c)}
        </PText>
        <PText numberOfLines={1} style={styles.m}>
          {cat ? cat[1] + ' · ' : ''}
          {c.br}
          {c.reg ? ' · ' + c.reg : ''} · 멤버 {c.n + (inC ? 1 : 0)}
          {c.max > 0 ? '' : ' · 인원 무관'}
          <PText style={styles.em}>{'  ' + x.act}</PText>
        </PText>
      </View>
    </Pressable>
  );
}

type Sort = 'rec' | 'big' | 'new';
const SORTS: [Sort, string][] = [
  ['rec', '추천'],
  ['big', '멤버 많은 순'],
  ['new', '새로 생긴'],
];

/** 동아리 목록 (프로토타입 lgClubList): 카테고리 아이콘 줄 + 정렬 + 한 줄 목록, 5개 넘으면 더보기 */
export function ClubList({ clubs }: { clubs: Club[] }) {
  const [cat, setCat] = useState<ClubCat | 'all'>('all');
  const [sort, setSort] = useState<Sort>('rec');
  const [more, setMore] = useState(false);
  const joined = useMeetStore((s) => s.club);
  const cnum = (c: Club) => c.n + (joined[c.id] === 'in' ? 1 : 0);
  const count = (k: string) => clubs.filter((c) => k === 'all' || c.cc === k).length;
  let L = clubs.filter((c) => cat === 'all' || c.cc === cat);
  L = L.slice().sort(
    sort === 'big'
      ? (a, b) => cnum(b) - cnum(a)
      : sort === 'new'
        ? (a, b) => Number(clubX(b).fresh) - Number(clubX(a).fresh) || (b.id > a.id ? 1 : -1)
        : (a, b) => CLUB_ACT.indexOf(clubX(a).act) - CLUB_ACT.indexOf(clubX(b).act),
  );
  const show = more ? L : L.slice(0, 5);
  const cats: [ClubCat | 'all', string, IconName][] = [['all', '전체', 'grid'], ...CLUB_CATS.map(([k, l, ic]): [ClubCat, string, IconName] => [k, l, ic])];
  return (
    <>
      <ChipScroll horizontal showsHorizontalScrollIndicator={false} style={styles.cicons} contentContainerStyle={styles.ciconsIn} accessibilityRole="tablist" accessibilityLabel="동아리 카테고리">
        {cats.map(([k, l, ic]) => {
          const on = cat === k;
          return (
            <Pressable key={k} onPress={() => setCat(k)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={[styles.cib, !count(k) && { opacity: 0.45 }]}>
              <View>
                {on ? <View style={styles.ciShadow} /> : null}
                <View style={[styles.ci, on && styles.ciOn]}>
                  <Icon name={ic} size={24} />
                </View>
              </View>
              <PText style={[styles.ciT, on && { fontFamily: Font.body900 }]}>{l}</PText>
            </Pressable>
          );
        })}
      </ChipScroll>
      <ChipScroll horizontal showsHorizontalScrollIndicator={false} style={styles.csort} contentContainerStyle={styles.csortIn}>
        {SORTS.map(([k, l]) => {
          const on = sort === k;
          return (
            <Pressable key={k} onPress={() => setSort(k)} accessibilityRole="button" accessibilityState={{ selected: on }} style={[styles.sb, on && styles.sbOn]}>
              <PText style={[styles.sbT, on && styles.sbTOn]}>{l}</PText>
            </Pressable>
          );
        })}
      </ChipScroll>
      {L.length ? (
        <>
          <View>
            {show.map((c, i) => (
              <ClubRow key={c.id} c={c} first={i === 0} />
            ))}
          </View>
          {L.length > 5 ? (
            <Pressable onPress={() => setMore(!more)} accessibilityRole="button" style={styles.cmore}>
              <PText style={styles.cmoreT}>{more ? '접기' : `더보기 · ${L.length - 5}개 ›`}</PText>
            </Pressable>
          ) : null}
        </>
      ) : (
        <PText style={styles.empty}>{'이 카테고리 동아리가 아직 없어요.\n첫 동아리를 만들어 보세요!'}</PText>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rowLine: { borderTopWidth: 1.5, borderColor: Colors.line },
  th: { width: 64, height: 64, borderWidth: 2, borderColor: Colors.ink, borderRadius: 16, justifyContent: 'flex-end', paddingLeft: 7, paddingBottom: 7, overflow: 'hidden' },
  tx: { flex: 1, minWidth: 0, gap: 3 },
  tRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  t: { flexShrink: 1, fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  nw: { fontFamily: Font.body900, fontSize: 10.5, lineHeight: 14, letterSpacing: 0.3, color: C.pk },
  d: { fontFamily: Font.body600, fontSize: 12.5, lineHeight: 19, color: Colors.inkSub },
  m: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  em: { fontFamily: Font.body900, fontSize: 12, color: C.pk },
  cicons: { marginHorizontal: -16, marginTop: 2, flexGrow: 0 },
  ciconsIn: { gap: 4, paddingTop: 4, paddingBottom: 2, paddingHorizontal: 12 },
  cib: { width: 68, alignItems: 'center', gap: 6 },
  ci: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  ciOn: { backgroundColor: Colors.yellow },
  ciShadow: { position: 'absolute', top: 2, left: 2, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.ink },
  ciT: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16 },
  csort: { marginHorizontal: -16, flexGrow: 0 },
  csortIn: { gap: 6, paddingVertical: 2, paddingHorizontal: 16 },
  sb: { height: 32, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: Colors.line, backgroundColor: Colors.white, justifyContent: 'center' },
  sbOn: { borderWidth: 2, borderColor: Colors.ink },
  sbT: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 17, color: Colors.inkSub },
  sbTOn: { fontFamily: Font.body900, color: Colors.ink },
  cmore: { height: 44, marginTop: 2, borderTopWidth: 1, borderColor: Colors.line, alignItems: 'center', justifyContent: 'center' },
  cmoreT: { fontFamily: Font.body800, fontSize: 13.5, lineHeight: 19, color: Colors.inkSub },
  empty: { textAlign: 'center', paddingVertical: 30, paddingHorizontal: 10, fontFamily: Font.body700, fontSize: 14, lineHeight: 22, color: Colors.inkSub },
});
