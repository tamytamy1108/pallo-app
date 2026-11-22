import { Asset } from 'expo-asset';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Raised } from '@/components/ui/raised';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import type { Lesson, Pdf, StudyLevel } from '@/data/library';
import { sfx } from '@/lib/feedback';

/** 교재 표지 (프로토타입 .mini-cover) — 과 화면은 76×102, 교재 소개는 110 폭 */
const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: '"DM Serif Display", Georgia, serif' });
export function MiniCover({ color, n, l, s, width = 76, jp = false }: { color: string; n: string; l: string; s?: string; width?: number; jp?: boolean }) {
  const k = width / 76;
  return (
    <View style={[styles.cover, { width, height: (width * 102) / 76, backgroundColor: color, paddingTop: 10 * k, borderRadius: 8 }]}>
      <PText style={[jp ? styles.coverJp : styles.coverN, { fontSize: (jp ? 14 : 18) * k, lineHeight: (jp ? 17 : 18) * k }]} color={Colors.white}>
        {n}
      </PText>
      <View style={[styles.coverL, { marginTop: 7 * k, paddingHorizontal: 8 * k }]}>
        <PText style={[styles.coverLText, { fontSize: 10 * k, lineHeight: 14 * k }]} color={Colors.white}>
          {l}
        </PText>
      </View>
      {s ? (
        <PText style={[styles.coverS, { fontSize: 6.5 * k, lineHeight: 9 * k, marginTop: 6 * k }]} color={Colors.white}>
          {s}
        </PText>
      ) : null}
    </View>
  );
}

/** 위 머리: 표지 + LESSON 01 · 제목 · 한 줄 이야기 (프로토타입 .st-hero) */
export function UnitHero({ L, ls }: { L: StudyLevel; ls: Lesson }) {
  const kick = L.kind === 'topic' || ls.no >= 100 ? `SESSION #${ls.no}` : `LESSON ${String(ls.no).padStart(2, '0')}`;
  return (
    <View style={styles.hero}>
      <Raised radius={8} style={styles.coverShadow}>
        <MiniCover color={L.c} n="PALLO" l={`Lv.${L.lv}`} s={L.series} />
      </Raised>
      <View style={styles.heroT}>
        <PText style={styles.kick}>{kick}</PText>
        <PText style={styles.h1}>{ls.title}</PText>
        <PText style={styles.heroP}>{ls.sub}</PText>
      </View>
    </View>
  );
}

const PDF_FILES: Record<string, number> = {
  'assets/lv3-101-the-present.pdf': require('@/assets/images/library/lv3-101-the-present.pdf'),
  'assets/lv4-101-the-present.pdf': require('@/assets/images/library/lv4-101-the-present.pdf'),
};

/** 회차 자료 PDF 내려받기 (프로토타입 .st-pdf) */
async function openPdf(pdf: Pdf) {
  sfx('tap');
  const mod = PDF_FILES[pdf.path];
  if (!mod) return;
  try {
    const a = Asset.fromModule(mod);
    await a.downloadAsync();
    await Linking.openURL(a.localUri ?? a.uri);
    showToast('자료를 내려받았어요');
  } catch {
    showToast('잠시 뒤 다시 눌러 주세요');
  }
}

/** 이번 과 핵심 (오늘의 패턴 · 이번 회차) 카드 (프로토타입 .st-sum) */
export function UnitSummary({ L, ls }: { L: StudyLevel; ls: Lesson }) {
  const d = ls.data;
  if (!d) return null;
  const rows: [string, string][] =
    d.kind === 'pattern'
      ? d.patterns.map((p) => [p.p, p.m])
      : d.kind === 'topic'
        ? [
            [`DAILY TOPIC · ${ls.title}`, '질문 6개 · 키워드 12개'],
            [`TOPIC · ${d.topicTitle}`, '지문 낭독 · USEFUL EXPRESSIONS 6개'],
          ]
        : [
            [`FREE TALK · ${ls.title}`, '질문 5 · SAY IT BETTER 5'],
            [d.q, d.qKo],
          ];
  const pdf = d.kind === 'pattern' ? undefined : d.pdf;
  return (
    <Raised radius={22} style={styles.tight}>
      <View style={styles.sum}>
        <PText style={styles.sumH}>{L.kind === 'pattern' ? '오늘의 패턴' : '이번 회차'}</PText>
        {rows.map(([b, s], i) => (
          <View key={i} style={styles.pl}>
            <View style={styles.plI}>
              <PText style={styles.plIText}>{i + 1}</PText>
            </View>
            <View style={styles.plT}>
              <PText style={styles.plB}>{b}</PText>
              <PText style={styles.plS}>{s}</PText>
            </View>
          </View>
        ))}
        {pdf && (
          <Pressable onPress={() => openPdf(pdf)} accessibilityRole="button" accessibilityLabel="자료 다운받기" style={({ pressed }) => [styles.pdf, pressed && styles.pdfPressed]}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={Colors.ink} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
            </Svg>
            <View>
              <PText style={styles.pdfB}>자료 다운받기</PText>
              <PText style={styles.pdfS}>PDF · {pdf.size}</PText>
            </View>
          </Pressable>
        )}
      </View>
    </Raised>
  );
}

/** 헤드폰 (프로토타입 ICO_HP) */
export function HeadphoneIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={Colors.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 15v-3a8 8 0 0 1 16 0v3M4 15h3v5H4zM17 15h3v5h-3z" />
    </Svg>
  );
}

/** 보라 리스닝 룸 카드 (프로토타입 .st-lrbtn) */
export function ListenCard({ sub, onPress }: { sub: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`리스닝 룸 · ${sub}`}>
      {({ pressed }) => (
        <Raised radius={22} pressed={pressed} style={styles.tight}>
          <View style={styles.lr}>
            <View style={styles.lrIc}>
              <HeadphoneIcon />
            </View>
            <View style={styles.lrT}>
              <PText style={styles.lrB} color={Colors.white}>
                리스닝 룸
              </PText>
              <PText style={styles.lrS} numberOfLines={1}>
                {sub}
              </PText>
            </View>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={Colors.white} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
              <Path d="m9 6 6 6-6 6" />
            </Svg>
          </View>
        </Raised>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // 그림자는 간격 안으로 (CSS box-shadow 처럼 자리를 차지하지 않게)
  tight: { marginBottom: 0 },
  cover: { borderWidth: 2, borderColor: Colors.ink, alignItems: 'center' },
  coverShadow: { marginRight: 0, marginBottom: 0 },
  coverN: { fontFamily: SERIF },
  coverJp: { fontFamily: Font.body700, textAlign: 'center', paddingHorizontal: 4 },
  coverL: { borderWidth: 1, borderColor: Colors.white, borderRadius: 999 },
  coverLText: { fontFamily: SERIF },
  coverS: { fontFamily: SERIF, letterSpacing: 0.5, textAlign: 'center', paddingHorizontal: 4 },
  hero: { flexDirection: 'row', alignItems: 'flex-end', gap: 14 },
  heroT: { flex: 1, minWidth: 0 },
  kick: { fontFamily: Font.display, fontSize: 11, lineHeight: 14, letterSpacing: 0.3, color: Colors.inkSub },
  h1: { marginTop: 4, fontFamily: Font.display, fontSize: 24, lineHeight: 27.6, letterSpacing: -0.8 },
  heroP: { marginTop: 5, fontFamily: Font.body600, fontSize: 13, lineHeight: 18.2, color: Colors.inkSub },
  sum: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 22, backgroundColor: Colors.white, paddingVertical: 14, paddingHorizontal: 16, gap: 10 },
  sumH: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  pl: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  plI: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow, alignItems: 'center', justifyContent: 'center' },
  plIText: { fontFamily: Font.body900, fontSize: 11, lineHeight: 14 },
  plT: { flex: 1, minWidth: 0 },
  plB: { fontFamily: Font.body900, fontSize: 14.5, lineHeight: 19.6 },
  plS: { marginTop: 1, fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
  pdf: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow, boxShadow: `0 3px 0 ${Colors.ink}` },
  pdfPressed: { transform: [{ translateY: 3 }], boxShadow: `0 0 0 ${Colors.ink}` },
  pdfB: { fontFamily: Font.body900, fontSize: 14.5, lineHeight: 20 },
  pdfS: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: '#5A4A00' },
  lr: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 22, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.purple },
  lrIc: { width: 44, height: 44, borderRadius: 14, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow, alignItems: 'center', justifyContent: 'center' },
  lrT: { flex: 1, minWidth: 0, gap: 2 },
  lrB: { fontFamily: Font.body900, fontSize: 15, lineHeight: 19.5 },
  lrS: { fontFamily: Font.body600, fontSize: 12, lineHeight: 17, color: 'rgba(255,255,255,0.75)' },
});
