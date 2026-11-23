import { Image } from 'expo-image';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Pressable } from '@/components/ui/pressable';
import { Raised } from '@/components/ui/raised';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors, Radius } from '@/constants/theme';
import { BR_BOARDS, MY_BRANCHES, type BranchItem } from '@/data/my';
import { sfx } from '@/lib/feedback';

import { Lift } from './lift';

/** 지점 안내 아이콘 (프로토타입 BR_IC) */
const BR_IC = {
  park: 'M4 3h16v18H4zM9 17V7h4a3 3 0 0 1 0 6H9',
  wifi: 'M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01',
  loc: 'M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  lock: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4',
  tel: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2',
  pin: 'M12 17v5M9 3h6l-1 6 3 3H7l3-3z',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
} as const;
function BrIc({ k, size = 20, color = Colors.ink }: { k: keyof typeof BR_IC; size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d={BR_IC[k]} />
    </Svg>
  );
}

type NavLike = { clipboard?: { writeText: (t: string) => Promise<void> } };
const copyText = (v: string) => {
  if (Platform.OS !== 'web') return;
  const nav = (globalThis as { navigator?: NavLike }).navigator;
  nav?.clipboard?.writeText(v).catch(() => {});
};

/** 지점 둘 이상이면 위 칸 고르기 (프로토타입 .br-seg) */
function BranchSeg({ value, onChange }: { value: string; onChange: (b: string) => void }) {
  if (MY_BRANCHES.length < 2) return null;
  return (
    <View style={styles.seg} accessibilityRole="tablist">
      {MY_BRANCHES.map((b) => {
        const on = b === value;
        return (
          <Pressable
            key={b}
            onPress={() => {
              sfx('tap');
              onChange(b);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[styles.segBtn, on && styles.segOn]}>
            <PText style={[styles.segT, on && styles.segTOn]}>{b}</PText>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * 마이 › 지점 안내 보드 (프로토타입 #brBoard .brb): 지점 고르기 · 자주 찾는 4칸 · 매니저 고정 글.
 * [전체 보기 ›] · 칸 · 고정 글을 누르면 지점 안내 전체 (프로토타입은 겹쳐 뜨는 화면 — 앱은 키 큰 시트).
 */
export function BranchBoard() {
  const [sel, setSel] = useState(MY_BRANCHES[0]);
  const [open, setOpen] = useState(false);
  const B = BR_BOARDS[sel] ?? BR_BOARDS['하남점'];
  const star = B.items.filter((x) => x.star).slice(0, 4);
  const go = () => {
    sfx('tap');
    setOpen(true);
  };
  return (
    <>
      <Raised radius={Radius.card} style={styles.boardWrap}>
        <View style={styles.board}>
          <View style={styles.hd}>
            <PText style={styles.hdT}>{MY_BRANCHES.length > 1 ? '지점 안내' : `${sel} 안내`}</PText>
            <Pressable onPress={go} accessibilityRole="button" accessibilityLabel="지점 안내 전체 보기" hitSlop={10}>
              <PText style={styles.hdLink}>전체 보기 ›</PText>
            </Pressable>
          </View>
          <BranchSeg value={sel} onChange={setSel} />
          <View style={styles.sc}>
            {star.map((x) => (
              <Pressable key={x.t} onPress={go} accessibilityRole="button" accessibilityLabel={x.t} style={styles.it}>
                {({ pressed }) => (
                  <>
                    <Lift radius={16} pressed={pressed}>
                      <View style={[styles.itIc, { backgroundColor: x.bg }]}>
                        <BrIc k={x.ic} size={22} />
                      </View>
                    </Lift>
                    <PText style={styles.itT}>{x.s || x.t.split(' · ')[0]}</PText>
                  </>
                )}
              </Pressable>
            ))}
          </View>
          {B.pin && (
            <Pressable onPress={go} accessibilityRole="button" style={styles.pin}>
              <View style={styles.pinIc}>
                <BrIc k="pin" size={15} />
              </View>
              <PText style={styles.pinT}>
                {B.pin.t} · {B.pin.by}
              </PText>
            </Pressable>
          )}
        </View>
      </Raised>
      <BranchInfoSheet open={open} onClose={() => setOpen(false)} sel={sel} onSel={setSel} />
    </>
  );
}

/** 지점 안내 전체 (프로토타입 brInfoHTML): 지점 카드 · 고정 글 · 항목(복사 · 지도 · 전화) · 협업 업체 */
function BranchInfoSheet({ open, onClose, sel, onSel }: { open: boolean; onClose: () => void; sel: string; onSel: (b: string) => void }) {
  const B = BR_BOARDS[sel] ?? BR_BOARDS['하남점'];
  const loc = B.items.find((x) => x.ic === 'loc');
  const act = (x: BranchItem) => {
    if (!x.act) return;
    const [k, v] = x.act;
    showToast(k === 'map' ? '지도 앱으로 길찾기를 열어요' : `${v}로 전화를 걸어요`);
  };
  return (
    <Sheet open={open} onClose={onClose} title="지점 안내" tall label="지점 안내">
      <BranchSeg value={sel} onChange={onSel} />
      <Raised radius={Radius.card}>
        <View style={styles.hero}>
          <PText style={styles.heroK}>MY BRANCH</PText>
          <PText style={styles.heroB}>{sel}</PText>
          <PText style={styles.heroS}>{B.addr}</PText>
          <PText style={styles.heroS}>{B.hrs}</PText>
          {loc && (
            <Pressable onPress={() => act(loc)} accessibilityRole="button" accessibilityLabel="지도" style={styles.heroMap}>
              <BrIc k="loc" size={14} />
              <PText style={styles.heroMapT}>지도</PText>
            </Pressable>
          )}
          <Image source={require('@/assets/characters/c-upright-yellow.png')} style={styles.heroImg} contentFit="contain" />
        </View>
      </Raised>
      {B.pin && (
        <View style={styles.pin}>
          <View style={styles.pinIc}>
            <BrIc k="pin" size={15} />
          </View>
          <PText style={styles.pinT}>
            {B.pin.t} · {B.pin.by}
          </PText>
        </View>
      )}
      <Raised radius={Radius.card}>
        <View style={styles.list}>
          {B.items
            .filter((x) => x.ic !== 'loc')
            .map((x, i) => (
              <View key={x.t} style={[styles.li, i > 0 && styles.liLine]}>
                <View style={[styles.liIc, { backgroundColor: x.bg }]}>
                  <BrIc k={x.ic} size={18} />
                </View>
                <View style={styles.liTx}>
                  <PText style={styles.liB}>{x.t}</PText>
                  {!!x.d && <PText style={styles.liP}>{x.d}</PText>}
                  {x.cp?.length === 1 && <PText style={[styles.liP, styles.liCl]}>{x.cp[0][0]}</PText>}
                  {(x.cp ?? []).map(([l, v]) => (
                    <Pressable
                      key={v}
                      onPress={() => {
                        copyText(v);
                        sfx('tap');
                        showToast(`${l.split(' · ')[0]} 복사했어요 · ${v}`);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`${l} ${v} 복사`}
                      style={styles.val}>
                      <PText style={styles.valCode}>{v}</PText>
                      <View style={styles.valCi}>
                        <BrIc k="copy" size={16} color={Colors.purple} />
                      </View>
                    </Pressable>
                  ))}
                </View>
                {x.act && (
                  <Pressable onPress={() => act(x)} accessibilityRole="button" style={styles.liGo}>
                    <PText style={styles.liGoT}>{x.act[0] === 'map' ? '지도' : '전화'}</PText>
                  </Pressable>
                )}
              </View>
            ))}
        </View>
      </Raised>
      {B.partners.length > 0 && (
        <>
          <View style={styles.ph}>
            <PText style={styles.phB}>협업 업체 · 멤버 혜택</PText>
            <PText style={styles.phS}>{B.partners.length}곳</PText>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ptn}>
            {B.partners.map((p) => (
              <Raised key={p.n} radius={Radius.card}>
                <View style={styles.pc}>
                  <View style={[styles.pcIm, { backgroundColor: p.c }]}>
                    <PText style={styles.pcW}>{p.w}</PText>
                  </View>
                  <View style={styles.pcB}>
                    <PText style={styles.pcK}>협업 업체</PText>
                    <PText style={styles.pcN}>{p.n}</PText>
                    <PText style={styles.pcS}>{p.b}</PText>
                  </View>
                </View>
              </Raised>
            ))}
          </ScrollView>
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  boardWrap: { marginTop: 12 },
  board: { padding: 14, borderWidth: 2, borderColor: Colors.ink, borderRadius: Radius.card, backgroundColor: Colors.white },
  hd: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hdT: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  hdLink: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 18, color: Colors.purple, paddingVertical: 6 },
  seg: { flexDirection: 'row', gap: 4, marginTop: 10, padding: 4, borderRadius: 14, backgroundColor: '#EFE8D8' },
  segBtn: { flex: 1, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.ink },
  segT: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18, color: Colors.inkSub },
  segTOn: { color: Colors.ink },
  sc: { flexDirection: 'row', gap: 8, marginTop: 12 },
  it: { flex: 1, alignItems: 'center', gap: 6 },
  itIc: { width: 48, height: 48, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  itT: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17 },
  pin: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, backgroundColor: '#FFF6C2' },
  pinIc: { marginTop: 2 },
  pinT: { flex: 1, fontFamily: Font.body800, fontSize: 12.5, lineHeight: 18 },
  hero: { overflow: 'hidden', paddingTop: 16, paddingHorizontal: 16, paddingBottom: 18, borderRadius: Radius.card, backgroundColor: Colors.purple, borderWidth: 2, borderColor: Colors.ink, gap: 2 },
  heroK: { fontFamily: Font.body900, fontSize: 11, lineHeight: 15, color: Colors.yellow, letterSpacing: 1 },
  heroB: { fontFamily: Font.display, fontSize: 22, lineHeight: 28, color: Colors.white, marginTop: 2, marginBottom: 4 },
  heroS: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18, color: '#E3DBF7', maxWidth: '76%' },
  heroMap: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10, height: 30, paddingHorizontal: 12, borderRadius: 15, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow },
  heroMapT: { fontFamily: Font.body900, fontSize: 12, lineHeight: 16 },
  heroImg: { position: 'absolute', right: -6, bottom: -14, width: 84, height: 54 },
  list: { overflow: 'hidden', borderWidth: 2, borderColor: Colors.ink, borderRadius: Radius.card, backgroundColor: Colors.white },
  li: { flexDirection: 'row', gap: 12, paddingVertical: 13, paddingHorizontal: 14 },
  liLine: { borderTopWidth: 1.5, borderColor: Colors.line },
  liIc: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  liTx: { flex: 1, minWidth: 0 },
  liB: { fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  liP: { marginTop: 2, fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  liCl: { fontSize: 11, marginTop: 6 },
  val: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', maxWidth: '100%', marginTop: 6 },
  valCode: { flexShrink: 1, fontFamily: Font.body900, fontSize: 13, lineHeight: 18, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#F3EEE2', overflow: 'hidden' },
  valCi: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3EEE2' },
  liGo: { alignSelf: 'center', height: 30, paddingHorizontal: 12, borderRadius: 15, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow, justifyContent: 'center' },
  liGoT: { fontFamily: Font.body900, fontSize: 12, lineHeight: 16 },
  ph: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 },
  phB: { fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  phS: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17, color: Colors.purple },
  ptn: { gap: 10, paddingTop: 2, paddingBottom: 8, paddingRight: 8 },
  pc: { width: 150, overflow: 'hidden', borderWidth: 2, borderColor: Colors.ink, borderRadius: Radius.card, backgroundColor: Colors.white },
  pcIm: { height: 80, justifyContent: 'flex-end', paddingVertical: 8, paddingHorizontal: 10 },
  pcW: { fontFamily: Font.display, fontSize: 13, lineHeight: 17, color: Colors.white },
  pcB: { paddingTop: 9, paddingHorizontal: 10, paddingBottom: 11 },
  pcK: { fontFamily: Font.body900, fontSize: 10.5, lineHeight: 14, color: Colors.purple },
  pcN: { fontFamily: Font.body900, fontSize: 13.5, lineHeight: 19 },
  pcS: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub },
});
